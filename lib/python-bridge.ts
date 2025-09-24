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
        console.log(`� Bridge: Moving car ${distance} units`)
        const store = this.getStore()
        
        store.addCommand({
          type: 'forward',
          value: distance,
          duration: distance * 1000
        })
        
        // Start execution if not already running
        if (!store.isRunning) {
          store.setRunning(true)
        }
        
        return true
      },

      rotate: (angle: number) => {
        console.log(`� Bridge: Rotating car ${angle} degrees`)
        const store = this.getStore()
        
        store.addCommand({
          type: angle > 0 ? 'turn_right' : 'turn_left',
          value: Math.abs(angle),
          duration: (Math.abs(angle) / 90) * 1000
        })
        
        // Start execution if not already running
        if (!store.isRunning) {
          store.setRunning(true)
        }
        
        return true
      },

      // Turn method for compatibility
      turn: (angle: number) => {
        return (window as any).oboCarAPI.rotate(angle)
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
      const newPos = new THREE.Vector3(x, y, z)
      store.updateCarPosition(newPos)
      return true
    },

    // Set car rotation (for teleporting)
    setRotation: (angle: number) => {
      console.log(`🧭 oboCarAPI.setRotation(${angle}°) called from Python`)
      const store = useSimulationStore.getState()
      const newRot = new THREE.Euler(0, angle * (Math.PI / 180), 0)
      store.updateCarRotation(newRot)
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
        
        // Map command types
        switch (cmd.type) {
          case 'forward':
          case 'backward':
            duration = value * 1000
            break
          case 'turn_left':
          case 'turn_right':
            duration = (value / 90) * 1000
            break
          case 'stop':
            duration = 500
            break
        }
        
        store.addCommand({
          type: commandType,
          value: value,
          duration: duration
        })
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
        } else {
          console.warn('Invalid position format:', position)
          return false
        }
        
        // Update position
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
    }
    }

    console.log('🔗 oboCarAPI initialized and ready for Python integration')
  }
}

// Create and export the bridge instance
const oboCarBridge = new OboCarBridge()

export { oboCarBridge }