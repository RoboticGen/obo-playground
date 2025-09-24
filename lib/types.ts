declare global {
  interface Window {
    oboCarAPI: {
      move: (distance: number, direction: number, rotation: number) => void
      rotate: (angle: number) => void
      log: (message: string) => void
    }
    loadPyodide: () => Promise<any>
  }
}

export interface CarCommand {
  type: "move" | "rotate" | "sensor"
  distance?: number
  direction?: number
  angle?: number
}

export interface SimulationState {
  isRunning: boolean
  speed: number
  carPosition: [number, number, number]
  carRotation: number
  sensorReading: number
  executionTime: number
}
