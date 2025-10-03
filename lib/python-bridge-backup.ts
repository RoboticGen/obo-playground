import { useSimulationStore } from '@/lib/simulation-store'
import * as THREE from 'three'

// Python-to-JavaScript bridge for OboCar
class OboCarBridge {
  private getStore() {
    return useSimulationStore.getState()
  }

  setupGlobalAPI() {
    if (typeof window === 'undefined') return

    console.log('🔧 Bridge: Setting up global API...');

    // Debug helper function
    (window as any).debugLoops = () => {
      const store = useSimulationStore.getState();
      console.log('🔍 Debug Loop State:');
      console.log('- Active loops in store:', store.activeLoops.length);
      console.log('- Is running:', store.isRunning);
      console.log('- Command queue length:', store.commandQueue.length);
      console.log('- Current command:', store.currentCommand);
      console.log('- Is executing:', store.isExecuting);
      
      if ((window as any).oboCarAPI._activeLoops) {
        console.log('- Internal loops:', (window as any).oboCarAPI._activeLoops.size);
        Array.from((window as any).oboCarAPI._activeLoops.keys()).forEach(id => {
          console.log(`- Loop ${id}: active`);
        });
      }
    };

    // Create the global oboCarAPI that Python expects
    (window as any).oboCarAPI = {
      // Event-driven execution support
      scheduleStep: (callback: () => boolean | void) => {
        // Schedule a single step to be executed in the next animation frame
        try {
          requestAnimationFrame(() => {
            if (useSimulationStore.getState().isRunning) {
              try {
                callback()
              } catch (error) {
                console.error('❌ Error in scheduled step:', error)
              }
            }
          })
          return true
        } catch (error) {
          console.error('❌ Error scheduling step:', error)
          return false
        }
      },
      
      registerLoopCallback: (callback: () => boolean | void) => {
        // Register a callback to be called periodically by the animation loop
        console.log('🔄 Bridge: Registering event loop callback')
        console.log('🔍 Bridge: Initial store state:', {
          isRunning: useSimulationStore.getState().isRunning,
          commandQueue: useSimulationStore.getState().commandQueue.length,
          activeLoops: useSimulationStore.getState().activeLoops.length
        });
        
        // Ensure the simulation is running
        const store = useSimulationStore.getState();
        store.setRunning(true); // Make sure the simulation is running
        console.log('🔄 Bridge: Set simulation running to true');
        
        // Track if the callback is currently executing
        let isExecuting = false;
        let lastCommandCount = 0;
        let iterationCount = 0;
        const maxIterations = 10000;
        let isActive = true;
        
        // Function to directly execute the next loop iteration
        const executeLoopIteration = () => {
          if (!isActive) {
            console.log('🛑 Bridge: Loop marked as inactive, stopping');
            return;
          }
          
          if (iterationCount >= maxIterations) {
            console.log(`🛑 Bridge: Reached maximum iterations (${maxIterations}), stopping for safety`);
            isActive = false;
            return;
          }
          
          // Mark as executing to prevent overlaps
          isExecuting = true;
          iterationCount++;
          
          console.log(`🔄 Bridge: Executing event loop iteration #${iterationCount}`);
          console.log(`🔍 Bridge: Current state - isRunning: ${useSimulationStore.getState().isRunning}, commandQueue: ${useSimulationStore.getState().commandQueue.length}, isExecuting: ${useSimulationStore.getState().isExecuting}`);
          
          try {
            console.log('🔄 Bridge: About to call Python callback...');
            const result = callback();
            console.log(`🔄 Bridge: Python callback returned: ${result}`);
            
            // Stop the loop if callback returns false
            if (result === false) {
              console.log('🛑 Bridge: Event loop callback stopped (returned false)');
              isActive = false;
              useSimulationStore.getState().clearEventLoop(id as unknown as NodeJS.Timeout);
              return;
            }
            
            // Log command state for debugging
            const currentState = useSimulationStore.getState();
            const newCommandCount = currentState.commandHistory.length;
            console.log(`📊 Bridge: After callback - commandQueue: ${currentState.commandQueue.length}, commandHistory: ${newCommandCount}, isExecuting: ${currentState.isExecuting}`);
            
            if (newCommandCount > lastCommandCount) {
              console.log(`📊 Bridge: Commands increased from ${lastCommandCount} to ${newCommandCount} (+${newCommandCount - lastCommandCount})`);
              lastCommandCount = newCommandCount;
            }
            
            // Schedule the next iteration after a delay
            if (isActive) {
              console.log(`🔄 Bridge: Scheduling iteration #${iterationCount + 1} in 2 seconds...`);
              setTimeout(() => {
                console.log(`⏰ Bridge: Timeout triggered for iteration #${iterationCount + 1}`);
                console.log(`🔍 Bridge: Timeout state check - isActive: ${isActive}, isRunning: ${useSimulationStore.getState().isRunning}`);
                if (isActive && useSimulationStore.getState().isRunning) {
                  console.log(`🔄 Bridge: Continuing to iteration #${iterationCount + 1}`);
                  executeLoopIteration();
                } else {
                  console.log(`🛑 Bridge: Not continuing - isActive: ${isActive}, isRunning: ${useSimulationStore.getState().isRunning}`);
                }
              }, 2000);
            } else {
              console.log('🛑 Bridge: Loop is not active, not scheduling next iteration');
            }
            
          } catch (error) {
            console.error(`❌ Bridge: Event loop callback error in iteration #${iterationCount}:`, error);
            console.error('❌ Bridge: Error stack:', (error as Error).stack);
            // Don't stop the loop on error, just log and continue
            if (isActive) {
              console.log('🔄 Bridge: Continuing despite error...');
              setTimeout(() => {
                if (isActive && useSimulationStore.getState().isRunning) {
                  console.log('🔄 Bridge: Retrying after error...');
                  executeLoopIteration();
                } else {
                  console.log('🛑 Bridge: Not retrying - conditions not met');
                }
              }, 2000);
            }
          } finally {
            // Mark as no longer executing
            isExecuting = false;
            console.log(`✅ Bridge: Finished iteration #${iterationCount}, isExecuting now false`);
          }
        };
        
        // This initiates the first iteration immediately
        console.log('🔄 Bridge: Starting first iteration immediately');
        executeLoopIteration();
        
        // Create a simple interval ID for cleanup purposes (not used for loop continuation)
        const id = Date.now() + Math.random(); // Use timestamp with random for uniqueness
        
        // Register the loop with the store
        useSimulationStore.getState().registerEventLoop(id as unknown as NodeJS.Timeout)
        console.log(`🔄 Bridge: Event loop registered. Active loops count: ${useSimulationStore.getState().activeLoops.length}`);
        
        // Store cleanup function for internal tracking
        if (!(window as any).oboCarAPI._activeLoops) {
          (window as any).oboCarAPI._activeLoops = new Map();
        }
        (window as any).oboCarAPI._activeLoops.set(id, () => {
          isActive = false;
          console.log(`🧹 Bridge: Loop ${id} deactivated`);
        });
        
        console.log(`✅ Bridge: Registered event loop with ID: ${id}`)
        
        // Return the ID so Python can use it for cancellation
        return id
      },
      
      clearLoopCallback: (id: number) => {
        console.log(`🧹 Bridge: Clearing loop callback ${id}`);
        
        // Clear from our internal tracking
        if ((window as any).oboCarAPI._activeLoops?.has(id)) {
          const cleanupFn = (window as any).oboCarAPI._activeLoops.get(id);
          cleanupFn();
          (window as any).oboCarAPI._activeLoops.delete(id);
        }
        
        // Clear from store
        useSimulationStore.getState().clearEventLoop(id as unknown as NodeJS.Timeout)
        console.log(`🧹 Bridge: Loop ${id} cleared from store`)
        return true
      },

      // Movement commands that Python calls
      move: (distance: number) => {
        // If negative distance, use backward command
        if (distance < 0) {
          return (window as any).oboCarAPI.backward(Math.abs(distance));
        }
        
        console.log(`🚗 Bridge: Moving car forward ${distance} units`)
        const store = this.getStore()
        
        // Add the command to the queue
        store.addCommand({
          type: 'forward',
          value: distance,
          duration: Math.abs(distance) * 1000
        })
        
        // Start execution if not already running
        if (!store.isRunning) {
          store.setRunning(true)
        }
        
        // Ensure execution starts immediately if there's no current command
        if (!store.currentCommand && store.commandQueue.length > 0) {
          setTimeout(() => {
            const currentState = this.getStore();
            if (!currentState.isExecuting && !currentState.currentCommand && currentState.commandQueue.length > 0) {
              console.log('🔄 Bridge: Triggering immediate command execution');
              currentState.executeNextCommand();
            }
          }, 10);
        }
        
        return true
      },

      backward: (distance: number) => {
        console.log(`🚗 Bridge: Moving car backward ${distance} units`)
        const store = this.getStore()
        
        // Add the command to the queue
        store.addCommand({
          type: 'backward',
          value: distance,
          duration: Math.abs(distance) * 1000
        })
        
        // Start execution if not already running
        if (!store.isRunning) {
          store.setRunning(true)
        }
        
        return true
      },

      rotate: (angle: number) => {
        console.log(`🔄 Bridge: Rotating car ${angle} degrees`)
        const store = this.getStore()
        
        // Determine turn direction and add appropriate command
        if (angle > 0) {
          store.addCommand({
            type: 'turn_right',
            value: Math.abs(angle),
            duration: Math.abs(angle) * 20 // 20ms per degree
          })
        } else if (angle < 0) {
          store.addCommand({
            type: 'turn_left',
            value: Math.abs(angle),
            duration: Math.abs(angle) * 20
          })
        }
        
        // Start execution if not already running
        if (!store.isRunning) {
          store.setRunning(true)
        }
        
        return true
      },

      turn: (angle: number) => {
        return (window as any).oboCarAPI.rotate(angle)
      },

      syncAngleWithPython: (angleInDegrees: number) => {
        console.log(`🔄 Bridge: Syncing angle with Python: ${angleInDegrees}°`)
        const store = this.getStore()
        
        // Convert degrees to radians for Three.js
        const angleInRadians = (angleInDegrees * Math.PI) / 180
        
        // Update the car's rotation directly
        set((state) => ({
          carPhysics: {
            ...state.carPhysics,
            rotation: new THREE.Euler(0, angleInRadians, 0)
          },
          carAnimation: {
            ...state.carAnimation,
            targetRotation: new THREE.Euler(0, angleInRadians, 0)
          },
          // Update cumulative angle for Python synchronization
          cumulativeAngle: angleInDegrees
        }))
        
        console.log(`✅ Bridge: Car rotation synced to ${angleInDegrees}° (${angleInRadians} radians)`)
        return true
      },

    getPosition: () => {
      const position = this.getStore().carPhysics.position
      return [position.x, position.y, position.z]
    },

    getRotation: () => {
      const rotation = this.getStore().carPhysics.rotation
      return (rotation.y * 180) / Math.PI
    },

    setPosition: (x: number, y: number, z: number) => {
      console.log(`📍 Bridge: Setting car position to (${x}, ${y}, ${z})`)
      const store = this.getStore()
      // Implementation would update car position
      return true
    },

    setRotation: (angle: number) => {
      console.log(`🔄 Bridge: Setting car rotation to ${angle}°`)
      const store = this.getStore()
      const angleInRadians = (angle * Math.PI) / 180
      // Implementation would update car rotation
      return true
    },

    stop: () => {
      console.log('🛑 Bridge: Stopping car')
      const store = this.getStore()
      store.addCommand({
        type: 'stop',
        value: 0
      })
      return true
    },

    getSensors: () => {
      const sensors = this.getStore().sensorData
      return {
        front: sensors.front,
        left: sensors.left,
        right: sensors.right,
        back: sensors.back
      }
    },

    getStatus: () => {
      const state = this.getStore()
      return {
        isRunning: state.isRunning,
        isExecuting: state.isExecuting,
        commandQueueLength: state.commandQueue.length,
        currentCommand: state.currentCommand?.type || null,
        position: [state.carPhysics.position.x, state.carPhysics.position.y, state.carPhysics.position.z],
        rotation: (state.carPhysics.rotation.y * 180) / Math.PI
      }
    },

    reset: () => {
      console.log('🔄 Bridge: Resetting simulation')
      this.getStore().resetSimulation()
      return true
    },

    executeCommands: (commands: Array<{type: string, value?: number}>) => {
      console.log(`🎮 Bridge: Executing ${commands.length} commands`)
      const store = this.getStore()
      
      commands.forEach((cmd, index) => {
        setTimeout(() => {
          switch (cmd.type) {
            case 'forward':
              (window as any).oboCarAPI.move(cmd.value || 1)
              break
            case 'backward':
              (window as any).oboCarAPI.backward(cmd.value || 1)
              break
            case 'turn_left':
              (window as any).oboCarAPI.rotate(-(cmd.value || 90))
              break
            case 'turn_right':
              (window as any).oboCarAPI.rotate(cmd.value || 90)
              break
            case 'stop':
              (window as any).oboCarAPI.stop()
              break
            default:
              console.warn(`Unknown command type: ${cmd.type}`)
          }
        }, index * 100) // Stagger commands by 100ms
      })
      
      return true
    },

    updateState: (position: any, angle?: number) => {
      const store = this.getStore()
      
      if (position && typeof position === 'object') {
        if (position.x !== undefined && position.y !== undefined && position.z !== undefined) {
          set((state) => ({
            carPhysics: {
              ...state.carPhysics,
              position: new THREE.Vector3(position.x, position.y, position.z)
            },
            carAnimation: {
              ...state.carAnimation,
              targetPosition: new THREE.Vector3(position.x, position.y, position.z)
            }
          }))
        }
      }
      
      if (angle !== undefined) {
        const angleInRadians = (angle * Math.PI) / 180
        set((state) => ({
          carPhysics: {
            ...state.carPhysics,
            rotation: new THREE.Euler(0, angleInRadians, 0)
          },
          carAnimation: {
            ...state.carAnimation,
            targetRotation: new THREE.Euler(0, angleInRadians, 0)
          }
        }))
      }
      
      return true
    },

    getSensor: (direction?: string) => {
      const sensors = this.getStore().sensorData
      if (direction) {
        return sensors[direction as keyof typeof sensors] || 0
      }
      return sensors.front
    },

    log: (message: string) => {
      console.log(`🐍 Python: ${message}`)
      // Send to terminal if available
      if (window.terminalOutput) {
        window.terminalOutput(`Python: ${message}`, 'info')
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