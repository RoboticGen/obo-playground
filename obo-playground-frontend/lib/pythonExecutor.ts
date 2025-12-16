/**
 * Python Code Executor Module
 * Manages Pyodide initialization and Python code execution in the browser
 */

import { PYODIDE_CONFIG, CODE_EXECUTION_TIMEOUT, ERROR_MESSAGES, LOG_PREFIX } from './constants';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Current state of the robot car (motor speeds, sensor readings)
 */
export interface CarState {
  leftMotorSpeed: number;
  rightMotorSpeed: number;
  leftMotorDirection: number;
  rightMotorDirection: number;
  frontDistance: number;
  leftDistance: number;
  rightDistance: number;
}

/**
 * Event emitted during code execution
 */
export interface ExecutionEvent {
  type: 'line' | 'output' | 'error' | 'complete' | 'state_update';
  lineNumber?: number;
  message?: string;
  carState?: CarState;
}

/**
 * Type for event callback handler
 */
export type ExecutionEventHandler = (event: ExecutionEvent) => void;

// ============================================================================
// Python Executor Class
// ============================================================================

/**
 * Manages Python code execution via Pyodide in the browser
 * Handles Pyodide initialization, code execution, and state management
 */
class PythonExecutor {
  private pyodide: any = null;
  private isInitialized = false;
  private carState: CarState = {
    leftMotorSpeed: 0,
    rightMotorSpeed: 0,
    leftMotorDirection: 0,
    rightMotorDirection: 0,
    frontDistance: 100,
    leftDistance: 100,
    rightDistance: 100,
  };

  /**
   * Loads the Pyodide script from CDN into the page
   * @throws Error if script fails to load
   */
  private loadPyodideScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if ((window as any).loadPyodide) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = PYODIDE_CONFIG.CDN_URL;
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error(ERROR_MESSAGES.PYODIDE_LOAD_FAILED));
      document.head.appendChild(script);
    });
  }

  /**
   * Initializes Pyodide runtime and loads OBOCar module
   * Sets up Python environment for code execution
   * @throws Error if initialization fails
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log(`${LOG_PREFIX.PYTHON} Loading Pyodide from CDN...`);

    // Ensure we're in browser context
    if (typeof window === 'undefined') {
      throw new Error('Pyodide can only run in browser environment');
    }

    // Load Pyodide script if not already loaded
    if (!(window as any).loadPyodide) {
      await this.loadPyodideScript();
    }

    // Initialize Pyodide
    const loadPyodide = (window as any).loadPyodide;
    this.pyodide = await loadPyodide({
      indexURL: PYODIDE_CONFIG.INDEX_URL,
    });

    // Register state callback
    const carStateCallback = this.createStateCallback();
    this.pyodide.globals.set('carStateCallback', carStateCallback);

    // Load OBOCar module
    await this.loadOBOCarModule();

    // Patch Python environment
    await this.patchPythonEnvironment();

    this.isInitialized = true;
    console.log(`${LOG_PREFIX.SUCCESS} Pyodide initialized`);
  }

  /**
   * Creates the callback function for car state updates
   */
  private createStateCallback(): (stateJson: string) => void {
    return (stateJson: string) => {
      try {
        const state = JSON.parse(stateJson);
        this.carState = state;
      } catch (error) {
        console.error('Failed to parse car state:', error);
      }
    };
  }

  /**
   * Loads the OBOCar Python module from public folder
   * @throws Error if module fails to load
   */
  private async loadOBOCarModule(): Promise<void> {
    console.log(`${LOG_PREFIX.PACKAGE} Loading obocar module...`);

    try {
      const response = await fetch('/obocar.py');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const obocarCode = await response.text();

      // Write module to Pyodide's virtual filesystem
      this.pyodide.FS.writeFile('/obocar.py', obocarCode);

      // Add module directory to Python path
      await this.pyodide.runPythonAsync(`
import sys
if '/' not in sys.path:
    sys.path.insert(0, '/')
      `);

      console.log(`${LOG_PREFIX.SUCCESS} obocar.py loaded`);
    } catch (error) {
      console.error(
        `${LOG_PREFIX.ERROR} Failed to load obocar.py:`,
        error
      );
      throw new Error(ERROR_MESSAGES.OBOCAR_MODULE_FAILED);
    }
  }

  /**
   * Patches Python environment for browser execution
   * - Wraps OBOCar class to emit state updates
   * - Replaces time.sleep with async-compatible version
   * - Redirects stdout/stderr to browser console
   */
  private async patchPythonEnvironment(): Promise<void> {
    await this.pyodide.runPythonAsync(`
import sys
import json
import asyncio
import time as _time

# Import the OBOCar class
from obocar import OBOCar as _OBOCar

# Wrap OBOCar to emit state updates to JavaScript
class OBOCar(_OBOCar):
    """Enhanced OBOCar that syncs state to JavaScript"""
    
    def __init__(self):
        super().__init__()
        import builtins
        builtins.current_car = self
    
    def _update_state(self):
        """Send state update to JavaScript callback"""
        try:
            state = {
                'leftMotorSpeed': self.left_motor_speed,
                'rightMotorSpeed': self.right_motor_speed,
                'leftMotorDirection': self.left_motor_direction,
                'rightMotorDirection': self.right_motor_direction,
                'frontDistance': self.front_distance,
                'leftDistance': self.left_distance,
                'rightDistance': self.right_distance,
            }
            state_json = json.dumps(state)
            if 'carStateCallback' in globals():
                carStateCallback(state_json)
        except Exception as e:
            import js
            js.console.error(f"[OBOCar] Error: {e}")
    
    def stop(self):
        super().stop()
        self._update_state()
    
    def move_forward(self, speed=None, speed_left=None, speed_right=None):
        super().move_forward(speed, speed_left, speed_right)
        self._update_state()
    
    def move_backward(self, speed=None, speed_left=None, speed_right=None):
        super().move_backward(speed, speed_left, speed_right)
        self._update_state()
    
    def turn_left(self, speed=None, speed_left=None, speed_right=None):
        super().turn_left(speed, speed_left, speed_right)
        self._update_state()
    
    def turn_right(self, speed=None, speed_left=None, speed_right=None):
        super().turn_right(speed, speed_left, speed_right)
        self._update_state()
    
    def left_motor_forward(self, speed=None):
        super().left_motor_forward(speed)
        self._update_state()
    
    def left_motor_backward(self, speed=None):
        super().left_motor_backward(speed)
        self._update_state()
    
    def right_motor_forward(self, speed=None):
        super().right_motor_forward(speed)
        self._update_state()
    
    def right_motor_backward(self, speed=None):
        super().right_motor_backward(speed)
        self._update_state()

# Replace module's OBOCar with patched version
import obocar
obocar.OBOCar = OBOCar

current_car = None
import builtins
builtins.current_car = current_car

# Patch time.sleep for async context
original_sleep = _time.sleep

async def async_sleep(seconds):
    """Async sleep that keeps state synced"""
    chunks = int(seconds * 10)
    remainder = seconds - (chunks * 0.1)
    
    for _ in range(chunks):
        await asyncio.sleep(0.1)
        try:
            if hasattr(__builtins__, 'current_car') and current_car:
                current_car._update_state()
        except:
            pass
    
    if remainder > 0:
        await asyncio.sleep(remainder)

def sleep(seconds):
    """Sync sleep in async context"""
    try:
        loop = asyncio.get_event_loop()
        loop.run_until_complete(async_sleep(seconds))
    except:
        original_sleep(seconds)

import builtins
builtins.sleep = sleep

# Redirect output to browser console
import js

class JSConsoleWriter:
    def write(self, text):
        if text.strip():
            js.console.log(text.rstrip())
    def flush(self):
        pass

sys.stdout = JSConsoleWriter()
sys.stderr = JSConsoleWriter()
    `);
  }

  /**
   * Executes Python code line-by-line with event callbacks
   * @param code - Python source code to execute
   * @param onEvent - Callback function for execution events
   * @throws Error if execution fails
   */
  async executeCode(code: string, onEvent: ExecutionEventHandler): Promise<void> {
    if (!this.pyodide || !this.isInitialized) {
      throw new Error('Pyodide not initialized. Call initialize() first.');
    }

    // Update state callback
    const carStateCallback = (stateJson: string) => {
      try {
        const state = JSON.parse(stateJson);
        this.carState = state;
        onEvent({
          type: 'state_update',
          carState: state,
        });
      } catch (error) {
        console.error('Failed to parse car state:', error);
      }
    };

    this.pyodide.globals.set('carStateCallback', carStateCallback);

    try {
      const lines = code.split('\n');
      let executableCode = '';
      let currentLineNumber = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();

        // Skip empty lines and comments
        if (!trimmedLine || trimmedLine.startsWith('#')) {
          continue;
        }

        currentLineNumber = i + 1;
        executableCode += line + '\n';

        // Check if statement is complete
        if (
          !trimmedLine.endsWith(':') &&
          !trimmedLine.endsWith('\\') &&
          this.isCompleteStatement(executableCode)
        ) {
          // Emit line execution event
          onEvent({
            type: 'line',
            lineNumber: currentLineNumber,
          });

          try {
            const result = await this.pyodide.runPythonAsync(executableCode);

            // Emit output if result exists
            if (result !== undefined && result !== null) {
              onEvent({
                type: 'output',
                message: String(result),
              });
            }
          } catch (error: any) {
            console.error('Execution error:', error);
            onEvent({
              type: 'error',
              message: error.message || String(error),
              lineNumber: currentLineNumber,
            });
            return;
          }

          executableCode = '';

          // Small delay for smooth visualization
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }

      // Execute remaining code
      if (executableCode.trim()) {
        try {
          const result = await this.pyodide.runPythonAsync(executableCode);
          if (result !== undefined && result !== null) {
            onEvent({
              type: 'output',
              message: String(result),
            });
          }
        } catch (error: any) {
          onEvent({
            type: 'error',
            message: error.message || String(error),
          });
          return;
        }
      }

      onEvent({ type: 'complete' });
    } catch (error: any) {
      onEvent({
        type: 'error',
        message: error.message || String(error),
      });
    }
  }

  /**
   * Checks if Python code is syntactically complete
   * @param code - Code string to validate
   * @returns true if code is complete, false otherwise
   */
  private isCompleteStatement(code: string): boolean {
    if (!this.pyodide) return false;

    try {
      this.pyodide.runPython(`compile('''${code}''', '<string>', 'exec')`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Updates sensor distance values in Python environment
   * @param front - Front sensor distance in cm
   * @param left - Left sensor distance in cm
   * @param right - Right sensor distance in cm
   */
  updateSensorValues(front: number, left: number, right: number): void {
    if (!this.pyodide) return;

    this.carState.frontDistance = front;
    this.carState.leftDistance = left;
    this.carState.rightDistance = right;

    this.pyodide.runPython(`
car.set_front_distance(${front})
car.set_left_distance(${left})
car.set_right_distance(${right})
    `);
  }

  /**
   * Returns current car state
   * @returns Snapshot of current CarState
   */
  getCarState(): CarState {
    return { ...this.carState };
  }
}

// ============================================================================
// Singleton Pattern
// ============================================================================

let executorInstance: PythonExecutor | null = null;

/**
 * Gets or creates the singleton PythonExecutor instance
 * Automatically initializes Pyodide on first call
 * @returns Initialized PythonExecutor instance
 * @throws Error if initialization fails
 */
export async function getPythonExecutor(): Promise<PythonExecutor> {
  if (!executorInstance) {
    executorInstance = new PythonExecutor();
    await executorInstance.initialize();
  }
  return executorInstance;
}
