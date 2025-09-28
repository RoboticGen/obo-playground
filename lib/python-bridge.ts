import { useSimulationStore } from '@/lib/simulation-store'
import * as THREE from 'three'

// Python-to-JavaScript bridge for OboCar
class OboCarBridge {
  private getStore() {
    return useSimulationStore.getState()
  }

  setupGlobalAPI() {
    if (typeof window === 'undefined') return

    // Create the global oboCarAPI that Python expects
    (window as any).oboCarAPI = {
      // Movement commands that Python calls
      move: (distance: number) => {
        // If negative distance, use backward command
        if (distance < 0) {
          return (window as any).oboCarAPI.backward(Math.abs(distance));
        }
        
        console.log(`🚗 Bridge: Moving car forward ${distance} units`)
        const store = this.getStore()
        
        store.addCommand({
          type: 'forward',
          value: distance,
          duration: Math.abs(distance) * 1000
        })
        
        // Start execution if not already running
        if (!store.isRunning) {
          store.setRunning(true)
        }
        
        return true
      },
      
      // Dedicated backward method
      backward: (distance: number) => {
        console.log(`🚗 Bridge: Moving car backward ${distance} units`)
        const store = this.getStore()
        
        store.addCommand({
          type: 'backward',
          value: Math.abs(distance), // Ensure positive value
          duration: Math.abs(distance) * 1000 // Ensure positive duration
        })
        
        // Start execution if not already running
        if (!store.isRunning) {
          store.setRunning(true)
        }
        
        return true
      },

      // Rotation methods to control car orientation
      rotate: (angle: number) => {
        console.log(`🔄 Bridge: Queuing rotation command ${angle} degrees`)
        const store = this.getStore()
        
        // Determine the rotation type based on the angle
        // Python sends: left() → rotate(-degrees), right() → rotate(+degrees)
        // So: positive angle should trigger right turn, negative angle should trigger left turn
        const rotationType = angle > 0 ? 'turn_right' : 'turn_left'
        const rotationValue = Math.abs(angle)
        const rotationDuration = (rotationValue / 90) * 1000
        
        console.log(`📋 Adding ${rotationType} command: ${rotationValue}° for ${rotationDuration}ms`)
        
        store.addCommand({
          type: rotationType,
          value: rotationValue,
          duration: rotationDuration
        })
        
        console.log(`📋 Command queue now has ${store.commandQueue.length} commands`)
        
        // Start execution if not already running
        if (!store.isRunning) {
          console.log(`🚀 Starting command execution`)
          store.setRunning(true)
        }
        
        return true
      },

      // Turn method for compatibility - alias for rotate
      turn: (angle: number) => {
        // Use the rotate method directly since we're in the same object
        return (window as any).oboCarAPI.rotate(angle)
      },

      // Callback that Python can use to update its internal state
      syncAngleWithPython: (angleInDegrees: number) => {
        try {
          // Normalize angle to 0-360 range
          const normalizedAngle = ((angleInDegrees % 360) + 360) % 360
          
          // Check multiple possible pyodide locations and only log if we find one
          const pyodideInstance = (window as any).pyodide || (window as any).pyodideInstance
          
          if (pyodideInstance && pyodideInstance.globals) {
            console.log(`🔄 Attempting to sync Python angle to ${normalizedAngle}° (from ${angleInDegrees}°)`)
            const python = pyodideInstance.globals
            
            // Try different ways to access the obocar instance
            if (python.get('_obocar_instance')) {
              python.get('_obocar_instance').angle = normalizedAngle
              console.log(`✅ Synced Python angle to ${normalizedAngle}°`)
            } else {
              // Try alternative global access
              const builtins = python.get('__builtins__')
              if (builtins && builtins._obocar_instance) {
                builtins._obocar_instance.angle = normalizedAngle
                console.log(`✅ Synced Python angle via builtins to ${normalizedAngle}°`)
              } else {
                // Only warn in debug mode or if explicitly requested
                if (process.env.NODE_ENV === 'development') {
                  console.debug('⚠️ Could not find Python obocar instance to sync angle')
                }
              }
            }
          } else {
            // Only show this error occasionally to avoid spam
            if (Math.random() < 0.1) { // Show 10% of the time
              console.debug('⚠️ Pyodide not ready for angle sync (this is normal during startup)')
            }
          }
        } catch (error) {
          console.warn('❌ Failed to sync angle with Python:', error)
        }
      },

    // Get current car position
    getPosition: () => {
      const store = useSimulationStore.getState()
      const pos = store.carPhysics.position
      console.log(`🔍 oboCarAPI.getPosition() returning [${pos.x}, ${pos.y}, ${pos.z}]`)
      return [pos.x, pos.y, pos.z]
    },

    // Get current car rotation (in degrees)
    getRotation: () => {
      const store = useSimulationStore.getState()
      const rotation = store.carPhysics.rotation.y * (180 / Math.PI)
      console.log(`🧭 oboCarAPI.getRotation() returning ${rotation}°`)
      return rotation
    },

    // Set car position (for teleporting)
    setPosition: (x: number, y: number, z: number) => {
      console.log(`📍 oboCarAPI.setPosition(${x}, ${y}, ${z}) called from Python`)
      const store = useSimulationStore.getState()
      // Allow full 3D positioning
      const newPos = new THREE.Vector3(x, y, z)
      store.updateCarPosition(newPos)
      return true
    },

    // Set car rotation (in degrees)
    setRotation: (angle: number) => {
      console.log(`🧭 oboCarAPI.setRotation(${angle}°) called from Python`)
      const store = useSimulationStore.getState()
      
      // Convert from degrees to radians
      const radians = angle * (Math.PI / 180)
      const newRotation = new THREE.Euler(0, radians, 0)
      
      store.updateCarRotation(newRotation)
      return true
    },

    // Stop the car
    stop: () => {
      console.log(`🛑 oboCarAPI.stop() called from Python`)
      const store = useSimulationStore.getState()
      
      store.addCommand({
        type: 'stop',
        duration: 500
      })
      
      return true
    },

    // Get sensor readings
    getSensors: () => {
      const store = useSimulationStore.getState()
      const sensors = store.sensorData
      console.log(`🔍 oboCarAPI.getSensors() returning`, sensors)
      return {
        front: sensors.front,
        left: sensors.left,
        right: sensors.right,
        back: sensors.back
      }
    },

    // Get car status
    getStatus: () => {
      const store = useSimulationStore.getState()
      const pos = store.carPhysics.position
      const rotation = store.carPhysics.rotation.y * (180 / Math.PI)
      const status = {
        position: [pos.x, pos.y, pos.z],
        rotation: rotation,
        speed: store.carPhysics.velocity.length(),
        distance: store.metrics.distanceTraveled,
        isRunning: store.isRunning,
        currentState: store.carAnimation.currentState
      }
      console.log(`📊 oboCarAPI.getStatus() returning`, status)
      return status
    },

    // Reset simulation
    reset: () => {
      console.log(`🔄 oboCarAPI.reset() called from Python`)
      const store = useSimulationStore.getState()
      store.resetSimulation()
      return true
    },

    // Execute a series of commands at once
    executeCommands: (commands: Array<{type: string, value?: number}>) => {
      console.log(`⚡ oboCarAPI.executeCommands() called with ${commands.length} commands`)
      const store = useSimulationStore.getState()
      
      commands.forEach(cmd => {
        let commandType: any = cmd.type
        let value = cmd.value || 1
        let duration = 1000
        
        // Only process forward and backward commands
        if (cmd.type === 'forward' || cmd.type === 'backward') {
          // Calculate a proportional duration for the movement (fixed value)
          // This ensures that larger distances have enough time to complete
          duration = Math.max(value * 1000, 500) // Minimum 500ms, scales with distance
          
          console.log(`Adding command: ${commandType} with value ${value} and duration ${duration}ms`)
          store.addCommand({
            type: commandType,
            value: value,
            duration: duration
          })
        } else if (cmd.type === 'turn_left' || cmd.type === 'turn_right') {
          // Calculate a proportional duration for the rotation
          // This ensures that larger angles have enough time to complete
          duration = Math.max((value / 90) * 1000, 500) // Minimum 500ms, scales with angle
          
          console.log(`Adding rotation command: ${commandType} with value ${value} and duration ${duration}ms`)
          store.addCommand({
            type: commandType,
            value: value,
            duration: duration
          })
        } else {
          console.log(`⚠️ Command type '${cmd.type}' is not supported`)
        }
      })
      
      // Start execution
      if (!store.isRunning && !store.isExecuting) {
        store.setRunning(true)
      }
      
      return true
    },

    // updateState method that Python expects for synchronization
    updateState: (position: any, angle?: number) => {
      try {
        console.log(`🔄 oboCarAPI.updateState() called with position:`, position, `angle:`, angle)
        const store = useSimulationStore.getState()
        
        // Handle different position formats
        let pos: [number, number, number]
        if (Array.isArray(position)) {
          pos = [position[0] || 0, position[1] || 1, position[2] || 0]
        } else if (position && typeof position === 'object') {
          pos = [position.x || 0, position.y || 1, position.z || 0]
        } else if (typeof position === 'number' && typeof angle === 'number') {
          // Handle the case when position is a single number (x coordinate)
          // This appears to be happening in your error logs
          pos = [position, 1, 0] // Default y to 1, z to 0
        } else {
          console.warn('Invalid position format:', position)
          return false
        }
        
        // Update position - now we support full 3D movement
        // Use the position from Python, mapping correctly to our coordinate system
        // Python: [x, y] -> Three.js: [x, y, z] with x=left/right, z=forward/backward
        const newPos = new THREE.Vector3(pos[0], pos[1], pos[2])
        store.updateCarPosition(newPos)
        
        // Update rotation if provided
        if (typeof angle === 'number') {
          const newRot = new THREE.Euler(0, angle * (Math.PI / 180), 0)
          store.updateCarRotation(newRot)
        }
        
        console.log(`✅ Position updated to [${pos.join(', ')}], angle: ${angle || 'unchanged'}°`)
        return true
      } catch (error) {
        console.error('❌ Error in updateState:', error)
        return false
      }
    },

    // getSensor method that Python uses for obstacle detection
    getSensor: (direction?: string) => {
      const store = useSimulationStore.getState()
      const sensors = store.sensorData
      
      if (direction) {
        const value = sensors[direction as keyof typeof sensors] || 10
        console.log(`🔍 oboCarAPI.getSensor('${direction}') returning ${value}`)
        return value
      } else {
        console.log(`🔍 oboCarAPI.getSensor() returning all sensors:`, sensors)
        return sensors
      }
    },

    // distanceTraveled property that Python accesses
    get distanceTraveled() {
      const store = useSimulationStore.getState()
      const distance = store.metrics.distanceTraveled
      console.log(`📏 oboCarAPI.distanceTraveled accessed, returning ${distance}`)
      return distance
    },
    
    // Log method for Python to use
    log: (message: string) => {
      console.log(`📝 [Python]: ${message}`)
      // Forward to terminal if available
      if (window.terminalOutput) {
        window.terminalOutput(message, 'info')
      }
      return true
    }
    }

    console.log('🔗 oboCarAPI initialized and ready for Python integration')
  }
}

// Create and export the bridge instance
const oboCarBridge = new OboCarBridge()

export { oboCarBridge }