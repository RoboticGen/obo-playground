export interface CarState {
  leftMotorSpeed: number;
  rightMotorSpeed: number;
  leftMotorDirection: number;
  rightMotorDirection: number;
  frontDistance: number;
  leftDistance: number;
  rightDistance: number;
}

export interface ExecutionEvent {
  type: 'line' | 'output' | 'error' | 'complete' | 'state_update';
  lineNumber?: number;
  message?: string;
  carState?: CarState;
}

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

  private loadPyodideScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).loadPyodide) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Pyodide script'));
      document.head.appendChild(script);
    });
  }

  async initialize() {
    if (this.isInitialized) return;

     ('🐍 Loading Pyodide from CDN...');
    
    // Load Pyodide from CDN directly in browser
    if (typeof window === 'undefined') {
      throw new Error('Pyodide can only run in browser');
    }

    // Check if already loaded
    if (!(window as any).loadPyodide) {
      // Load Pyodide script
      await this.loadPyodideScript();
    }

    const loadPyodide = (window as any).loadPyodide;
    this.pyodide = await loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/',
    });

    // Register callback function that Python will call
    const carStateCallback = (stateJson: string) => {
      try {
        const state = JSON.parse(stateJson);
        this.carState = state;
      } catch (error) {
        console.error('Failed to parse car state:', error);
      }
    };

    // Expose callback to Python's global namespace
    this.pyodide.globals.set('carStateCallback', carStateCallback);

    // Load obocar.py module from public folder
     ('📦 Loading obocar module...');
    
    try {
      const response = await fetch('/obocar.py');
      if (!response.ok) {
        throw new Error(`Failed to load obocar.py: ${response.statusText}`);
      }
      const obocarCode = await response.text();
      
      // Write the module to Pyodide's virtual filesystem
      this.pyodide.FS.writeFile('/obocar.py', obocarCode);
      
      // Add root directory to Python's module search path
      await this.pyodide.runPythonAsync(`
import sys
if '/' not in sys.path:
    sys.path.insert(0, '/')
      `);
      
       ('✅ obocar.py loaded into Pyodide filesystem');
    } catch (error) {
      console.error('❌ Failed to load obocar.py:', error);
      throw new Error('Could not load obocar module. Make sure obocar.py exists in the public folder.');
    }

    // Patch the OBOCar class and time module to use our callback
    await this.pyodide.runPythonAsync(`
import sys
import json
import asyncio
import time as _time

# Import the OBOCar class
from obocar import OBOCar as _OBOCar

# Patch OBOCar to send state updates to JavaScript
class OBOCar(_OBOCar):
    def __init__(self):
        super().__init__()
        # Store reference for sleep() to access
        import builtins
        builtins.current_car = self
    
    def _update_state(self):
        """Send state update to JavaScript"""
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
            # Use js.console.log directly to ensure output
            import js
            js.console.log(f"[OBOCar] State update: L={self.left_motor_speed}({self.left_motor_direction}), R={self.right_motor_speed}({self.right_motor_direction})")
            # Call the JavaScript callback
            if 'carStateCallback' in globals():
                carStateCallback(state_json)
            else:
                js.console.error("[OBOCar] ERROR: carStateCallback not found in globals!")
        except Exception as e:
            import js
            js.console.error(f"[OBOCar] ERROR in _update_state: {e}")
    
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

# Replace the OBOCar class in the obocar module with our patched version
import obocar
obocar.OBOCar = OBOCar

# Create global car instance for reference during sleep
current_car = None

# Store reference globally so sleep() can access it
import builtins
builtins.current_car = current_car

# Patch time.sleep to be async-friendly and keep state synced
original_sleep = _time.sleep

async def async_sleep(seconds):
    """Async sleep that yields control back to event loop and keeps motors running"""
    # Break sleep into small chunks to keep sending state updates
    # This ensures the 3D scene continues to receive motor state during sleep
    chunks = int(seconds * 10)  # 10 updates per second (0.1s intervals)
    remainder = seconds - (chunks * 0.1)
    
    for _ in range(chunks):
        await asyncio.sleep(0.1)
        # Send state update during sleep to keep motors running in 3D scene
        try:
            if hasattr(__builtins__, 'current_car') and current_car:
                current_car._update_state()
        except:
            pass
    
    if remainder > 0:
        await asyncio.sleep(remainder)

def sleep(seconds):
    """Synchronous sleep that works in Pyodide async context"""
    # Use asyncio to allow other code to run
    try:
        loop = asyncio.get_event_loop()
        loop.run_until_complete(async_sleep(seconds))
    except:
        # Fallback to original sleep if asyncio not available
        original_sleep(seconds)

# Replace time.sleep in global namespace
import builtins
builtins.sleep = sleep

# Redirect print to  
import sys
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

    this.isInitialized = true;
     ('✅ Pyodide initialized');
  }

  async executeCode(
    code: string,
    onEvent: (event: ExecutionEvent) => void
  ): Promise<void> {
    if (!this.pyodide || !this.isInitialized) {
      throw new Error('Pyodide not initialized');
    }

    // Update callback to emit events during execution
    const carStateCallback = (stateJson: string) => {
      try {
        const state = JSON.parse(stateJson);
        this.carState = state;
         ('📊 Python → JS state update:', state);
        onEvent({
          type: 'state_update',
          carState: state,
        });
      } catch (error) {
        console.error('Failed to parse car state:', error);
      }
    };
    
    // Update the callback in Python's globals
    this.pyodide.globals.set('carStateCallback', carStateCallback);

    try {
      // Split code into lines for line-by-line execution
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

        // Check if this line completes a statement
        // (simple heuristic: not ending with : or \)
        if (
          !trimmedLine.endsWith(':') &&
          !trimmedLine.endsWith('\\') &&
          this.isCompleteStatement(executableCode)
        ) {
          // Execute accumulated code
          onEvent({
            type: 'line',
            lineNumber: currentLineNumber,
          });

          try {
             ('🐍 Executing code:', executableCode.substring(0, 50) + '...');
            const result = await this.pyodide.runPythonAsync(executableCode);
            
            // Output result if any
            if (result !== undefined && result !== null) {
              onEvent({
                type: 'output',
                message: String(result),
              });
            }
          } catch (error: any) {
            console.error('❌ Execution error:', error);
            onEvent({
              type: 'error',
              message: error.message || String(error),
              lineNumber: currentLineNumber,
            });
            return;
          }

          executableCode = '';
          
          // Small delay for visualization (reduced for smoother loops)
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }

      // Execute any remaining code
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

  private isCompleteStatement(code: string): boolean {
    if (!this.pyodide) return false;
    
    try {
      // Try to compile the code to check if it's complete
      this.pyodide.runPython(`compile('''${code}''', '<string>', 'exec')`);
      return true;
    } catch {
      return false;
    }
  }

  updateSensorValues(front: number, left: number, right: number) {
    if (!this.pyodide) return;

    this.carState.frontDistance = front;
    this.carState.leftDistance = left;
    this.carState.rightDistance = right;

    // Update in Python
    this.pyodide.runPython(`
car.set_front_distance(${front})
car.set_left_distance(${left})
car.set_right_distance(${right})
    `);
  }

  getCarState(): CarState {
    return { ...this.carState };
  }
}

// Singleton instance
let executorInstance: PythonExecutor | null = null;

export async function getPythonExecutor(): Promise<PythonExecutor> {
  if (!executorInstance) {
    executorInstance = new PythonExecutor();
    await executorInstance.initialize();
  }
  return executorInstance;
}
