import { create } from "zustand"

export interface CarState {
  position: [number, number, number]
  rotation: number
  velocity: number
  isMoving: boolean
  sensorReadings: {
    front: number
    left: number
    right: number
    back: number
  }
  distanceTraveled: number
  executionTime: number
  pathHistory: [number, number, number][]
  collisionCount: number
  isColliding: boolean
}

export interface SimulationState {
  isRunning: boolean
  isPaused: boolean
  speed: number
  car: CarState
  obstacles: Array<{
    id: string
    position: [number, number, number]
    size: [number, number, number]
    color: string
  }>
  commands: Array<{
    id: string
    type: string
    params: any
    timestamp: number
    executed: boolean
  }>
}

export const useSimulationStore = create<
  SimulationState & {
    updateCarPosition: (position: [number, number, number]) => void
    updateCarRotation: (rotation: number) => void
    updateSensorReadings: (readings: Partial<CarState["sensorReadings"]>) => void
    addCommand: (command: Omit<SimulationState["commands"][0], "id" | "timestamp">) => void
    executeCommand: (commandId: string) => void
    resetSimulation: () => void
    togglePause: () => void
    setSpeed: (speed: number) => void
    incrementCollision: () => void
    setIsRunning: (running: boolean) => void
  }
>((set, get) => ({
  isRunning: false,
  isPaused: false,
  speed: 1,
  car: {
    position: [0, 1, 0],
    rotation: 0,
    velocity: 0,
    isMoving: false,
    sensorReadings: {
      front: 10,
      left: 10,
      right: 10,
      back: 10,
    },
    distanceTraveled: 0,
    executionTime: 0,
    pathHistory: [],
    collisionCount: 0,
    isColliding: false,
  },
  obstacles: [],
  commands: [],

  updateCarPosition: (position) => {
    console.log(`[v0] 🔄 Updating car position in store: [${position[0]}, ${position[1]}, ${position[2]}]`);
    return set((state) => ({
      car: {
        ...state.car,
        position,
        pathHistory: [...state.car.pathHistory, position],
        distanceTraveled:
          state.car.distanceTraveled +
          (state.car.pathHistory.length > 0
            ? Math.sqrt(
                Math.pow(position[0] - state.car.position[0], 2) + Math.pow(position[2] - state.car.position[2], 2),
              )
            : 0),
      },
    }));
  },

  updateCarRotation: (rotation) => {
    console.log(`[v0] 🔄 Updating car rotation in store: ${rotation}°`);
    return set((state) => ({
      car: { ...state.car, rotation },
    }));
  },

  updateSensorReadings: (readings) =>
    set((state) => ({
      car: {
        ...state.car,
        sensorReadings: { ...state.car.sensorReadings, ...readings },
      },
    })),

  addCommand: (command) =>
    set((state) => ({
      commands: [
        ...state.commands,
        {
          ...command,
          id: Math.random().toString(36).substr(2, 9),
          timestamp: Date.now(),
        },
      ],
    })),

  executeCommand: (commandId) =>
    set((state) => ({
      commands: state.commands.map((cmd) => (cmd.id === commandId ? { ...cmd, executed: true } : cmd)),
    })),

  resetSimulation: () =>
    set(() => ({
      isRunning: false,
      isPaused: false,
      car: {
        position: [0, 1, 0],
        rotation: 0,
        velocity: 0,
        isMoving: false,
        sensorReadings: { front: 10, left: 10, right: 10, back: 10 },
        distanceTraveled: 0,
        executionTime: 0,
        pathHistory: [],
        collisionCount: 0,
        isColliding: false,
      },
      commands: [],
    })),

  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),

  setSpeed: (speed) => set(() => ({ speed })),

  incrementCollision: () =>
    set((state) => ({
      car: {
        ...state.car,
        collisionCount: state.car.collisionCount + 1,
        isColliding: true,
      },
    })),

  setIsRunning: (running) =>
    set(() => ({
      isRunning: running,
    })),
}))

export class CarControlAPI {
  /**
   * Move the car forward or backward
   * @param distance Distance to move (positive for forward, negative for backward)
   */
  moveForward(distance: number): Promise<void> {
    return new Promise((resolve) => {
      console.log(`[v0] API.moveForward(${distance})`)
      this.executePhysicsCommand("forward", distance)
      setTimeout(resolve, 50) // Small delay for animation
    })
  }

  /**
   * Move the car backward
   * @param distance Distance to move backward
   */
  moveBackward(distance: number): Promise<void> {
    return new Promise((resolve) => {
      console.log(`[v0] API.moveBackward(${distance})`)
      this.executePhysicsCommand("backward", distance)
      setTimeout(resolve, 50) // Small delay for animation
    })
  }

  /**
   * Turn the car left
   * @param angle Angle to turn in degrees
   */
  turnLeft(angle: number): Promise<void> {
    return new Promise((resolve) => {
      console.log(`[v0] API.turnLeft(${angle})`)
      this.executePhysicsCommand("left", angle)
      setTimeout(resolve, 50) // Small delay for animation
    })
  }

  /**
   * Turn the car right
   * @param angle Angle to turn in degrees
   */
  turnRight(angle: number): Promise<void> {
    return new Promise((resolve) => {
      console.log(`[v0] API.turnRight(${angle})`)
      this.executePhysicsCommand("right", angle)
      setTimeout(resolve, 50) // Small delay for animation
    })
  }

  /**
   * Wait for the specified time
   * @param seconds Time to wait in seconds
   */
  wait(seconds: number): Promise<void> {
    return new Promise((resolve) => {
      console.log(`[v0] API.wait(${seconds})`)
      this.executePhysicsCommand("wait", seconds)
      setTimeout(resolve, seconds * 1000)
    })
  }

  /**
   * Execute a command that affects the physics simulation
   */
  executePhysicsCommand(command: string, value: number): void {
    console.log(`Executing physics command: ${command}(${value})`)

    const { car, speed, isRunning } = useSimulationStore.getState()

    // Only execute if simulation is running
    if (!isRunning) {
      console.log("Simulation not running, ignoring command")
      return
    }

    switch (command) {
      case "forward":
        this.executeForward(value)
        break
      case "backward":
        this.executeBackward(value)
        break
      case "left":
        this.executeLeft(value)
        break
      case "right":
        this.executeRight(value)
        break
      case "wait":
        this.executeWait(value)
        break
      default:
        console.warn(`[v0] Unknown physics command: ${command}`)
    }
  }

  private executeForward(distance: number): void {
    const { car } = useSimulationStore.getState()
    const rad = (car.rotation * Math.PI) / 180
    
    // IMPORTANT: Using same math as in Python to ensure consistency
    // angle_rad = math.radians(self.angle)
    // new_x = self.position[0] + distance * math.sin(angle_rad)
    // new_y = self.position[1] + distance * math.cos(angle_rad)
    const newX = car.position[0] + distance * Math.sin(rad)
    const newZ = car.position[2] + distance * Math.cos(rad)

    console.log(`[v0] 🚶 Moving forward from [${car.position[0].toFixed(2)}, ${car.position[2].toFixed(2)}] to [${newX.toFixed(2)}, ${newZ.toFixed(2)}]`)
    console.log(`[v0] 📐 Current rotation: ${car.rotation.toFixed(2)}° (${rad.toFixed(2)} radians)`)

    // Update position immediately for physics
    useSimulationStore.getState().updateCarPosition([newX, 1, newZ])

    // Add to command history
    useSimulationStore.getState().addCommand({
      type: "forward",
      params: { distance },
      executed: true,
    })
    
    // Log the position after update
    const newPos = useSimulationStore.getState().car.position;
    console.log(`[v0] ✅ Position updated to [${newPos[0].toFixed(2)}, ${newPos[1].toFixed(2)}, ${newPos[2].toFixed(2)}]`);
  }

  private executeBackward(distance: number): void {
    const { car } = useSimulationStore.getState()
    const rad = (car.rotation * Math.PI) / 180
    
    // IMPORTANT: Using same math as in Python to ensure consistency
    // angle_rad = math.radians(self.angle)
    // new_x = self.position[0] - distance * math.sin(angle_rad)
    // new_y = self.position[1] - distance * math.cos(angle_rad)
    const newX = car.position[0] - distance * Math.sin(rad)
    const newZ = car.position[2] - distance * Math.cos(rad)

    console.log(`[v0] 🔙 Moving backward from [${car.position[0].toFixed(2)}, ${car.position[2].toFixed(2)}] to [${newX.toFixed(2)}, ${newZ.toFixed(2)}]`)
    console.log(`[v0] 📐 Current rotation: ${car.rotation.toFixed(2)}° (${rad.toFixed(2)} radians)`)

    useSimulationStore.getState().updateCarPosition([newX, 1, newZ])

    useSimulationStore.getState().addCommand({
      type: "backward",
      params: { distance },
      executed: true,
    })
    
    // Log the position after update
    const newPos = useSimulationStore.getState().car.position;
    console.log(`[v0] ✅ Position updated to [${newPos[0].toFixed(2)}, ${newPos[1].toFixed(2)}, ${newPos[2].toFixed(2)}]`);
  }

  private executeLeft(angle: number): void {
    const { car } = useSimulationStore.getState()
    const newRotation = car.rotation - angle

    console.log(`[v0] ⬅️ Turning left from ${car.rotation.toFixed(2)}° to ${newRotation.toFixed(2)}°`)

    useSimulationStore.getState().updateCarRotation(newRotation)

    useSimulationStore.getState().addCommand({
      type: "left",
      params: { angle },
      executed: true,
    })
    
    // Log the rotation after update
    const newAngle = useSimulationStore.getState().car.rotation;
    console.log(`[v0] ✅ Rotation updated to ${newAngle.toFixed(2)}°`);
  }

  private executeRight(angle: number): void {
    const { car } = useSimulationStore.getState()
    const newRotation = car.rotation + angle

    console.log(`[v0] ➡️ Turning right from ${car.rotation.toFixed(2)}° to ${newRotation.toFixed(2)}°`)

    useSimulationStore.getState().updateCarRotation(newRotation)

    useSimulationStore.getState().addCommand({
      type: "right",
      params: { angle },
      executed: true,
    })
    
    // Log the rotation after update
    const newAngle = useSimulationStore.getState().car.rotation;
    console.log(`[v0] ✅ Rotation updated to ${newAngle.toFixed(2)}°`);
  }

  private executeWait(seconds: number): void {
    console.log(`[v0] ⏱️ Waiting for ${seconds} seconds`)

    useSimulationStore.getState().addCommand({
      type: "wait",
      params: { seconds },
      executed: true,
    })
  }
}

// Create a singleton instance for global use
declare global {
  interface Window {
    carControlAPI: CarControlAPI
  }
}