/**
 * Pyodide Worker with Event-Driven Architecture
 * Runs Python code in a separate thread and emits events for state changes
 */

import type { CarEvent, StateChangedEvent } from '../lib/carEvents';
import type { WorkerMessage } from '../lib/messageQueue';

interface WorkerRequest<T = any> {
  id: string;
  type: 'init' | 'execute' | 'sensor-update' | 'ping' | 'terminate' | 'load-module';
  payload?: T;
}

let pyodide: any = null;
let isInitialized = false;
let carState = {
  leftMotorSpeed: 0,
  rightMotorSpeed: 0,
  leftMotorDirection: 0,
  rightMotorDirection: 0,
  frontDistance: 100,
  leftDistance: 100,
  rightDistance: 100,
};

/**
 * Send event to main thread
 */
function emitEvent(event: CarEvent): void {
  console.log('[PyodideWorker] EMIT EVENT:', event.type, event);
  self.postMessage({
    type: 'event',
    payload: event,
    timestamp: Date.now(),
  });
}

/**
 * Initialize Pyodide
 */
async function initPyodide(): Promise<void> {
  try {
    console.log('[PyodideWorker] Loading Pyodide...');

    // Dynamically import pyodide
    const script = await fetch(
      'https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js'
    );
    
    if (!script.ok) {
      throw new Error(`Failed to load Pyodide script: HTTP ${script.status}`);
    }
    
    const scriptText = await script.text();
    eval(scriptText);

    const loadPyodide = (self as any).loadPyodide;
    if (!loadPyodide) {
      throw new Error('loadPyodide function not available after script execution');
    }

    pyodide = await loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.23.4/full/',
    });

    console.log('[PyodideWorker] Pyodide loaded, loading OBOCar module...');

    // Load OBOCar module
    await loadOBOCarModule();

    console.log('[PyodideWorker] OBOCar loaded, patching environment...');

    // Patch Python environment
    await patchPythonEnvironment();

    isInitialized = true;

    console.log('[PyodideWorker] Initialized successfully');

    emitEvent({
      type: 'execution:started',
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('[PyodideWorker] Init failed:', error);
    emitEvent({
      type: 'error:occurred',
      message: `Initialization failed: ${error.message}`,
      timestamp: Date.now(),
    });
  }
}

/**
 * Load OBOCar module from public folder with retry logic
 */
async function loadOBOCarModule(): Promise<void> {
  let lastError: any = null;
  
  // Try up to 3 times with different URL approaches
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      let url: string;
      
      if (attempt === 1) {
        // First attempt: use origin-based URL
        url = new URL('/obocar.py', self.location.origin).href;
      } else if (attempt === 2) {
        // Second attempt: use self.location.href as base
        url = new URL('obocar.py', self.location.href).href;
      } else {
        // Third attempt: try direct CDN-like path
        const origin = self.location.origin;
        url = `${origin}/obocar.py`;
      }

      console.log(`[PyodideWorker] Attempt ${attempt}: Fetching OBOCar from:`, url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const code = await response.text();

      if (!code || code.length === 0) {
        throw new Error('OBOCar file is empty');
      }

      console.log('[PyodideWorker] OBOCar file size:', code.length, 'bytes');
      pyodide.FS.writeFile('/obocar.py', code);

      await pyodide.runPythonAsync(`
import sys
if '/' not in sys.path:
    sys.path.insert(0, '/')
      `);

      console.log('[PyodideWorker] OBOCar module loaded successfully');
      return; // Success!
    } catch (error: any) {
      lastError = error;
      console.warn(
        `[PyodideWorker] Attempt ${attempt} failed:`,
        error.message
      );

      // Wait before retrying
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }
  }

  // All attempts failed
  console.error('[PyodideWorker] All OBOCar load attempts failed');
  throw new Error(
    `Failed to load obocar after 3 attempts: ${lastError?.message || 'Unknown error'}`
  );
}

/**
 * Patch Python environment to emit events on state changes
 */
async function patchPythonEnvironment(): Promise<void> {
  // Create bridge function to send events from Python to JS
  const sendStateChangeEvent = (stateJson: string) => {
    try {
      const state = JSON.parse(stateJson);
      emitEvent({
        type: 'state:changed',
        leftMotorSpeed: state.leftMotorSpeed,
        rightMotorSpeed: state.rightMotorSpeed,
        leftMotorDirection: state.leftMotorDirection,
        rightMotorDirection: state.rightMotorDirection,
        frontDistance: state.frontDistance,
        leftDistance: state.leftDistance,
        rightDistance: state.rightDistance,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('[PyodideWorker] Failed to parse state:', error);
    }
  };

  // Register callback in Pyodide
  pyodide.globals.set('sendStateChangeEvent', sendStateChangeEvent);

  await pyodide.runPythonAsync(`
import sys
import json
import asyncio
import time as _time

from obocar import OBOCar as _OBOCar

# Store reference to event emitter - this is now properly connected to JS
sendStateChange = sendStateChangeEvent

# Wrap OBOCar to emit state change events
class OBOCar(_OBOCar):
    def __init__(self):
        super().__init__()
    
    def _emit_state_change(self):
        '''Emit state changed event'''
        state = {
            'leftMotorSpeed': self.left_motor_speed,
            'rightMotorSpeed': self.right_motor_speed,
            'leftMotorDirection': self.left_motor_direction,
            'rightMotorDirection': self.right_motor_direction,
            'frontDistance': self.front_distance,
            'leftDistance': self.left_distance,
            'rightDistance': self.right_distance,
        }
        sendStateChange(json.dumps(state))
    
    def stop(self):
        super().stop()
        self._emit_state_change()
    
    def move_forward(self, speed=None, speed_left=None, speed_right=None):
        super().move_forward(speed, speed_left, speed_right)
        self._emit_state_change()
    
    def move_backward(self, speed=None, speed_left=None, speed_right=None):
        super().move_backward(speed, speed_left, speed_right)
        self._emit_state_change()
    
    def turn_left(self, speed=None, speed_left=None, speed_right=None):
        super().turn_left(speed, speed_left, speed_right)
        self._emit_state_change()
    
    def turn_right(self, speed=None, speed_left=None, speed_right=None):
        super().turn_right(speed, speed_left, speed_right)
        self._emit_state_change()
    
    def left_motor_forward(self, speed=None):
        super().left_motor_forward(speed)
        self._emit_state_change()
    
    def left_motor_backward(self, speed=None):
        super().left_motor_backward(speed)
        self._emit_state_change()
    
    def right_motor_forward(self, speed=None):
        super().right_motor_forward(speed)
        self._emit_state_change()
    
    def right_motor_backward(self, speed=None):
        super().right_motor_backward(speed)
        self._emit_state_change()

# Replace with patched version
import obocar
obocar.OBOCar = OBOCar

# Add sleep function from time module
from time import sleep

# Setup console redirection
class ConsoleWriter:
    def write(self, text):
        if text.strip():
            print(text.rstrip())
    def flush(self):
        pass

sys.stdout = ConsoleWriter()
sys.stderr = ConsoleWriter()
  `);
}

/**
 * Execute Python code
 */
async function executeCode(code: string, requestId: string): Promise<void> {
  if (!isInitialized) {
    emitEvent({
      type: 'error:occurred',
      message: 'Pyodide not initialized',
      timestamp: Date.now(),
    });
    return;
  }

  try {
    emitEvent({
      type: 'execution:started',
      timestamp: Date.now(),
    });

    const lines = code.split('\n');
    let executableCode = '';
    let lineNumber = 0;
    let indentLevel = 0;
    let lastIndentLevel = 0;
    let inBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip empty lines and comments at the top level
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      // Get indentation
      const leadingSpaces = line.match(/^(\s*)/)?.[1]?.length || 0;
      indentLevel = Math.floor(leadingSpaces / 4);

      lineNumber = i + 1;
      executableCode += line + '\n';

      // Check if entering a block
      if (trimmed.endsWith(':')) {
        inBlock = true;
        lastIndentLevel = indentLevel;
        continue;
      }

      // Check if exiting a block (dedent)
      if (inBlock && indentLevel <= lastIndentLevel && !trimmed.endsWith('\\')) {
        // Execute the accumulated block
        const codeToExecute = executableCode.trim();
        if (codeToExecute) {
          emitEvent({
            type: 'execution:line',
            lineNumber,
            timestamp: Date.now(),
          });

          try {
            const result = await pyodide.runPythonAsync(codeToExecute);
            if (result !== undefined && result !== null) {
              emitEvent({
                type: 'execution:output',
                message: String(result),
                timestamp: Date.now(),
              });
            }
          } catch (error: any) {
            emitEvent({
              type: 'error:occurred',
              message: error.message || String(error),
              timestamp: Date.now(),
            });
            return;
          }
        }

        executableCode = '';
        inBlock = false;

        // If current line is at top level and not empty, add it to next block
        if (indentLevel === 0 && trimmed) {
          executableCode += line + '\n';
        }
      }

      await new Promise((r) => setTimeout(r, 5));
    }

    // Execute any remaining code
    const remaining = executableCode.trim();
    if (remaining) {
      try {
        const result = await pyodide.runPythonAsync(remaining);
        if (result !== undefined && result !== null) {
          emitEvent({
            type: 'execution:output',
            message: String(result),
            timestamp: Date.now(),
          });
        }
      } catch (error: any) {
        emitEvent({
          type: 'error:occurred',
          message: error.message || String(error),
          timestamp: Date.now(),
        });
        return;
      }
    }

    emitEvent({
      type: 'execution:completed',
      timestamp: Date.now(),
    });
  } catch (error: any) {
    emitEvent({
      type: 'error:occurred',
      message: error.message || String(error),
      timestamp: Date.now(),
    });
  }
}

/**
 * Check if Python statement is complete
 */
function isCompleteStatement(code: string): boolean {
  if (!pyodide) return false;
  try {
    pyodide.runPython(`compile('''${code}''', '<string>', 'exec')`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Update sensor values from JS
 */
function updateSensorValues(
  front: number,
  left: number,
  right: number
): void {
  if (!pyodide) return;

  carState.frontDistance = front;
  carState.leftDistance = left;
  carState.rightDistance = right;

  pyodide.runPython(`
if 'car' in dir():
    car.set_front_distance(${front})
    car.set_left_distance(${left})
    car.set_right_distance(${right})
  `);

  emitEvent({
    type: 'sensor:update',
    frontDistance: front,
    leftDistance: left,
    rightDistance: right,
    timestamp: Date.now(),
  });
}

// ============================================================================
// Message Handler
// ============================================================================

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { id, type, payload } = event.data;
  console.log('[PyodideWorker] RECEIVED MESSAGE:', type, 'id:', id, 'payload:', payload);

  try {
    switch (type) {
      case 'init':
        console.log('[PyodideWorker] Processing INIT request');
        await initPyodide();
        break;

      case 'execute':
        console.log('[PyodideWorker] Processing EXECUTE request, code length:', payload?.code?.length);
        if (payload?.code) {
          await executeCode(payload.code, id);
        }
        break;

      case 'load-module':
        if (payload?.code) {
          try {
            pyodide.FS.writeFile('/obocar.py', payload.code);
            await pyodide.runPythonAsync(`
import sys
if '/' not in sys.path:
    sys.path.insert(0, '/')
            `);
            console.log('[PyodideWorker] OBOCar module loaded from main thread');
          } catch (error: any) {
            console.error('[PyodideWorker] Failed to load module from main thread:', error);
          }
        }
        break;

      case 'sensor-update':
        if (payload) {
          updateSensorValues(
            payload.front ?? 100,
            payload.left ?? 100,
            payload.right ?? 100
          );
        }
        break;

      case 'ping':
        emitEvent({
          type: 'execution:started',
          timestamp: Date.now(),
        });
        break;

      case 'terminate':
        console.log('[PyodideWorker] Terminating');
        self.close();
        break;

      default:
        emitEvent({
          type: 'error:occurred',
          message: `Unknown message type: ${type}`,
          timestamp: Date.now(),
        });
    }
  } catch (error: any) {
    emitEvent({
      type: 'error:occurred',
      message: `Worker error: ${error.message}`,
      timestamp: Date.now(),
    });
  }
};

console.log('[PyodideWorker] Script loaded');
