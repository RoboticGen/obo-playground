"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Play, Save, AlertCircle, CheckCircle, Square } from "lucide-react"
import { CarControlAPI, useSimulationStore } from "@/lib/car-control-system"

const defaultCode = `from obocar import obocar

# Create a car instance
car = obocar()
terminal_print("🚗 Starting Obo Car simulation!")

# Basic movement
car.forward(5)
terminal_print(f"Position: {car.get_position()}")

# Check sensors
front_distance = car.sensor('front')
terminal_print(f"Front sensor: {front_distance:.1f}m")

# Turn and move more
car.right(90)
car.forward(3)
terminal_print(f"New position: {car.get_position()}")

# Status check
status = car.status()
terminal_print(f"Status: {status}")

terminal_print("✅ Simulation complete!")`

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
  rotate: (angle: number) => void
  getSensor?: (direction: "front" | "left" | "right" | "back") => number
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

  // Initialize Pyodide with proper error handling
  useEffect(() => {
    const initPyodide = async () => {
      try {
        setLoadingProgress("Loading Python environment...")

        if (!window.loadPyodide) {
          const script = document.createElement("script")
          script.src = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js"

          script.onload = async () => {
            try {
              setLoadingProgress("Initializing Python...")
              const pyodideInstance = await window.loadPyodide()
              
              // Make pyodideInstance available to Python code
              window.pyodideInstance = pyodideInstance

              setLoadingProgress("Loading obocar module...")
              try {
                const response = await fetch('/python/obocar.py')
                if (!response.ok) {
                  throw new Error(`Failed to fetch obocar.py: ${response.status} ${response.statusText}`)
                }
                
                const obocarCode = await response.text()
                console.log("✅ obocar.py fetched successfully!")
                
                // Write to virtual filesystem
                pyodideInstance.FS.writeFile('obocar.py', obocarCode)
                console.log("✅ obocar.py written to virtual filesystem!")
                
                // Debug: Check filesystem and Python path
                const debugInfo = pyodideInstance.runPython(`
                  import sys, os
                  f"Python sys.path: {sys.path}\\nCurrent directory: {os.getcwd()}\\nFiles: {os.listdir()}"
                `)
                console.log(debugInfo)
                
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
                console.log("✅ Validated JavaScript bridge from Python")
                
                // Try using pyimport directly instead of Python import
                try {
                  const obocarModule = pyodideInstance.pyimport("obocar")
                  console.log('✅ obocar module imported successfully via pyimport!')
                  
                  setLoadingProgress("Setting up OBO Car API...")
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
            
            # Try to log using oboCarAPI if available
            try:
                if hasattr(window, 'oboCarAPI') and hasattr(window.oboCarAPI, 'log'):
                    window.oboCarAPI.log(text.strip())
            except Exception:
                pass  # Safely ignore any errors with oboCarAPI
                
            # Always try to use terminal output if available
            try:
                if hasattr(window, 'terminalOutput'):
                    window.terminalOutput(text.strip(), 'info')
            except Exception:
                pass  # Safely ignore any errors with terminal output
    
    def flush(self):
        pass

output_capture = OutputCapture()
sys.stdout = output_capture
                  `)
                  
                } catch (importError) {
                  console.error(`❌ pyimport failed: ${importError instanceof Error ? importError.message : String(importError)}`)
                  setError(`Failed to import obocar module: ${importError instanceof Error ? importError.message : String(importError)}`)
                }
              } catch (fetchError) {
                console.error(`❌ Error loading obocar module: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`)
                setError(`Failed to load obocar module: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`)
              }

              setPyodide(pyodideInstance)
              setIsLoading(false)
              setLoadingProgress("")
              console.log("[v0] Pyodide and OBO Car library initialized successfully")
            } catch (err) {
              console.error("[v0] Failed to initialize Pyodide:", err)
              setError("Failed to initialize Python environment")
              setIsLoading(false)
            }
          }

          script.onerror = () => {
            setError("Failed to load Python environment")
            setIsLoading(false)
          }

          document.head.appendChild(script)
        }
      } catch (err) {
        console.error("[v0] Failed to load Pyodide:", err)
        setError("Failed to load Python environment")
        setIsLoading(false)
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
          console.log("[v0] CarControlAPI connected to Pyodide")
        } catch (err) {
          console.error("[v0] Failed to connect CarControlAPI to Pyodide:", err)
        }
      }
    }

    if (!window.oboCarAPI) {
      const carAPI = window.carControlAPI || new CarControlAPI()
      console.log("[v0] Setting up oboCarAPI with methods:", Object.keys(carAPI))

      // Create a temp object with all methods to satisfy TypeScript
      const temp = {
        log: (message: string) => {
          console.log(message) // Still log to console for debugging
          setOutput((prev) => [...prev, message])
        },
        move: (distance: number, direction: number = 0, rotation: number = 0) => {
          console.log(`[v0] Car moving: ${distance}, ${direction}`)
          
          // First, check the current position before moving
          const beforePos = useSimulationStore.getState().car.position
          console.log(`[v0] Car position BEFORE move: [${beforePos[0]}, ${beforePos[1]}, ${beforePos[2]}]`)
          
          // Directly update the car position for immediate feedback
          if (distance > 0) {
            // Use direct position update for immediate feedback
            const { car } = useSimulationStore.getState()
            const rad = (car.rotation * Math.PI) / 180
            const newX = car.position[0] + distance * Math.cos(rad)
            const newZ = car.position[2] + distance * Math.sin(rad)
            
            // Update position immediately
            console.log(`[v0] Directly moving car to: [${newX}, 1, ${newZ}]`)
            useSimulationStore.getState().updateCarPosition([newX, 1, newZ])
            useSimulationStore.getState().setIsRunning(true) // Make sure simulation is running
            
            // Then also call the API method for animation and history
            carAPI.moveForward(distance).catch(err => {
              console.error("[v0] Error in moveForward:", err)
            })
          } else {
            // Same approach for backward movement
            const { car } = useSimulationStore.getState()
            const rad = (car.rotation * Math.PI) / 180
            const newX = car.position[0] - Math.abs(distance) * Math.cos(rad)
            const newZ = car.position[2] - Math.abs(distance) * Math.sin(rad)
            
            // Update position immediately
            console.log(`[v0] Directly moving car backward to: [${newX}, 1, ${newZ}]`)
            useSimulationStore.getState().updateCarPosition([newX, 1, newZ])
            useSimulationStore.getState().setIsRunning(true) // Make sure simulation is running
            
            carAPI.moveBackward(Math.abs(distance)).catch(err => {
              console.error("[v0] Error in moveBackward:", err)
            })
          }
          
          // Check the position after the update
          setTimeout(() => {
            const afterPos = useSimulationStore.getState().car.position
            console.log(`[v0] Car position AFTER move: [${afterPos[0]}, ${afterPos[1]}, ${afterPos[2]}]`)
          }, 100)
        },
        rotate: (angle: number) => {
          console.log(`[v0] Car rotating: ${angle}`)
          
          // Check the current rotation
          const beforeRot = useSimulationStore.getState().car.rotation
          console.log(`[v0] Car rotation BEFORE: ${beforeRot}°`)
          
          // Directly update the rotation for immediate feedback
          const { car } = useSimulationStore.getState()
          const newRotation = car.rotation + angle
          
          console.log(`[v0] Directly setting car rotation to: ${newRotation}°`)
          useSimulationStore.getState().updateCarRotation(newRotation)
          useSimulationStore.getState().setIsRunning(true) // Make sure simulation is running
          
          // Then call the API for animation and history
          if (angle > 0) {
            carAPI.turnRight(angle).catch(err => {
              console.error("[v0] Error in turnRight:", err)
            })
          } else {
            carAPI.turnLeft(Math.abs(angle)).catch(err => {
              console.error("[v0] Error in turnLeft:", err)
            })
          }
          
          // Check the rotation after the update
          setTimeout(() => {
            const afterRot = useSimulationStore.getState().car.rotation
            console.log(`[v0] Car rotation AFTER: ${afterRot}°`)
          }, 100)
        },
        getSensor: (direction: "front" | "left" | "right" | "back") => {
          const { car } = useSimulationStore.getState()
          console.log(`[v0] Reporting ${direction} sensor reading: ${car.sensorReadings[direction]} units`)
          return car.sensorReadings[direction]
        },
        getPosition: () => {
          const { car } = useSimulationStore.getState()
          console.log(`[v0] Reporting car position: [${car.position[0]}, ${car.position[1]}, ${car.position[2]}]`)
          return car.position
        },
        getBattery: () => {
          const { car } = useSimulationStore.getState()
          console.log(`[v0] Reporting car battery level: ${car.battery}%`)
          return car.battery
        },
        getDistanceTraveled: () => {
          const { car } = useSimulationStore.getState()
          console.log(`[v0] Reporting distance traveled: ${car.distanceTraveled} units`)
          return car.distanceTraveled
        },
        getRotation: () => {
          const { car } = useSimulationStore.getState()
          console.log(`[v0] Reporting car rotation: ${car.rotation}°`)
          return car.rotation
        },
        // Force update position and rotation - used to sync Python and JS states
        updateState: (x: number, z: number, rotation: number) => {
          console.log(`[v0] Force updating car state to position [${x}, 1, ${z}], rotation ${rotation}°`)
          const store = useSimulationStore.getState()
          store.updateCarPosition([x, 1, z])
          store.updateCarRotation(rotation)
          return true
        },
        getStatus: () => {
          const { car } = useSimulationStore.getState()
          console.log(`[v0] Reporting car status: 
          Position: [${car.position[0]}, ${car.position[1]}, ${car.position[2]}]
          Rotation: ${car.rotation}°
          Battery: ${car.battery}%
          Distance: ${car.distanceTraveled} units
        `)
          return {
            battery: car.battery,
            position: car.position,
            rotation: car.rotation,
            distanceTraveled: car.distanceTraveled
          }
        },
        reset: () => {
          console.log(`[v0] Resetting car position`)
          useSimulationStore.getState().resetSimulation()
        }
      }

      // Assign to window.oboCarAPI
      // @ts-ignore - Ignoring TypeScript error about the object structure
      window.oboCarAPI = temp
    }
  }, [pyodide])

  const handleRunCode = async () => {
    if (!pyodide) {
      setError("Python environment not ready")
      return
    }

    setIsRunning(true)
    setSimulationRunning(true) // Set simulation as running
    setOutput([]) // Clear previous output
    setError(null)
    resetSimulation() // Reset simulation state
    
    // Make sure the CarControlAPI is properly initialized
    if (!window.carControlAPI) {
      window.carControlAPI = new CarControlAPI()
      console.log("[v0] Created new CarControlAPI instance")
    }
    
    // Also make sure JavaScript API is properly set up and exposed to Python
    if (window.carControlAPI && window.oboCarAPI) {
      console.log("[v0] JavaScript-Python bridge is ready")
      console.log("[v0] Available oboCarAPI methods:", Object.keys(window.oboCarAPI))
      
      // Expose the API directly to Pyodide globals for testing
      try {
        pyodide.globals.set("js_bridge", window.oboCarAPI)
        console.log("[v0] Exposed oboCarAPI to Python as js_bridge")
      } catch (err) {
        console.error("[v0] Failed to expose oboCarAPI to Python:", err)
      }
    } else {
      console.warn("[v0] JavaScript-Python bridge is not properly initialized")
    }

    try {
      // Clear previous output in Python
      pyodide.runPython("output_capture.output.clear()")
      
      // Add an initial message to show we're running
      setOutput(["🚗 Running your Obo Car code..."])

      console.log("[v0] Starting Python code execution")

      // Process code to replace imports
      let modifiedCode = code
      if (code.includes('from obocar import obocar')) {
        console.log('Detected "from obocar import obocar" - using appropriate import method')
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
    
exec(obocar_code)
# Now obocar function is available
print("✅ obocar module imported successfully")`
        )
      } else if (code.includes('import obocar')) {
        console.log('Detected "import obocar" - using appropriate import method')
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
    
exec(obocar_code)
# Now obocar module is available
print("✅ obocar module imported successfully")`
        )
      }

      // Execute user code with async support and proper indentation
      const result = await pyodide.runPythonAsync(`
import sys
from io import StringIO
from js import window

# Create a custom stdout handler that forwards to the terminal
class TerminalOutput:
    def write(self, text):
        if hasattr(window, 'terminalOutput') and text.strip():
            window.terminalOutput(text.strip(), 'info')
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
        
        # Then try to send to terminal using oboCarAPI's log function
        try:
            from js import window
            if hasattr(window, 'oboCarAPI') and hasattr(window.oboCarAPI, 'log'):
                window.oboCarAPI.log(output)
            elif hasattr(window, 'terminalOutput'):
                window.terminalOutput(output, 'info')
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
    if hasattr(window, 'terminalOutput'):
        window.terminalOutput(error_msg, 'error')
    import traceback
    traceback.print_exc(file=terminal_stdout)

# Return a success message
"✅ Code execution complete"
      `)

      // Get captured output from both sources
      const capturedOutput = pyodide.globals.get("output_capture").output.toJs()
      
      // Send output to terminal
      const terminalOutput = window.terminalOutput;
      if (terminalOutput) {
        terminalOutput("📋 Code Execution Results:", "success");
        // Send each line to the terminal
        capturedOutput.forEach((line: string) => {
          terminalOutput(line, "info");
        });
        terminalOutput("✅ Code execution complete", "success");
      }
      
      // Update the output state with both the result string and the captured output
      setOutput(prev => [
        ...prev.filter(line => !line.includes("Running your Obo Car code")), // Remove the initial message
        ...(result ? [result] : []),
        ...(capturedOutput || [])
      ].filter(Boolean))

      console.log("[v0] Python code executed successfully")
    } catch (err: any) {
      setError(err.message)
      console.error("[v0] Python execution error:", err)
      
      // Send error to terminal
      const terminalOutput = window.terminalOutput;
      if (terminalOutput) {
        terminalOutput("❌ Python Execution Error", "error");
        terminalOutput(err.message, "error");
      }
    } finally {
      setIsRunning(false)
      setSimulationRunning(false) // Set simulation as stopped
    }
  }

  const handleStopCode = () => {
    setIsRunning(false)
    setSimulationRunning(false) // Set simulation as stopped
    resetSimulation()
    console.log("[v0] Code execution stopped")
  }

  const handleSaveCode = () => {
    const blob = new Blob([code], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "obo-car-script.py"
    a.click()
    URL.revokeObjectURL(url)
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
