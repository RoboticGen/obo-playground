import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"
import * as THREE from "three"

// ============================================
// UTILITY FUNCTIONS FOR ROTATION HANDLING
// ============================================

/**
 * Normalize an angle to the range [-PI, PI]
 * This prevents angle wrapping issues
 */
function normalizeAngle(angle: number): number {
  while (angle > Math.PI) angle -= 2 * Math.PI
  while (angle < -Math.PI) angle += 2 * Math.PI
  return angle
}

/**
 * Calculate the shortest angular difference between two angles
 * Returns a value in the range [-PI, PI]
 */
function shortestAngleDiff(from: number, to: number): number {
  const diff = normalizeAngle(to - from)
  return diff
}

/**
 * Normalize a quaternion to ensure it represents the shortest rotation
 * Prevents flipping by ensuring the quaternion is in the correct hemisphere
 */
function normalizeQuaternion(quat: THREE.Quaternion, reference: THREE.Quaternion): THREE.Quaternion {
  // If the dot product is negative, the quaternions are in opposite hemispheres
  // Negate one to ensure we take the shortest path
  if (quat.dot(reference) < 0) {
    quat.set(-quat.x, -quat.y, -quat.z, -quat.w)
  }
  return quat
}

// ============================================
// ANIMATION STATES AND TYPES
// ============================================

// Animation States
export enum AnimationState {
  IDLE = 'idle',
  MOVING_FORWARD = 'moving_forward',
  MOVING_BACKWARD = 'moving_backward',
  TURNING_LEFT = 'turning_left',
  TURNING_RIGHT = 'turning_right',
  STOPPING = 'stopping',

}

// Movement Commands
export interface MovementCommand {
  id: string
  type: 'forward' | 'backward' | 'turn_left' | 'turn_right' | 'stop' | 'wait'     
  value?: number
  duration?: number
  timestamp: number
  executed: boolean
  startTime?: number
  endTime?: number
}

// Car Physics State
export interface CarPhysicsState {
  position: THREE.Vector3
  rotation: THREE.Euler
  velocity: THREE.Vector3
  angularVelocity: THREE.Vector3
  acceleration: THREE.Vector3
  mass: number
  friction: number
  maxSpeed: number
  maxTurnSpeed: number
}

// Car Animation State
export interface CarAnimationState {
  currentState: AnimationState
  previousState: AnimationState
  targetPosition: THREE.Vector3
  targetRotation: THREE.Euler
  animationProgress: number
  transitionSpeed: number
  isTransitioning: boolean
}

// Sensor Data
export interface SensorData {
  front: number
  left: number
  right: number
  back: number
  frontLeft: number
  frontRight: number
  backLeft: number
  backRight: number
}

// Simulation Metrics
export interface SimulationMetrics {
  distanceTraveled: number
  timeElapsed: number
  commandsExecuted: number
  collisions: number
  averageSpeed: number
  executionTime: number
  pathEfficiency: number
}

// Main Simulation Store State
export interface SimulationStore {
  // Simulation Control
  isRunning: boolean
  isPaused: boolean
  isExecuting: boolean
  stepMode: boolean  // New property for step-by-step execution
  speed: number
  debugMode: boolean

  // Car State
  carPhysics: CarPhysicsState
  carAnimation: CarAnimationState
  sensorData: SensorData
  metrics: SimulationMetrics
  
  // Python Synchronization
  cumulativeAngle: number // Track total rotation for Python sync

  // Event-driven execution
  activeLoops: NodeJS.Timeout[] // Track active event loops
  
  // Command System
  commandQueue: MovementCommand[]
  currentCommand: MovementCommand | null
  commandHistory: MovementCommand[]

  // Environment
  obstacles: Array<{
    id: string
    position: THREE.Vector3
    size: THREE.Vector3
    rotation: THREE.Euler
    color: string
    type: 'static' | 'dynamic'
  }>

  // Code Execution
  currentCode: string
  codeHistory: string[]
  executionError: string | null

  // Actions
  setRunning: (running: boolean) => void
  setPaused: (paused: boolean) => void
  setSpeed: (speed: number) => void
  setDebugMode: (debug: boolean) => void

  // Car Control Actions
  updateCarPhysics: (physics: Partial<CarPhysicsState>) => void
  setAnimationState: (state: AnimationState) => void
  updateCarPosition: (position: THREE.Vector3) => void
  updateCarRotation: (rotation: THREE.Euler) => void
  updateSensorData: (sensors: Partial<SensorData>) => void
  updateCumulativeAngle: (angle: number) => void

  // Command Actions
  addCommand: (command: Omit<MovementCommand, 'id' | 'timestamp' | 'executed'>) => void
  executeNextCommand: () => Promise<void>
  clearCommandQueue: () => void
  setCurrentCommand: (command: MovementCommand | null) => void

  // Code Actions
  setCurrentCode: (code: string) => void
  parseAndExecuteCode: (code: string) => Promise<void>
  setExecutionError: (error: string | null) => void

  // Environment Actions
  addObstacle: (obstacle: Omit<SimulationStore['obstacles'][0], 'id'>) => void    
  removeObstacle: (id: string) => void
  clearObstacles: () => void
  
  // Event Loop Management
  registerEventLoop: (id: NodeJS.Timeout) => void
  clearEventLoop: (id: NodeJS.Timeout) => void
  clearAllEventLoops: () => void

  // Simulation Actions
  resetSimulation: () => void
  updateMetrics: () => void

  // Animation State Machine
  canTransitionTo: (newState: AnimationState) => boolean
  transitionToState: (newState: AnimationState) => void
}

// Default state values
const defaultCarPhysics: CarPhysicsState = {
  position: new THREE.Vector3(0, 1, 0),
  rotation: new THREE.Euler(0, 0, 0),
  velocity: new THREE.Vector3(0, 0, 0),
  angularVelocity: new THREE.Vector3(0, 0, 0),
  acceleration: new THREE.Vector3(0, 0, 0),
  mass: 1000,
  friction: 0.8,
  maxSpeed: 10,
  maxTurnSpeed: 2
}

const defaultCarAnimation: CarAnimationState = {
  currentState: AnimationState.IDLE,
  previousState: AnimationState.IDLE,
  targetPosition: new THREE.Vector3(0, 1, 0),
  targetRotation: new THREE.Euler(0, 0, 0),
  animationProgress: 0,
  transitionSpeed: 2,
  isTransitioning: false
}

const defaultSensorData: SensorData = {
  front: 10,
  left: 10,
  right: 10,
  back: 10,
  frontLeft: 10,
  frontRight: 10,
  backLeft: 10,
  backRight: 10
}

const defaultMetrics: SimulationMetrics = {
  distanceTraveled: 0,
  timeElapsed: 0,
  commandsExecuted: 0,
  collisions: 0,
  averageSpeed: 0,
  executionTime: 0,
  pathEfficiency: 0
}

// Animation State Machine Transitions
const stateTransitions: Record<AnimationState, AnimationState[]> = {
  [AnimationState.IDLE]: [
    AnimationState.MOVING_FORWARD,
    AnimationState.MOVING_BACKWARD,
    AnimationState.TURNING_LEFT,
    AnimationState.TURNING_RIGHT,
  ],
  [AnimationState.MOVING_FORWARD]: [
    AnimationState.IDLE,
    AnimationState.STOPPING,
    AnimationState.TURNING_LEFT,
    AnimationState.TURNING_RIGHT
  ],
  [AnimationState.MOVING_BACKWARD]: [
    AnimationState.IDLE,
    AnimationState.STOPPING,
    AnimationState.TURNING_LEFT,
    AnimationState.TURNING_RIGHT
  ],
  [AnimationState.TURNING_LEFT]: [
    AnimationState.IDLE,
    AnimationState.MOVING_FORWARD,
    AnimationState.MOVING_BACKWARD,
    AnimationState.STOPPING
  ],
  [AnimationState.TURNING_RIGHT]: [
    AnimationState.IDLE,
    AnimationState.MOVING_FORWARD,
    AnimationState.MOVING_BACKWARD,
    AnimationState.STOPPING
  ],
  [AnimationState.STOPPING]: [
    AnimationState.IDLE
  ]
}

// Create the store with subscriptions
export const useSimulationStore = create<SimulationStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial State
    isRunning: false,
    isPaused: false,
    isExecuting: false,
    stepMode: false,
    speed: 1,
    debugMode: false,

    carPhysics: { ...defaultCarPhysics },
    carAnimation: { ...defaultCarAnimation },
    sensorData: { ...defaultSensorData },
    metrics: { ...defaultMetrics },
    
    cumulativeAngle: 0, // Initialize Python cumulative angle

    activeLoops: [], // Initialize active event loops array
    
    commandQueue: [],
    currentCommand: null,
    commandHistory: [],

    obstacles: [],

    currentCode: '',
    codeHistory: [],
    executionError: null,

    // Simulation Control Actions
    setRunning: (running) => set({ isRunning: running }),
    setPaused: (paused) => set({ isPaused: paused }),
    setSpeed: (speed) => set({ speed: Math.max(0.1, Math.min(5, speed)) }),       
    setDebugMode: (debug) => set({ debugMode: debug }),

    // Car Control Actions
    updateCarPhysics: (physics) => set((state) => ({
      carPhysics: { ...state.carPhysics, ...physics }
    })),

    setAnimationState: (newState) => {
      const { canTransitionTo, transitionToState } = get()
      if (canTransitionTo(newState)) {
        transitionToState(newState)
      }
    },

    updateCarPosition: (position) => set((state) => ({
      carPhysics: { ...state.carPhysics, position: position.clone() },
      carAnimation: { ...state.carAnimation, targetPosition: position.clone() }   
    })),

    updateCarRotation: (rotation) => set((state) => ({
      carPhysics: { ...state.carPhysics, rotation: rotation.clone() },
      carAnimation: { ...state.carAnimation, targetRotation: rotation.clone() }   
    })),

    updateSensorData: (sensors) => set((state) => ({
      sensorData: { ...state.sensorData, ...sensors }
    })),

    updateCumulativeAngle: (angle) => set({ cumulativeAngle: angle }),

    // Command Actions
    addCommand: (commandData) => {
      const command: MovementCommand = {
        ...commandData,
        id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,       
        timestamp: Date.now(),
        executed: false
      }

      set((state) => ({
        commandQueue: [...state.commandQueue, command]
      }))
    },

    executeNextCommand: async () => {
      const state = get()
      // Don't start a new command if we're already executing one or if the queue is empty
      if (state.commandQueue.length === 0 || state.isExecuting) {
        console.log(`Cannot execute next command: ${state.isExecuting ? 'Already executing' : 'Queue empty'}`);
        return;
      }

      console.log(`⏩ Starting next command execution, queue length: ${state.commandQueue.length}`);
      const nextCommand = state.commandQueue[0]
      // Set executing state and remove command from queue
      set({
        isExecuting: true,
        currentCommand: nextCommand,
        commandQueue: state.commandQueue.slice(1)
      })

      try {
        await executeCommand(nextCommand, get, set)

        // Get the current position and rotation to preserve them
        const currentPos = get().carPhysics.position.clone();
        const currentRot = get().carPhysics.rotation.clone();
        
        console.log(`Command completed. Final position: (${currentPos.x.toFixed(2)}, ${currentPos.y.toFixed(2)}, ${currentPos.z.toFixed(2)}), rotation: ${(currentRot.y * 180 / Math.PI).toFixed(1)}°`);
        
        // Complete the command execution - clear the current command marker
        set((state) => {
          // First, create a snapshot of the position and rotation that we want to preserve
          const finalPos = currentPos.clone();
          const finalRot = currentRot.clone();
          
          // Return the immediate state update
          const result = {
            commandHistory: [...state.commandHistory, { ...nextCommand, executed: true, endTime: Date.now() }],
            currentCommand: null,
            isExecuting: false,
            metrics: { ...state.metrics, commandsExecuted: state.metrics.commandsExecuted + 1 },
            carAnimation: {
              ...state.carAnimation,
              currentState: AnimationState.IDLE,
              targetPosition: finalPos,
              targetRotation: finalRot
            },
            carPhysics: {
              ...state.carPhysics,
              position: finalPos,  // Preserve current position
              rotation: finalRot,  // Preserve current rotation
              velocity: new THREE.Vector3(0, 0, 0),
              angularVelocity: new THREE.Vector3(0, 0, 0)
            }
          };
          
          // Process next command immediately if there are more in the queue
          // This ensures continuous execution of commands in a loop
          setTimeout(() => {
            const latestState = get();
            
            // Ensure the position is absolutely preserved
            if (!latestState.carPhysics.position.equals(finalPos)) {
              console.log('Position changed after command completion - forcing correction');
              set({
                carPhysics: {
                  ...latestState.carPhysics,
                  position: finalPos.clone(),
                  rotation: finalRot.clone()
                }
              });
            }
            
            // Critical: Always check the command queue and execute next command if available
            if (latestState.commandQueue.length > 0 && latestState.isRunning) {
              console.log(`🔄 Auto-executing next command, ${latestState.commandQueue.length} commands remaining`);
              // Use requestAnimationFrame for smoother timing
              requestAnimationFrame(() => {
                const currentState = get();
                if (!currentState.isExecuting && currentState.commandQueue.length > 0) {
                  currentState.executeNextCommand();
                }
              });
            } else {
              console.log(`✅ Command sequence complete, queue empty: ${latestState.commandQueue.length === 0}`);
            }
          }, 50);
          
          return result;
        });
      } catch (error) {
        console.error('Command execution error:', error)
        set({
          executionError: error instanceof Error ? error.message : 'Unknown execution error',
          currentCommand: null,
          isExecuting: false
        })
      }
    },

    clearCommandQueue: () => set({ commandQueue: [], currentCommand: null }),     
    setCurrentCommand: (command) => set({ currentCommand: command }),

    // Code Actions
    setCurrentCode: (code) => set({ currentCode: code }),

    parseAndExecuteCode: async (code) => {
      try {
        set({ executionError: null })
        const commandTemplates = parseCodeToCommands(code)
        const commands = commandTemplates.map(template => ({
          ...template,
          id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,     
          timestamp: Date.now(),
          executed: false
        }))
        set((state) => ({
          commandQueue: [...state.commandQueue, ...commands],
          codeHistory: [...state.codeHistory, code]
        }))
      } catch (error) {
        set({
          executionError: error instanceof Error ? error.message : 'Code parsing error'
        })
      }
    },

    setExecutionError: (error) => set({ executionError: error }),

    // Environment Actions
    addObstacle: (obstacleData) => {
      const obstacle = {
        ...obstacleData,
        id: `obstacle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`   
      }
      set((state) => ({
        obstacles: [...state.obstacles, obstacle]
      }))
    },

    removeObstacle: (id) => set((state) => ({
      obstacles: state.obstacles.filter(obs => obs.id !== id)
    })),

    clearObstacles: () => set({ obstacles: [] }),

    // Event Loop Management
    registerEventLoop: (id: NodeJS.Timeout) => set((state) => ({
      activeLoops: [...state.activeLoops, id]
    })),
    
    clearEventLoop: (id: NodeJS.Timeout) => set((state) => ({
      activeLoops: state.activeLoops.filter(loopId => loopId !== id)
    })),
    
    clearAllEventLoops: () => {
      const state = get()
      state.activeLoops.forEach(id => {
        // Clear any active interval
        if (typeof window !== 'undefined') {
          clearInterval(id)
        }
      })
      set({ activeLoops: [] })
    },
    
    // Simulation Actions
    resetSimulation: () => {
      console.log('🚨 Reset simulation called - this should not happen after command sequence');
      
      // Clear any active event loops first
      get().clearAllEventLoops();
      
      // Get the current state
      const currentState = get();
      
      // Check if the car has moved significantly from origin
      const hasMovedFromOrigin = 
        Math.abs(currentState.carPhysics.position.x) > 0.1 || 
        Math.abs(currentState.carPhysics.position.z) > 0.1;
      
      // Preserve position if the car has moved, otherwise use default
      const positionToUse = hasMovedFromOrigin 
        ? currentState.carPhysics.position.clone()
        : new THREE.Vector3(0, 1, 0);
      
      // Preserve rotation
      const rotationToUse = currentState.carPhysics.rotation.clone();
      
      console.log(`Reset simulation - ${hasMovedFromOrigin ? 'PRESERVING' : 'RESETTING'} position: (${positionToUse.x.toFixed(2)},${positionToUse.y.toFixed(2)},${positionToUse.z.toFixed(2)})`);
      
      // Reset with preserved position and rotation
      set({
        isRunning: false,
        isPaused: false,
        isExecuting: false,
        carPhysics: { 
          ...defaultCarPhysics,
          position: positionToUse,
          rotation: rotationToUse
        },
        carAnimation: { 
          ...defaultCarAnimation,
          targetPosition: positionToUse,
          targetRotation: rotationToUse
        },
        sensorData: { ...defaultSensorData },
        metrics: { ...defaultMetrics },
        cumulativeAngle: currentState.cumulativeAngle, // Preserve cumulative angle too
        commandQueue: [],
        currentCommand: null,
        executionError: null
      });
      
      // Schedule an additional update to ensure the position sticks
      setTimeout(() => {
        const latestState = get();
        if (latestState.isRunning && !latestState.carPhysics.position.equals(positionToUse)) {
          console.log('Position changed after reset - forcing correction');
          set({
            carPhysics: {
              ...latestState.carPhysics,
              position: positionToUse.clone(),
              rotation: rotationToUse.clone()
            },
            carAnimation: {
              ...latestState.carAnimation,
              targetPosition: positionToUse.clone(),
              targetRotation: rotationToUse.clone()
            }
          });
        }
      }, 100);
    },

    updateMetrics: () => {
      const state = get()
      const currentTime = Date.now()
      
      set((state) => ({
        metrics: {
          ...state.metrics,
          timeElapsed: currentTime - (state.metrics.executionTime || currentTime),
          averageSpeed: state.carPhysics.velocity.length()
        }
      }))
    },

    // Animation State Machine
    canTransitionTo: (newState) => {
      const currentState = get().carAnimation.currentState
      return stateTransitions[currentState]?.includes(newState) ?? false
    },

    transitionToState: (newState) => {
      set((state) => ({
        carAnimation: {
          ...state.carAnimation,
          previousState: state.carAnimation.currentState,
          currentState: newState,
          isTransitioning: true,
          animationProgress: 0
        }
      }))
    }
  }))
)

// Helper Functions
function parseCodeToCommands(code: string): Omit<MovementCommand, 'id' | 'timestamp' | 'executed'>[] {
  const commands: Omit<MovementCommand, 'id' | 'timestamp' | 'executed'>[] = []   
  const lines = code.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    // Parse forward and backward commands
    if (trimmed.match(/car\.forward\s*\(\s*(\d+\.?\d*)\s*\)/)) {
      const distance = parseFloat(trimmed.match(/(\d+\.?\d*)/)?.[0] || '1')       
      commands.push({
        type: 'forward',
        value: distance,
        duration: distance * 1000 // 1 second per unit
      })
    } else if (trimmed.match(/car\.backward\s*\(\s*(\d+\.?\d*)\s*\)/)) {
      const distance = parseFloat(trimmed.match(/(\d+\.?\d*)/)?.[0] || '1')       
      commands.push({
        type: 'backward',
        value: distance,
        duration: distance * 1000
      })
    }
    // Handle left and right turns
    else if (trimmed.match(/car\.left\s*\(\s*(\d+\.?\d*)\s*\)/)) {
      const degrees = parseFloat(trimmed.match(/(\d+\.?\d*)/)?.[0] || '90')       
      console.log(`Adding left turn command: ${degrees} degrees`)
      commands.push({
        type: 'turn_left',
        value: degrees,
        duration: (degrees / 90) * 1000 // Scale duration based on angle
      })
    }
    else if (trimmed.match(/car\.right\s*\(\s*(\d+\.?\d*)\s*\)/)) {
      const degrees = parseFloat(trimmed.match(/(\d+\.?\d*)/)?.[0] || '90')       
      console.log(`Adding right turn command: ${degrees} degrees`)
      commands.push({
        type: 'turn_right',
        value: degrees,
        duration: (degrees / 90) * 1000 // Scale duration based on angle
      })
    }
    // Handle other command types
    else if (trimmed.match(/car\.(turn_left|turn_right|stop)\s*\(/)) {
      console.log(`Ignoring command: ${trimmed} - use car.left() or car.right() instead`)
    }
    // Keep the wait command for timing purposes
    else if (trimmed.match(/time\.sleep\s*\(\s*(\d+\.?\d*)\s*\)/)) {
      const seconds = parseFloat(trimmed.match(/(\d+\.?\d*)/)?.[0] || '1')        
      commands.push({
        type: 'wait',
        duration: seconds * 1000
      })
    }
  }

  return commands
}

async function executeCommand(
  command: MovementCommand,
  get: () => SimulationStore,
  set: (fn: (state: SimulationStore) => Partial<SimulationStore>) => void
): Promise<void> {
  return new Promise((resolve) => {
    const startTime = Date.now()
    command.startTime = startTime

    console.log(`Executing command: ${command.type} with value ${command.value || 1} and duration ${command.duration || 1000}ms`)
    
    // Mark all commands as executed immediately - this allows Python loops to continue correctly
    set((state) => ({
      currentCommand: {
        ...command,
        executed: true,
      }
    }))
    
    // Process all command types
    switch (command.type) {
      case 'forward':
        executeForwardCommand(command, get, set, resolve)
        break
      case 'backward':
        executeBackwardCommand(command, get, set, resolve)
        break
      case 'turn_left':
        console.log(`Executing turn left command: ${command.value} degrees`)      
        executeTurnLeftCommand(command, get, set, resolve)
        break
      case 'turn_right':
        console.log(`Executing turn right command: ${command.value} degrees`)     
        executeTurnRightCommand(command, get, set, resolve)
        break
      case 'stop':
      case 'wait':
        console.log(`Command type '${command.type}' - stopping/waiting`)
        // Mark as executed but don't actually do anything
        command.executed = true
        command.endTime = Date.now()

        // Force the car to IDLE state
        set((state) => ({
          carAnimation: {
            ...state.carAnimation,
            currentState: AnimationState.IDLE
          },
          carPhysics: {
            ...state.carPhysics,
            velocity: new THREE.Vector3(0, 0, 0),
            angularVelocity: new THREE.Vector3(0, 0, 0)
          }
        }))

        resolve()
        break
      default:
        resolve()
    }
  })
}

// Helper function to process cumulative angles for 3D rotation
function processAngleForRotation(cumulativeAngle: number): number {
  // Normalize angle to [-180, 180] range for consistent rotation
  // This uses our utility function to prevent wrapping issues
  const radians = (cumulativeAngle * Math.PI) / 180
  const normalizedRadians = normalizeAngle(radians)
  const normalizedDegrees = (normalizedRadians * 180) / Math.PI
  
  console.log(`🔄 3D Rotation: ${cumulativeAngle}° → normalized: ${normalizedDegrees.toFixed(1)}°`)
  return normalizedDegrees
}

function executeForwardCommand(
  command: MovementCommand,
  get: () => SimulationStore,
  set: (fn: (state: SimulationStore) => Partial<SimulationStore>) => void,        
  resolve: () => void
) {
  const { setAnimationState } = get()
  setAnimationState(AnimationState.MOVING_FORWARD)

  const distance = command.value || 1
  const duration = command.duration || 1000

  const startPos = get().carPhysics.position.clone()
  // Calculate direction based on current rotation
  // In 3D forward is positive Z direction (toward camera)
  const direction = new THREE.Vector3(0, 0, 1)
  direction.applyEuler(get().carPhysics.rotation)

  // Calculate target position by moving along the direction vector
  const targetPos = startPos.clone().add(direction.multiplyScalar(distance))      

  console.log(`Forward command - distance: ${distance}, from: (${startPos.x.toFixed(2)}, ${startPos.z.toFixed(2)}), to: (${targetPos.x.toFixed(2)}, ${targetPos.z.toFixed(2)})`)
  // Run the animation with the calculated target position
  animateToPosition(targetPos, duration, get, set, () => {
    // First set to stopping state
    get().setAnimationState(AnimationState.STOPPING)

    // Force velocity to zero
    set((state) => ({
      carPhysics: {
        ...state.carPhysics,
        position: targetPos.clone(), // Ensure final position is exact
        velocity: new THREE.Vector3(0, 0, 0),
        angularVelocity: new THREE.Vector3(0, 0, 0)
      }
    }))

    // Add a small delay before setting to IDLE to ensure physics has time to update
    setTimeout(() => {
      get().setAnimationState(AnimationState.IDLE)
      resolve()
    }, 50)
  })
}

function executeBackwardCommand(
  command: MovementCommand,
  get: () => SimulationStore,
  set: (fn: (state: SimulationStore) => Partial<SimulationStore>) => void,        
  resolve: () => void
) {
  const { setAnimationState } = get()

  // Make sure we're explicitly setting the BACKWARD state
  console.log('Setting animation state to MOVING_BACKWARD for backward command')  
  setAnimationState(AnimationState.MOVING_BACKWARD)

  // Ensure distance and duration are positive
  const distance = Math.abs(command.value || 1)
  const duration = Math.abs(command.duration || 1000)

  const startPos = get().carPhysics.position.clone()
  // Direction for backward is negative Z (opposite of forward)
  const direction = new THREE.Vector3(0, 0, -1)
  direction.applyEuler(get().carPhysics.rotation)

  // Calculate target position by moving along the direction vector
  const targetPos = startPos.clone().add(direction.multiplyScalar(distance))      

  console.log(`Backward command - distance: ${distance}, from: (${startPos.x.toFixed(2)}, ${startPos.z.toFixed(2)}), to: (${targetPos.x.toFixed(2)}, ${targetPos.z.toFixed(2)})`)
  // Run the animation with the calculated target position
  animateToPosition(targetPos, duration, get, set, () => {
    // First set to stopping state
    get().setAnimationState(AnimationState.STOPPING)

    // Force velocity to zero and ensure final position
    set((state) => ({
      carPhysics: {
        ...state.carPhysics,
        position: targetPos.clone(), // Ensure final position is exact
        velocity: new THREE.Vector3(0, 0, 0),
        angularVelocity: new THREE.Vector3(0, 0, 0)
      }
    }))

    // Add a small delay before setting to IDLE to ensure physics has time to update
    setTimeout(() => {
      get().setAnimationState(AnimationState.IDLE)
      resolve()
    }, 50)
  })
}

function executeTurnLeftCommand(
  command: MovementCommand,
  get: () => SimulationStore,
  set: (fn: (state: SimulationStore) => Partial<SimulationStore>) => void,        
  resolve: () => void
) {
  const { setAnimationState } = get()
  setAnimationState(AnimationState.TURNING_LEFT)

  const angle = command.value || 90
  const duration = command.duration || 1000

  // Calculate new cumulative angle first
  const { cumulativeAngle, updateCumulativeAngle } = get()
  const newCumulativeAngle = cumulativeAngle + angle // Left turn increases angle (counter-clockwise)
  
  // Process the cumulative angle for 3D rotation with proper normalization
  const processedAngle = processAngleForRotation(newCumulativeAngle)
  
  // Set target rotation based on processed cumulative angle
  const targetRot = new THREE.Euler(0, THREE.MathUtils.degToRad(processedAngle), 0)
  
  // Save the current position before rotation - this is critical
  const currentPos = get().carPhysics.position.clone()

  console.log(`🔄 Turn Left: ${cumulativeAngle}° → ${newCumulativeAngle}° (cumulative), normalized to ${processedAngle}°`)

  animateToRotation(targetRot, duration, get, set, 'left', angle, () => {
    // Update the cumulative angle in store
    updateCumulativeAngle(newCumulativeAngle)
    
    // Important: preserve the current position while updating rotation
    // This prevents the position from jumping back after a sequence of commands
    set((state) => ({
      carPhysics: {
        ...state.carPhysics,
        position: currentPos.clone(), // Keep the same position
        rotation: targetRot.clone(),  // But update rotation
        velocity: new THREE.Vector3(0, 0, 0),
        angularVelocity: new THREE.Vector3(0, 0, 0)
      }
    }))
    
    // Sync with Python using cumulative angle
    if (typeof window !== 'undefined' && (window as any).oboCarAPI) {
      console.log(`🔄 Left turn: updating cumulative angle ${cumulativeAngle}° → ${newCumulativeAngle}°`)
      ;(window as any).oboCarAPI.syncAngleWithPython(newCumulativeAngle)
    }
    
    get().setAnimationState(AnimationState.IDLE)
    resolve()
  })
}

function executeTurnRightCommand(
  command: MovementCommand,
  get: () => SimulationStore,
  set: (fn: (state: SimulationStore) => Partial<SimulationStore>) => void,        
  resolve: () => void
) {
  const { setAnimationState } = get()
  setAnimationState(AnimationState.TURNING_RIGHT)

  const angle = command.value || 90
  const duration = command.duration || 1000

  // Calculate new cumulative angle first
  const { cumulativeAngle, updateCumulativeAngle } = get()
  const newCumulativeAngle = cumulativeAngle - angle // Right turn decreases angle (clockwise)
  
  // Process the cumulative angle for 3D rotation with proper normalization
  const processedAngle = processAngleForRotation(newCumulativeAngle)
  
  // Set target rotation based on processed cumulative angle
  const targetRot = new THREE.Euler(0, THREE.MathUtils.degToRad(processedAngle), 0)
  
  // Save the current position before rotation - this is critical
  const currentPos = get().carPhysics.position.clone()

  console.log(`🔄 Turn Right: ${cumulativeAngle}° → ${newCumulativeAngle}° (cumulative), normalized to ${processedAngle}°`)

  animateToRotation(targetRot, duration, get, set, 'right', angle, () => {
    // Update the cumulative angle in store
    updateCumulativeAngle(newCumulativeAngle)
    
    // Important: preserve the current position while updating rotation
    // This prevents the position from jumping back after a sequence of commands
    set((state) => ({
      carPhysics: {
        ...state.carPhysics,
        position: currentPos.clone(), // Keep the same position
        rotation: targetRot.clone(),  // But update rotation
        velocity: new THREE.Vector3(0, 0, 0),
        angularVelocity: new THREE.Vector3(0, 0, 0)
      }
    }))
    
    // Sync with Python using cumulative angle
    if (typeof window !== 'undefined' && (window as any).oboCarAPI) {
      console.log(`🔄 Right turn: updating cumulative angle ${cumulativeAngle}° → ${newCumulativeAngle}°`)
      ;(window as any).oboCarAPI.syncAngleWithPython(newCumulativeAngle)
    }
    
    get().setAnimationState(AnimationState.IDLE)
    resolve()
  })
}

function executeStopCommand(
  command: MovementCommand,
  get: () => SimulationStore,
  set: (fn: (state: SimulationStore) => Partial<SimulationStore>) => void,        
  resolve: () => void
) {
  const { setAnimationState } = get()
  setAnimationState(AnimationState.STOPPING)

  set((state) => ({
    carPhysics: {
      ...state.carPhysics,
      velocity: new THREE.Vector3(0, 0, 0),
      acceleration: new THREE.Vector3(0, 0, 0)
    }
  }))

  setTimeout(() => {
    get().setAnimationState(AnimationState.IDLE)
    resolve()
  }, command.duration || 500)
}

function executeWaitCommand(
  command: MovementCommand,
  get: () => SimulationStore,
  set: (fn: (state: SimulationStore) => Partial<SimulationStore>) => void,        
  resolve: () => void
) {
  setTimeout(resolve, command.duration || 1000)
}

// Global flag to prevent multiple position animation loops
let positionAnimationId: number | null = null;

function animateToPosition(
  targetPos: THREE.Vector3,
  duration: number,
  get: () => SimulationStore,
  set: (fn: (state: SimulationStore) => Partial<SimulationStore>) => void,        
  onComplete: () => void
) {
  // Cancel any existing position animation
  if (positionAnimationId) {
    cancelAnimationFrame(positionAnimationId);
    positionAnimationId = null;
  }

  const startTime = Date.now()
  const startPos = get().carPhysics.position.clone()

  // Set a flag to prevent multiple completion calls
  let isCompleted = false

  // Apply a final cleanup at the very end of animation to ensure the car truly stops
  const finalCleanup = () => {
    console.log('Finalizing position animation - ensuring complete stop');        

    // Force all physics values to their final states
    set((state) => ({
      carPhysics: {
        ...state.carPhysics,
        position: targetPos.clone(),
        velocity: new THREE.Vector3(0, 0, 0),
        angularVelocity: new THREE.Vector3(0, 0, 0),
        acceleration: new THREE.Vector3(0, 0, 0)
      },
      carAnimation: { ...state.carAnimation, animationProgress: 1 }
    }));

    // Set to STOPPING state with a slight delay to allow physics to update       
    setTimeout(() => {
      // Set the state to STOPPING (will transition to IDLE later)
      get().setAnimationState(AnimationState.STOPPING);

      // Force velocity to absolute zero again
      set((state) => ({
        carPhysics: {
          ...state.carPhysics,
          velocity: new THREE.Vector3(0, 0, 0),
          angularVelocity: new THREE.Vector3(0, 0, 0)
        }
      }));

      // Call onComplete with a slight delay to allow stopping state to take effect
      setTimeout(onComplete, 100);
    }, 50);
  };

  const animate = () => {
    // Don't continue animation if we've already completed
    if (isCompleted) return

    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)

    const currentPos = startPos.clone().lerp(targetPos, progress)

    // Update position and gradually reduce velocity as we approach target        
    set((state) => {
      // If we're at the end, zero out velocity immediately
      if (progress === 1) {
        return {
          carPhysics: {
            ...state.carPhysics,
            position: currentPos,
            velocity: new THREE.Vector3(0, 0, 0)
          },
          carAnimation: { ...state.carAnimation, animationProgress: progress }    
        };
      }

      // Otherwise gradually reduce velocity as we approach the end
      const velocityScale = Math.max(0.1, 1 - progress); // Gradually reduce to 10% at end
      return {
        carPhysics: {
          ...state.carPhysics,
          position: currentPos,
          velocity: state.carPhysics.velocity.clone().multiplyScalar(velocityScale)
        },
        carAnimation: { ...state.carAnimation, animationProgress: progress }      
      };
    });

    if (progress < 1) {
      positionAnimationId = requestAnimationFrame(animate);
    } else {
      // Mark as completed to prevent multiple calls
      isCompleted = true;
      positionAnimationId = null;

      // Apply the final cleanup to ensure complete stop
      finalCleanup();
    }
  }

  // Start the animation
  animate();
}

// Global flag to prevent multiple animation loops
let rotationAnimationId: number | null = null;

function animateToRotation(
  targetRot: THREE.Euler,
  duration: number,
  get: () => SimulationStore,
  set: (fn: (state: SimulationStore) => Partial<SimulationStore>) => void,        
  direction: 'left' | 'right',
  requestedAngle: number,
  onComplete: () => void
) {
  // Cancel any existing rotation animation
  if (rotationAnimationId) {
    cancelAnimationFrame(rotationAnimationId);
    rotationAnimationId = null;
  }

  const startTime = Date.now()
  const startRot = get().carPhysics.rotation.clone()

  // Convert Euler to Quaternions for proper interpolation (prevents gimbal lock and flipping)
  const startQuat = new THREE.Quaternion().setFromEuler(startRot)
  const targetQuat = new THREE.Quaternion().setFromEuler(targetRot)
  
  // CRITICAL FIX: Ensure we rotate in the requested direction
  // by adjusting the target quaternion if needed
  const requestedAngleRadians = (requestedAngle * Math.PI) / 180
  
  // Calculate the actual angle difference using quaternions
  const dotProduct = startQuat.dot(targetQuat)
  
  // If the dot product is negative, the quaternions will take the long way
  // We need to negate one to ensure shortest path, UNLESS the user wants the long way
  if (direction === 'left' && requestedAngle > 180) {
    // User wants to go the long way left (> 180 degrees)
    if (dotProduct > 0) targetQuat.set(-targetQuat.x, -targetQuat.y, -targetQuat.z, -targetQuat.w)
  } else if (direction === 'right' && requestedAngle > 180) {
    // User wants to go the long way right (> 180 degrees)
    if (dotProduct > 0) targetQuat.set(-targetQuat.x, -targetQuat.y, -targetQuat.z, -targetQuat.w)
  } else {
    // Normal case: take the shortest path
    if (dotProduct < 0) targetQuat.set(-targetQuat.x, -targetQuat.y, -targetQuat.z, -targetQuat.w)
  }

  // Convert to degrees for logging
  const startDegrees = startRot.y * (180 / Math.PI)
  const targetDegrees = targetRot.y * (180 / Math.PI)

  console.log(`Starting rotation animation: ${startDegrees.toFixed(2)}° → ${targetDegrees.toFixed(2)}° (${direction}, ${requestedAngle}°)`)
  
  // Flag to prevent multiple completion calls
  let isCompleted = false

  // Final cleanup function to ensure proper rotation
  const finalCleanup = () => {
    console.log(`Finalizing rotation to ${targetDegrees.toFixed(2)}°`)      

    // Get the current position to preserve it
    const currentPos = get().carPhysics.position.clone();

    // Force exact target rotation and zero out velocities while preserving position
    set((state) => ({
      carPhysics: {
        ...state.carPhysics,
        position: currentPos,  // Explicitly maintain current position
        rotation: targetRot.clone(),
        velocity: new THREE.Vector3(0, 0, 0),
        angularVelocity: new THREE.Vector3(0, 0, 0)
      },
      carAnimation: {
        ...state.carAnimation,
        animationProgress: 1,
        targetRotation: targetRot.clone(),
        targetPosition: currentPos  // Update target position too
      }
    }))
  }

  const animate = () => {
    // Don't continue if already completed
    if (isCompleted) return

    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)

    // Use quaternion SLERP (Spherical Linear Interpolation) for smooth rotation
    // This prevents gimbal lock and flipping issues
    const currentQuat = new THREE.Quaternion().slerpQuaternions(startQuat, targetQuat, progress)
    
    // Convert back to Euler for storage
    const currentRot = new THREE.Euler().setFromQuaternion(currentQuat)

    // Normalize the Y rotation to be consistent
    currentRot.y = ((currentRot.y % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI)
    if (currentRot.y > Math.PI) {
      currentRot.y -= 2 * Math.PI
    }

    // Log progress at key intervals
    const currentDegrees = currentRot.y * (180 / Math.PI)
    if (progress === 0 || progress === 1 || Math.abs(progress - 0.5) < 0.02) {
      console.log(`Rotation progress: ${(progress * 100).toFixed(0)}%, current: ${currentDegrees.toFixed(2)}°`)
    }

    set((state) => ({
      carPhysics: {
        ...state.carPhysics,
        rotation: currentRot,
        // Gradually reduce angular velocity as we approach the end
        angularVelocity: state.carPhysics.angularVelocity.clone().multiplyScalar(Math.max(0.1, 1 - progress))
      },
      carAnimation: { ...state.carAnimation, animationProgress: progress }        
    }))

    if (progress < 1) {
      rotationAnimationId = requestAnimationFrame(animate)
    } else {
      // Mark as completed to prevent multiple completions
      isCompleted = true
      rotationAnimationId = null

      // Apply final cleanup
      finalCleanup()

      // Short delay to ensure physics system is updated
      setTimeout(() => {
        onComplete()
      }, 50)
    }
  }

  animate()
}