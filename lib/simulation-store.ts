import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"
import * as THREE from "three"

// Animation States
export enum AnimationState {
  IDLE = 'idle',
  MOVING_FORWARD = 'moving_forward',
  MOVING_BACKWARD = 'moving_backward',
  TURNING_LEFT = 'turning_left',
  TURNING_RIGHT = 'turning_right',
  STOPPING = 'stopping',
  ACCELERATING = 'accelerating',
  DECELERATING = 'decelerating'
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
  batteryLevel: number
  executionTime: number
  pathEfficiency: number
}

// Main Simulation Store State
export interface SimulationStore {
  // Simulation Control
  isRunning: boolean
  isPaused: boolean
  isExecuting: boolean
  speed: number
  debugMode: boolean
  
  // Car State
  carPhysics: CarPhysicsState
  carAnimation: CarAnimationState
  sensorData: SensorData
  metrics: SimulationMetrics
  
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
  batteryLevel: 100,
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
    AnimationState.ACCELERATING
  ],
  [AnimationState.MOVING_FORWARD]: [
    AnimationState.IDLE,
    AnimationState.STOPPING,
    AnimationState.TURNING_LEFT,
    AnimationState.TURNING_RIGHT,
    AnimationState.ACCELERATING,
    AnimationState.DECELERATING
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
  ],
  [AnimationState.ACCELERATING]: [
    AnimationState.MOVING_FORWARD,
    AnimationState.DECELERATING,
    AnimationState.STOPPING
  ],
  [AnimationState.DECELERATING]: [
    AnimationState.IDLE,
    AnimationState.STOPPING,
    AnimationState.ACCELERATING
  ]
}

// Create the store with subscriptions
export const useSimulationStore = create<SimulationStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial State
    isRunning: false,
    isPaused: false,
    isExecuting: false,
    speed: 1,
    debugMode: false,
    
    carPhysics: { ...defaultCarPhysics },
    carAnimation: { ...defaultCarAnimation },
    sensorData: { ...defaultSensorData },
    metrics: { ...defaultMetrics },
    
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
      if (state.commandQueue.length === 0 || state.isExecuting) return
      
      const nextCommand = state.commandQueue[0]
      set({ 
        isExecuting: true,
        currentCommand: nextCommand,
        commandQueue: state.commandQueue.slice(1)
      })
      
      try {
        await executeCommand(nextCommand, get, set)
        
        set((state) => ({
          commandHistory: [...state.commandHistory, { ...nextCommand, executed: true, endTime: Date.now() }],
          currentCommand: null,
          isExecuting: false,
          metrics: { ...state.metrics, commandsExecuted: state.metrics.commandsExecuted + 1 }
        }))
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
    
    // Simulation Actions
    resetSimulation: () => set({
      isRunning: false,
      isPaused: false,
      isExecuting: false,
      carPhysics: { ...defaultCarPhysics },
      carAnimation: { ...defaultCarAnimation },
      sensorData: { ...defaultSensorData },
      metrics: { ...defaultMetrics },
      commandQueue: [],
      currentCommand: null,
      executionError: null
    }),
    
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
    
    // Parse different command types
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
    } else if (trimmed.match(/car\.turn_left\s*\(\s*(\d+\.?\d*)\s*\)/)) {
      const angle = parseFloat(trimmed.match(/(\d+\.?\d*)/)?.[0] || '90')
      commands.push({
        type: 'turn_left',
        value: angle,
        duration: (angle / 90) * 1000 // 1 second per 90 degrees
      })
    } else if (trimmed.match(/car\.turn_right\s*\(\s*(\d+\.?\d*)\s*\)/)) {
      const angle = parseFloat(trimmed.match(/(\d+\.?\d*)/)?.[0] || '90')
      commands.push({
        type: 'turn_right',
        value: angle,
        duration: (angle / 90) * 1000
      })
    } else if (trimmed.match(/car\.stop\s*\(\s*\)/)) {
      commands.push({
        type: 'stop',
        duration: 500
      })
    } else if (trimmed.match(/time\.sleep\s*\(\s*(\d+\.?\d*)\s*\)/)) {
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
    
    switch (command.type) {
      case 'forward':
        executeForwardCommand(command, get, set, resolve)
        break
      case 'backward':
        executeBackwardCommand(command, get, set, resolve)
        break
      case 'turn_left':
        executeTurnLeftCommand(command, get, set, resolve)
        break
      case 'turn_right':
        executeTurnRightCommand(command, get, set, resolve)
        break
      case 'stop':
        executeStopCommand(command, get, set, resolve)
        break
      case 'wait':
        executeWaitCommand(command, get, set, resolve)
        break
      default:
        resolve()
    }
  })
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
  const direction = new THREE.Vector3(0, 0, -1)
  direction.applyEuler(get().carPhysics.rotation)
  const targetPos = startPos.clone().add(direction.multiplyScalar(distance))
  
  animateToPosition(targetPos, duration, get, set, () => {
    get().setAnimationState(AnimationState.IDLE)
    resolve()
  })
}

function executeBackwardCommand(
  command: MovementCommand,
  get: () => SimulationStore,
  set: (fn: (state: SimulationStore) => Partial<SimulationStore>) => void,
  resolve: () => void
) {
  const { setAnimationState } = get()
  setAnimationState(AnimationState.MOVING_BACKWARD)
  
  const distance = command.value || 1
  const duration = command.duration || 1000
  
  const startPos = get().carPhysics.position.clone()
  const direction = new THREE.Vector3(0, 0, 1)
  direction.applyEuler(get().carPhysics.rotation)
  const targetPos = startPos.clone().add(direction.multiplyScalar(distance))
  
  animateToPosition(targetPos, duration, get, set, () => {
    get().setAnimationState(AnimationState.IDLE)
    resolve()
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
  
  const startRot = get().carPhysics.rotation.clone()
  const targetRot = startRot.clone()
  targetRot.y += THREE.MathUtils.degToRad(angle)
  
  animateToRotation(targetRot, duration, get, set, () => {
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
  
  const startRot = get().carPhysics.rotation.clone()
  const targetRot = startRot.clone()
  targetRot.y -= THREE.MathUtils.degToRad(angle)
  
  animateToRotation(targetRot, duration, get, set, () => {
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

function animateToPosition(
  targetPos: THREE.Vector3,
  duration: number,
  get: () => SimulationStore,
  set: (fn: (state: SimulationStore) => Partial<SimulationStore>) => void,
  onComplete: () => void
) {
  const startTime = Date.now()
  const startPos = get().carPhysics.position.clone()
  
  const animate = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    
    const currentPos = startPos.clone().lerp(targetPos, progress)
    
    set((state) => ({
      carPhysics: { ...state.carPhysics, position: currentPos },
      carAnimation: { ...state.carAnimation, animationProgress: progress }
    }))
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      onComplete()
    }
  }
  
  animate()
}

function animateToRotation(
  targetRot: THREE.Euler,
  duration: number,
  get: () => SimulationStore,
  set: (fn: (state: SimulationStore) => Partial<SimulationStore>) => void,
  onComplete: () => void
) {
  const startTime = Date.now()
  const startRot = get().carPhysics.rotation.clone()
  
  const animate = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    
    const currentRot = new THREE.Euler(
      THREE.MathUtils.lerp(startRot.x, targetRot.x, progress),
      THREE.MathUtils.lerp(startRot.y, targetRot.y, progress),
      THREE.MathUtils.lerp(startRot.z, targetRot.z, progress)
    )
    
    set((state) => ({
      carPhysics: { ...state.carPhysics, rotation: currentRot },
      carAnimation: { ...state.carAnimation, animationProgress: progress }
    }))
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      onComplete()
    }
  }
  
  animate()
}