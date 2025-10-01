"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Play, Save, AlertCircle, CheckCircle, Square } from "lucide-react"
import { CarControlAPI, useSimulationStore } from "@/lib/car-control-system"
import { eventBus } from "@/lib/event-bus"

const defaultCode = `from obocar import obocar

# Create a car instance
car = obocar()
car.wait(0.5)
`

// Event Types
export enum CodeEditorEvents {
  CODE_EXECUTION_START = 'code:execution:start',
  CODE_EXECUTION_END = 'code:execution:end',
  CODE_EXECUTION_ERROR = 'code:execution:error',
  CODE_OUTPUT = 'code:output',
  CODE_SAVE = 'code:save',
  PYTHON_ENVIRONMENT_READY = 'python:environment:ready',
  PYTHON_ENVIRONMENT_ERROR = 'python:environment:error',
  CAR_API_READY = 'car:api:ready',
  TERMINAL_OUTPUT = 'terminal:output',
  SIMULATION_STATE_CHANGE = 'simulation:state:change',
  COMMAND_EXECUTION = 'command:execution'
}

interface PyodideInterface {
  runPython: (code: string) => any
  runPythonAsync: (code: string) => Promise<any>
  globals: {
    get: (name: string) => any
    set: (name: string, value: any) => void
  }
  loadPackage: (packages: string[]) => Promise<void>
  FS: {
    writeFile: (path: string, data: string) => void
  }
  pyimport: (moduleName: string) => any
}

// Define a complete oboCarAPI interface
interface OboCarAPI {
  log: (message: string) => void
  move: (distance: number, direction?: number, rotation?: number) => void
  backward: (distance: number) => void
  rotate: (angle: number) => void
  getPosition?: () => [number, number, number]
  getBattery?: () => number
  getDistanceTraveled?: () => number
  getStatus?: () => {
    battery: number
    position: [number, number, number]
    rotation: number
    distanceTraveled: number
  }
  reset?: () => void
}

declare global {
  interface Window {
    loadPyodide: () => Promise<any>
    carControlAPI: CarControlAPI
    oboCarAPI: OboCarAPI
    pyodideInstance: any
    terminalOutput?: (message: string, type?: 'info' | 'error' | 'warning' | 'success') => void
  }
}

export function CodeEditor() {
  const [code, setCode] = useState(defaultCode)
  const [isRunning, setIsRunning] = useState(false)
  const [output, setOutput] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [pyodide, setPyodide] = useState<PyodideInterface | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState("Initializing...")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { resetSimulation, setIsRunning: setSimulationRunning } = useSimulationStore()

  // Enhanced logging function
  const logCommand = (command: string, details?: any) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] 🚀 EXECUTING: ${command}`;
    
    console.log(`%c${logMessage}`, 'color: #4CAF50; font-weight: bold;');
    if (details) {
      console.log('📋 Command details:', details);
    }
    
    eventBus.emit(CodeEditorEvents.TERMINAL_OUTPUT, logMessage, "info");
    eventBus.emit(CodeEditorEvents.COMMAND_EXECUTION, { command, details, timestamp });
  }

  // Event Handlers
  useEffect(() => {
    const handleTerminalOutput = (message: string, type?: 'info' | 'error' | 'warning' | 'success') => {
      setOutput(prev => [...prev, `${type ? `[${type.toUpperCase()}]` : ''} ${message}`])
    }

    const handleCodeOutput = (message: string) => {
      setOutput(prev => [...prev, message])
    }

    const handleExecutionError = (errorMessage: string) => {
      setError(errorMessage)
    }

    const handlePythonEnvironmentReady = () => {
      setIsLoading(false)
      setLoadingProgress("")
    }

    const handlePythonEnvironmentError = (errorMessage: string) => {
      setError(errorMessage)
      setIsLoading(false)
    }

    const handleSimulationStateChange = (isRunning: boolean) => {
      setIsRunning(isRunning)
      setSimulationRunning(isRunning)
    }

    const handleCommandExecution = ({ command, details, timestamp }: { command: string, details: any, timestamp: string }) => {
      console.log(`📊 Command Analytics - ${timestamp}:`, { command, details });
    }

    // Register event listeners
    eventBus.on(CodeEditorEvents.TERMINAL_OUTPUT, handleTerminalOutput)
    eventBus.on(CodeEditorEvents.CODE_OUTPUT, handleCodeOutput)
    eventBus.on(CodeEditorEvents.CODE_EXECUTION_ERROR, handleExecutionError)
    eventBus.on(CodeEditorEvents.PYTHON_ENVIRONMENT_READY, handlePythonEnvironmentReady)
    eventBus.on(CodeEditorEvents.PYTHON_ENVIRONMENT_ERROR, handlePythonEnvironmentError)
    eventBus.on(CodeEditorEvents.SIMULATION_STATE_CHANGE, handleSimulationStateChange)
    eventBus.on(CodeEditorEvents.COMMAND_EXECUTION, handleCommandExecution)

    // Cleanup event listeners
    return () => {
      eventBus.off(CodeEditorEvents.TERMINAL_OUTPUT, handleTerminalOutput)
      eventBus.off(CodeEditorEvents.CODE_OUTPUT, handleCodeOutput)
      eventBus.off(CodeEditorEvents.CODE_EXECUTION_ERROR, handleExecutionError)
      eventBus.off(CodeEditorEvents.PYTHON_ENVIRONMENT_READY, handlePythonEnvironmentReady)
      eventBus.off(CodeEditorEvents.PYTHON_ENVIRONMENT_ERROR, handlePythonEnvironmentError)
      eventBus.off(CodeEditorEvents.SIMULATION_STATE_CHANGE, handleSimulationStateChange)
      eventBus.off(CodeEditorEvents.COMMAND_EXECUTION, handleCommandExecution)
    }
  }, [setSimulationRunning])

  // Initialize Pyodide with proper error handling
  useEffect(() => {
    const initPyodide = async () => {
      try {
        logCommand("Loading Python environment");
        setLoadingProgress("Loading Python environment...")

        if (!window.loadPyodide) {
          const script = document.createElement("script")
          script.src = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js"

          script.onload = async () => {
            try {
              logCommand("Initializing Pyodide");
              setLoadingProgress("Initializing Python...")
              
              const pyodideInstance = await window.loadPyodide()
              window.pyodideInstance = pyodideInstance

              logCommand("Loading obocar module");
              setLoadingProgress("Loading obocar module...")
              
              try {
                const response = await fetch('/obocar.py')
                if (!response.ok) {
                  throw new Error(`Failed to fetch obocar.py: ${response.status} ${response.statusText}`)
                }
                
                const obocarCode = await response.text()
                logCommand("obocar.py fetched successfully");
                
                // Write to virtual filesystem
                pyodideInstance.FS.writeFile('obocar.py', obocarCode)
                logCommand("obocar.py written to virtual filesystem");
                
                // Debug: Check filesystem and Python path
                const debugInfo = pyodideInstance.runPython(`
                  import sys, os
                  f"Python sys.path: {sys.path}\\nCurrent directory: {os.getcwd()}\\nFiles: {os.listdir()}"
                `)
                console.log("🔍 Python Environment Debug:", debugInfo)
                
                // Setup Python module with access to JavaScript
                pyodideInstance.runPython(`
                  import sys
                  from js import window
                  
                  # Check if the oboCarAPI is available in JS
                  has_api = hasattr(window, 'oboCarAPI')
                  print(f"JavaScript oboCarAPI available: {has_api}")
                  
                  if has_api:
                      api_methods = dir(window.oboCarAPI)
                      print(f"Available oboCarAPI methods: {api_methods}")
                `)
                logCommand("JavaScript bridge validated from Python");
                
                // Try using pyimport directly instead of Python import
                try {
                  const obocarModule = pyodideInstance.pyimport("obocar")
                  logCommand("obocar module imported successfully via pyimport");
                  
                  setLoadingProgress("Setting up OBO Car API...")
                  logCommand("Setting up OBO Car API");
                  
                  // Set up output capture
                  pyodideInstance.runPython(`
# Enhanced output capture for better logging
import sys
from io import StringIO

class OutputCapture:
    def __init__(self):
        self.output = []
    
    def write(self, text):
        if text.strip():
            self.output.append(text.strip())
            from js import window
            
            # Use event bus for output
            try:
                if hasattr(window, 'eventBus'):
                    window.eventBus.emit('terminal:output', text.strip(), 'info')
            except Exception:
                pass  # Safely ignore any errors with event bus
                
    def flush(self):
        pass

output_capture = OutputCapture()
sys.stdout = output_capture
                  `)
                  
                } catch (importError) {
                  const errorMsg = `❌ pyimport failed: ${importError instanceof Error ? importError.message : String(importError)}`
                  logCommand("pyimport failed", { error: errorMsg });
                  eventBus.emit(CodeEditorEvents.PYTHON_ENVIRONMENT_ERROR, errorMsg)
                }
              } catch (fetchError) {
                const errorMsg = `❌ Error loading obocar module: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`
                logCommand("obocar module loading failed", { error: errorMsg });
                eventBus.emit(CodeEditorEvents.PYTHON_ENVIRONMENT_ERROR, errorMsg)
              }

              setPyodide(pyodideInstance)
              eventBus.emit(CodeEditorEvents.PYTHON_ENVIRONMENT_READY)
              logCommand("Pyodide and OBO Car library initialized successfully");
            } catch (err) {
              const errorMsg = `Failed to initialize Pyodide: ${err instanceof Error ? err.message : String(err)}`
              logCommand("Pyodide initialization failed", { error: errorMsg });
              eventBus.emit(CodeEditorEvents.PYTHON_ENVIRONMENT_ERROR, errorMsg)
            }
          }

          script.onerror = () => {
            logCommand("Python environment script loading failed");
            eventBus.emit(CodeEditorEvents.PYTHON_ENVIRONMENT_ERROR, "Failed to load Python environment")
          }

          document.head.appendChild(script)
        }
      } catch (err) {
        const errorMsg = `Failed to load Pyodide: ${err instanceof Error ? err.message : String(err)}`
        logCommand("Pyodide loading failed", { error: errorMsg });
        eventBus.emit(CodeEditorEvents.PYTHON_ENVIRONMENT_ERROR, errorMsg)
      }
    }

    initPyodide()
  }, [])

  // Setup car API
  useEffect(() => {
    if (!window.carControlAPI) {
      const carAPI = new CarControlAPI()
      window.carControlAPI = carAPI
      
      // Connect the carAPI to the pyodide environment
      if (pyodide) {
        try {
          pyodide.globals.set("carControlAPI", carAPI)
          logCommand("CarControlAPI connected to Pyodide");
        } catch (err) {
          const errorMsg = `Failed to connect CarControlAPI to Pyodide: ${err instanceof Error ? err.message : String(err)}`
          logCommand("CarControlAPI connection failed", { error: errorMsg });
        }
      }
    }

    if (!window.oboCarAPI) {
      const carAPI = window.carControlAPI || new CarControlAPI()
      logCommand("Setting up oboCarAPI", { methods: Object.keys(carAPI) });

      // Create the oboCarAPI bridge with event-driven approach
      const oboCarAPIBridge: OboCarAPI = {
        log: (message: string) => {
          logCommand("Python log", { message });
        },
        move: (distance: number, direction: number = 0, rotation: number = 0) => {
          logCommand("Car move command", { distance, direction, rotation });
          
          // First, check the current position before moving
          const beforePos = useSimulationStore.getState().car.position
          console.log("📍 Car position BEFORE move:", beforePos);
          
          // Directly update the car position for immediate feedback
          if (distance > 0) {
            // Use direct position update for immediate feedback
            const { car } = useSimulationStore.getState()
            const rad = (car.rotation * Math.PI) / 180
            const newX = car.position[0] + distance * Math.cos(rad)
            const newZ = car.position[2] + distance * Math.sin(rad)
            
            // Update position immediately
            logCommand("Car moving forward", { 
              distance, 
              from: car.position, 
              to: [newX, 1, newZ],
              rotation: car.rotation 
            });
            
            useSimulationStore.getState().updateCarPosition([newX, 1, newZ])
            useSimulationStore.getState().setIsRunning(true)
            
            // Emit car movement event
            eventBus.emit('car:move:forward', { distance, newPosition: [newX, 1, newZ] })
            
            // Then also call the API method for animation and history
            carAPI.moveForward(distance).catch(err => {
              logCommand("moveForward API error", { error: err });
            })
          } else {
            // Same approach for backward movement
            const { car } = useSimulationStore.getState()
            const rad = (car.rotation * Math.PI) / 180
            const newX = car.position[0] - Math.abs(distance) * Math.cos(rad)
            const newZ = car.position[2] - Math.abs(distance) * Math.sin(rad)
            
            // Update position immediately
            logCommand("Car moving backward", { 
              distance: Math.abs(distance), 
              from: car.position, 
              to: [newX, 1, newZ],
              rotation: car.rotation 
            });
            
            useSimulationStore.getState().updateCarPosition([newX, 1, newZ])
            useSimulationStore.getState().setIsRunning(true)
            
            // Emit car movement event
            eventBus.emit('car:move:backward', { distance: Math.abs(distance), newPosition: [newX, 1, newZ] })
            
            carAPI.moveBackward(Math.abs(distance)).catch(err => {
              logCommand("moveBackward API error", { error: err });
            })
          }
          
          // Check the position after the update
          setTimeout(() => {
            const afterPos = useSimulationStore.getState().car.position
            console.log("📍 Car position AFTER move:", afterPos);
          }, 100)
        },
        rotate: (angle: number) => {
          logCommand("Car rotate command", { angle });
          
          // Check the current rotation
          const beforeRot = useSimulationStore.getState().car.rotation
          console.log("🔄 Car rotation BEFORE:", beforeRot + "°");
          
          // Directly update the rotation for immediate feedback
          const { car } = useSimulationStore.getState()
          const newRotation = car.rotation + angle
          
          logCommand("Car rotating", { 
            angle, 
            from: car.rotation + "°", 
            to: newRotation + "°" 
          });
          
          useSimulationStore.getState().updateCarRotation(newRotation)
          useSimulationStore.getState().setIsRunning(true)
          
          // Emit rotation event
          eventBus.emit('car:rotate', { angle, newRotation })
          
          // Then call the API for animation and history
          if (angle > 0) {
            carAPI.turnRight(angle).catch(err => {
              logCommand("turnRight API error", { error: err });
            })
          } else {
            carAPI.turnLeft(Math.abs(angle)).catch(err => {
              logCommand("turnLeft API error", { error: err });
            })
          }
          
          // Check the rotation after the update
          setTimeout(() => {
            const afterRot = useSimulationStore.getState().car.rotation
            console.log("🔄 Car rotation AFTER:", afterRot + "°");
          }, 100)
        },
        getSensor: (direction: "front" | "left" | "right" | "back") => {
          const { car } = useSimulationStore.getState()
          const reading = car.sensorReadings[direction]
          logCommand("Sensor reading request", { direction, reading });
          return reading
        },
        getPosition: () => {
          const { car } = useSimulationStore.getState()
          logCommand("Position request", { position: car.position });
          return car.position
        },
        getDistanceTraveled: () => {
          const { car } = useSimulationStore.getState()
          logCommand("Distance traveled request", { distance: car.distanceTraveled });
          return car.distanceTraveled
        },
        getRotation: () => {
          const { car } = useSimulationStore.getState()
          logCommand("Rotation request", { rotation: car.rotation + "°" });
          return car.rotation
        },
        // Force update position and rotation - used to sync Python and JS states
        updateState: (x: number, z: number, rotation: number) => {
          logCommand("Force state update", { 
            position: [x, 1, z], 
            rotation: rotation + "°" 
          });
          
          const store = useSimulationStore.getState()
          store.updateCarPosition([x, 1, z])
          store.updateCarRotation(rotation)
          
          // Emit state update event
          eventBus.emit('car:state:update', { position: [x, 1, z], rotation })
          return true
        },
        getStatus: () => {
          const { car } = useSimulationStore.getState()
          const status = {
            position: car.position,
            rotation: car.rotation,
            distanceTraveled: car.distanceTraveled
          }
          logCommand("Status request", status);
          return status
        },
        reset: () => {
          logCommand("Car reset command");
          useSimulationStore.getState().resetSimulation()
          eventBus.emit('car:reset')
        }
      }

      // Assign to window.oboCarAPI
      window.oboCarAPI = oboCarAPIBridge
      eventBus.emit(CodeEditorEvents.CAR_API_READY)
      logCommand("oboCarAPI bridge setup complete");
    }
  }, [pyodide])

  const handleRunCode = async () => {
    if (!pyodide) {
      logCommand("Run code failed", { reason: "Python environment not ready" });
      eventBus.emit(CodeEditorEvents.CODE_EXECUTION_ERROR, "Python environment not ready")
      return
    }

    logCommand("Starting code execution", { codeLength: code.length, lines: code.split('\n').length });
    eventBus.emit(CodeEditorEvents.CODE_EXECUTION_START)
    eventBus.emit(CodeEditorEvents.SIMULATION_STATE_CHANGE, true)
    setOutput([])
    setError(null)
    resetSimulation()
    
    // Make sure the CarControlAPI is properly initialized
    if (!window.carControlAPI) {
      window.carControlAPI = new CarControlAPI()
      logCommand("Created new CarControlAPI instance");
    }
    
    // Also make sure JavaScript API is properly set up and exposed to Python
    if (window.carControlAPI && window.oboCarAPI) {
      logCommand("JavaScript-Python bridge ready");
      
      // Expose the API directly to Pyodide globals for testing
      try {
        pyodide.globals.set("js_bridge", window.oboCarAPI)
        logCommand("oboCarAPI exposed to Python as js_bridge");
      } catch (err) {
        logCommand("Failed to expose oboCarAPI to Python", { error: err });
      }
    } else {
      logCommand("JavaScript-Python bridge warning", { 
        carControlAPI: !!window.carControlAPI, 
        oboCarAPI: !!window.oboCarAPI 
      });
    }

    try {
      // Clear previous output in Python
      pyodide.runPython("output_capture.output.clear()")
      
      // Add an initial message to show we're running
      logCommand("Running user code");

      // Process code to replace imports
      let modifiedCode = code
      if (code.includes('from obocar import obocar')) {
        logCommand("Detected import pattern", { pattern: "from obocar import obocar" });
        // Replace the import with an approach that will work with our filesystem setup
        modifiedCode = modifiedCode.replace(
          'from obocar import obocar', 
          `# Debug information for obocar import
import sys, os
print(f"Python path: {sys.path}")
print(f"Current dir: {os.getcwd()}")
print(f"Available files: {os.listdir()}")

# Import using direct filesystem access
with open("obocar.py") as f:
    obocar_code = f.read()

# Set a flag to indicate we're running in browser environment 
# to prevent demo code from automatically running
__BROWSER__ = True
exec(obocar_code)
# Now obocar function is available
print("✅ obocar module imported successfully")`
        )
      } else if (code.includes('import obocar')) {
        logCommand("Detected import pattern", { pattern: "import obocar" });
        // Replace the import with an approach that will work with our filesystem setup
        modifiedCode = modifiedCode.replace(
          'import obocar', 
          `# Debug information for obocar import
import sys, os
print(f"Python path: {sys.path}")
print(f"Current dir: {os.getcwd()}")
print(f"Available files: {os.listdir()}")

# Import using direct filesystem access
with open("obocar.py") as f:
    obocar_code = f.read()

# Set a flag to indicate we're running in browser environment
# to prevent demo code from automatically running
__BROWSER__ = True
exec(obocar_code)
# Now obocar module is available
print("✅ obocar module imported successfully")`
        )
      }

      logCommand("Executing Python code", { 
        originalLines: code.split('\n').length,
        modifiedLines: modifiedCode.split('\n').length 
      });

      // Execute user code with async support and proper indentation
      const result = await pyodide.runPythonAsync(`
import sys
from io import StringIO
from js import window

# Create a custom stdout handler that forwards to the terminal
class TerminalOutput:
    def write(self, text):
        if hasattr(window, 'eventBus') and text.strip():
            window.eventBus.emit('terminal:output', text.strip(), 'info')
        return len(text)
    
    def flush(self):
        pass

# Capture stdout with our custom handler
terminal_stdout = TerminalOutput()

try:
    # Set up a custom print function that ensures terminal visibility
    def terminal_print(*args, **kwargs):
        # Get the regular print output
        output = " ".join(str(arg) for arg in args)
        
        # Always print to stdout first to ensure it's captured
        print(*args, **kwargs)
        
        # Then try to send to terminal using event bus
        try:
            from js import window
            if hasattr(window, 'eventBus'):
                window.eventBus.emit('terminal:output', output, 'info')
        except Exception as terminal_err:
            # Safely ignore any errors with terminal output
            print(f"Terminal output error: {terminal_err}")

    # Make the terminal_print function available in the global scope
    globals()['terminal_print'] = terminal_print
    
    # Ensure all print statements are immediately visible in the terminal
    print("🚗 Running Python code...")
    terminal_print("📝 Tip: Use terminal_print() instead of print() to ensure output is visible")
    
${modifiedCode.split('\n').map(line => '    ' + line).join('\n')}
except Exception as e:
    error_msg = f"❌ Error: {type(e).__name__}: {e}"
    print(error_msg)
    if hasattr(window, 'eventBus'):
        window.eventBus.emit('terminal:output', error_msg, 'error')
    import traceback
    traceback.print_exc(file=terminal_stdout)

# Return a success message
"✅ Code execution complete"
      `)

      // Get captured output from both sources
      const capturedOutput = pyodide.globals.get("output_capture").output.toJs()
      
      // Send output to terminal via events
      logCommand("Code execution results ready");
      // Send each line to the terminal
      capturedOutput.forEach((line: string) => {
        eventBus.emit(CodeEditorEvents.TERMINAL_OUTPUT, line, "info")
      })
      logCommand("Code execution completed successfully");
      
      // Update the output state with both the result string and the captured output
      setOutput(prev => [
        ...prev.filter(line => !line.includes("Running your Obo Car code")),
        ...(result ? [result] : []),
        ...(capturedOutput || [])
      ].filter(Boolean))

      eventBus.emit(CodeEditorEvents.CODE_EXECUTION_END)
    } catch (err: any) {
      const errorMsg = `Python execution error: ${err.message}`
      logCommand("Code execution failed", { error: errorMsg });
      eventBus.emit(CodeEditorEvents.CODE_EXECUTION_ERROR, errorMsg)
    } finally {
      eventBus.emit(CodeEditorEvents.SIMULATION_STATE_CHANGE, false)
    }
  }

  const handleStopCode = () => {
    logCommand("Stopping code execution");
    eventBus.emit(CodeEditorEvents.SIMULATION_STATE_CHANGE, false)
    resetSimulation()
    eventBus.emit('car:stop')
  }

  const handleSaveCode = () => {
    logCommand("Saving code", { lines: code.split('\n').length, characters: code.length });
    const blob = new Blob([code], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "obo-car-script.py"
    a.click()
    URL.revokeObjectURL(url)
    eventBus.emit(CodeEditorEvents.CODE_SAVE, code)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Loading Python Environment</p>
            <p className="text-xs text-muted-foreground">{loadingProgress}</p>
          </div>
          <div className="text-xs text-muted-foreground max-w-sm">
            This may take a moment on first load as we download the Python runtime...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-3 border-b">
        <Button onClick={handleRunCode} disabled={isRunning || !pyodide} size="sm" className="gap-2">
          <Play className="w-4 h-4" />
          {isRunning ? "Running..." : "Run Code"}
        </Button>

        {isRunning && (
          <Button onClick={handleStopCode} variant="destructive" size="sm" className="gap-2">
            <Square className="w-4 h-4" />
            Stop
          </Button>
        )}

        <Button onClick={handleSaveCode} variant="outline" size="sm" className="gap-2 bg-transparent">
          <Save className="w-4 h-4" />
          Save
        </Button>
      </div>

      <div className="flex-1 flex flex-col">
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="p-4 font-mono text-sm bg-muted/30 border-0 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 h-full flex-1"
          placeholder="Write your MicroPython code here..."
          spellCheck={false}
        />
        
        {error && (
          <Alert className="mt-2 border-destructive/50 bg-destructive/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-mono text-xs">{error}</AlertDescription>
          </Alert>
        )}
      </div>

      <div className="p-3 border-t bg-muted/20">
        <div className="text-xs text-muted-foreground">
          Lines: {code.split("\n").length} | Characters: {code.length} | Python: {pyodide ? "Ready" : "Loading..."}
        </div>
      </div>
    </div>
  )
}