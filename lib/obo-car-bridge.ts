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
    ;(window as any).oboCarAPI = {
      // Movement commands that Python calls
      move: (distance: number) => {
        console.log(`🔗 Bridge: Moving car ${distance} units`)
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
        console.log(`🔗 Bridge: Rotating car ${angle} degrees`)
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

      // State query methods that Python uses
      getPosition: () => {
        const store = this.getStore()
        const pos = store.carPhysics.position
        console.log(`🔗 Bridge: Getting position [${pos.x}, ${pos.y}, ${pos.z}]`)
        return [pos.x, pos.y, pos.z]
      },

      getRotation: () => {
        const store = this.getStore()
        const rot = store.carPhysics.rotation.y * (180 / Math.PI)
        console.log(`🔗 Bridge: Getting rotation ${rot}°`)
        return rot
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
        
        store.updateCarPhysics({
          position: new THREE.Vector3(position[0], position[1], position[2]),
          rotation: new THREE.Euler(0, rotation * (Math.PI / 180), 0)
        })
        
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