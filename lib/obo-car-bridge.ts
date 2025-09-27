import { useSimulationStore, AnimationState } from '@/lib/simulation-store'
import * as THREE from 'three'

// Python-to-JavaScript bridge for OboCar
class OboCarBridge {
  private getStore() {
    return useSimulationStore.getState()
  }

  setupGlobalAPI() {
    if (typeof window === 'undefined') return

    // Create the global oboCarAPI that Python expects
    ;(window as any).oboCarAPI = {
      // Movement commands that Python calls
      move: (distance: number) => {
        console.log(`🔗 Bridge: Moving car ${distance > 0 ? 'forward' : 'backward'} ${Math.abs(distance)} units`)
        const store = this.getStore()
        
        // Current position and rotation before movement
        const currentPos = store.carPhysics.position.clone()
        const currentRot = store.carPhysics.rotation.clone()
        
        console.log(`🔗 Bridge: Current position before move: (${currentPos.x.toFixed(2)}, ${currentPos.y.toFixed(2)}, ${currentPos.z.toFixed(2)})`)
        console.log(`🔗 Bridge: Current rotation before move: (${(currentRot.y * 180/Math.PI).toFixed(2)}°)`)
        
        // If distance is negative, use backward command type
        if (distance < 0) {
          store.addCommand({
            type: 'backward',
            value: Math.abs(distance),
            duration: Math.abs(distance) * 1000
          })
        } else {
          store.addCommand({
            type: 'forward',
            value: distance,
            duration: distance * 1000
          })
        }
        
        // Start execution if not already running
        if (!store.isRunning) {
          store.setRunning(true)
        }
        
        return true
      },
      
      // Dedicated backward method for clearer API
      backward: (distance: number) => {
        console.log(`🔗 Bridge: Moving car backward ${distance} units`)
        const store = this.getStore()
        
        // Get current position for reference
        const currentPosition = store.carPhysics.position
        console.log(`🔗 Bridge: Current position before backward: (${currentPosition.x}, ${currentPosition.y}, ${currentPosition.z})`)
        
        // Always create a backward command with positive distance
        store.addCommand({
          type: 'backward',
          value: Math.abs(distance),
          duration: Math.abs(distance) * 1000
        })
        
        // Start execution if not already running
        if (!store.isRunning) {
          store.setRunning(true)
        }
        
        return true
      },

      rotate: (angle: number) => {
        const store = this.getStore()
        const currentRotation = store.carPhysics.rotation.y * (180 / Math.PI)
        
        console.log(`🔗 Bridge: Rotating car ${angle} degrees (current: ${currentRotation.toFixed(1)}°)`)
        
        // Python right(+) calls rotate(+) and should increase car's angle clockwise
        // Python left(-) calls rotate(-) and should decrease car's angle counter-clockwise
        
        // In our 3D system:
        // turn_left adds to rotation.y which rotates counter-clockwise
        // turn_right subtracts from rotation.y which rotates clockwise
        
        // So the mapping should be:
        // For positive angle (right): use turn_right (decreases Y)
        // For negative angle (left): use turn_left (increases Y)
        const rotationType = angle > 0 ? 'turn_right' : 'turn_left'
        const rotationValue = Math.abs(angle)
        const rotationDuration = (rotationValue / 90) * 1000
        
        console.log(`🔗 Bridge: Adding ${rotationType} command, value: ${rotationValue}, duration: ${rotationDuration}ms`)
        
        store.addCommand({
          type: rotationType,
          value: rotationValue,
          duration: rotationDuration
        })
        
        // Start execution if not already running
        if (!store.isRunning) {
          console.log(`🔗 Bridge: Starting execution for rotation command`)
          store.setRunning(true)
        }
        
        return true
      },

      // Turn method for compatibility
      turn: (angle: number) => {
        return (window as any).oboCarAPI.rotate(angle)
      },

      // State query methods that Python uses
      getPosition: () => {
        const store = this.getStore()
        const pos = store.carPhysics.position
        console.log(`🔗 Bridge: Getting position [${pos.x}, ${pos.y}, ${pos.z}]`)
        return [pos.x, pos.y, pos.z]
      },

      getRotation: () => {
        const store = this.getStore()
        // Convert from radians to degrees (0-360 range)
        const radians = store.carPhysics.rotation.y
        // Normalize to positive degrees in 0-360 range
        let degrees = (radians * (180 / Math.PI)) % 360
        if (degrees < 0) {
          degrees += 360
        }
        
        console.log(`🔗 Bridge: Getting rotation ${degrees.toFixed(1)}° (raw: ${radians.toFixed(4)} radians)`)
        return degrees
      },

      getSensor: (direction: string = 'front') => {
        const store = this.getStore()
        const sensors = store.sensorData
        const value = sensors[direction as keyof typeof sensors] || 10
        console.log(`🔗 Bridge: Getting ${direction} sensor: ${value}m`)
        return value
      },

      updateState: (position: [number, number, number], rotation: number) => {
        console.log(`🔗 Bridge: Updating state - pos:[${position.join(',')}], rot:${rotation}°`)
        const store = this.getStore()
        
        // Convert degrees to radians for rotation
        const radians = rotation * (Math.PI / 180)
        
        // Update both physics and animation target states
        store.updateCarPhysics({
          position: new THREE.Vector3(position[0], position[1], position[2]),
          rotation: new THREE.Euler(0, radians, 0),
          // Reset velocity and acceleration to prevent drift
          velocity: new THREE.Vector3(0, 0, 0),
          angularVelocity: new THREE.Vector3(0, 0, 0),
          acceleration: new THREE.Vector3(0, 0, 0)
        })
        
        // Ensure the animation target is also updated to match
        store.carAnimation.targetPosition = new THREE.Vector3(position[0], position[1], position[2])
        store.carAnimation.targetRotation = new THREE.Euler(0, radians, 0)
        
        // Force state to IDLE to prevent ongoing animations
        store.setAnimationState(AnimationState.IDLE)
        
        return true
      },

      // Metrics that Python queries
      distanceTraveled: () => {
        const store = this.getStore()
        const distance = store.metrics.distanceTraveled
        console.log(`🔗 Bridge: Getting distance traveled: ${distance}m`)
        return distance
      },



      getSpeed: () => {
        const store = this.getStore()
        const speed = store.carPhysics.velocity.length()
        console.log(`🔗 Bridge: Getting speed: ${speed} m/s`)
        return speed
      },

      // Status methods
      isRunning: () => {
        const store = this.getStore()
        return store.isRunning
      },

      stop: () => {
        console.log(`🔗 Bridge: Stopping simulation`)
        const store = this.getStore()
        store.setRunning(false)
        store.addCommand({
          type: 'stop',
          duration: 500
        })
        return true
      },

      reset: () => {
        console.log(`🔗 Bridge: Resetting simulation`)
        const store = this.getStore()
        store.resetSimulation()
        return true
      },

      // Debug methods
      setDebug: (enabled: boolean) => {
        console.log(`🔗 Bridge: Setting debug mode: ${enabled}`)
        const store = this.getStore()
        store.setDebugMode(enabled)
        return true
      },

      // Obstacle detection
      getObstacleCount: () => {
        const store = this.getStore()
        const count = store.obstacles.length
        console.log(`🔗 Bridge: Getting obstacle count: ${count}`)
        return count
      }
    }

    console.log('🔗 OboCarBridge: Global API initialized')
    console.log('Available methods:', Object.keys((window as any).oboCarAPI))
  }
}

// Singleton instance
let bridgeInstance: OboCarBridge | null = null

export function initializeOboCarBridge(): OboCarBridge {
  if (!bridgeInstance && typeof window !== 'undefined') {
    bridgeInstance = new OboCarBridge()
    bridgeInstance.setupGlobalAPI()
    
    // Also setup the legacy setupOboCarAPI function that the old code expects
    ;(window as any).setupOboCarAPI = () => {
      console.log('🔗 Legacy setupOboCarAPI called - bridge already active')
      return true
    }
  }
  
  return bridgeInstance!
}

export function getOboCarBridge(): OboCarBridge | null {
  return bridgeInstance
}

// Legacy function for backward compatibility
export function setupOboCarAPI() {
  initializeOboCarBridge()
}