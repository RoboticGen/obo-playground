import { useEffect, useCallback, useRef } from 'react'
import { useSimulationStore, AnimationState } from '@/lib/simulation-store'

export function useCommandExecutor() {
  const executionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const {
    commandQueue,
    currentCommand,
    isRunning,
    isExecuting,
    executeNextCommand,
    setRunning
  } = useSimulationStore()

  // Start command execution loop when simulation is running
  useEffect(() => {
    if (isRunning && !isExecuting && commandQueue.length > 0) {
      executeNextCommand()
    }
  }, [isRunning, isExecuting, commandQueue.length, executeNextCommand])

  // Auto-execute next command when current one finishes
  useEffect(() => {
    if (!isExecuting && !currentCommand && commandQueue.length > 0 && isRunning) {
      const timeoutId = setTimeout(() => {
        executeNextCommand()
      }, 100) // Small delay between commands
      
      return () => clearTimeout(timeoutId)
    }
  }, [isExecuting, currentCommand, commandQueue.length, isRunning, executeNextCommand])

  // Stop simulation when all commands are executed
  useEffect(() => {
    if (isRunning && !isExecuting && !currentCommand && commandQueue.length === 0) {
      // All commands completed, stop simulation
      setTimeout(() => {
        setRunning(false)
      }, 500) // Small delay to let final animations complete
    }
  }, [isRunning, isExecuting, currentCommand, commandQueue.length, setRunning])

  const startExecution = useCallback(() => {
    if (commandQueue.length > 0) {
      setRunning(true)
    }
  }, [commandQueue.length, setRunning])

  const stopExecution = useCallback(() => {
    setRunning(false)
  }, [setRunning])

  const pauseExecution = useCallback(() => {
    // Pause is handled by the store's isPaused state
    useSimulationStore.getState().setPaused(true)
  }, [])

  const resumeExecution = useCallback(() => {
    useSimulationStore.getState().setPaused(false)
  }, [])

  return {
    startExecution,
    stopExecution,
    pauseExecution,
    resumeExecution,
    isExecuting,
    currentCommand,
    commandQueue
  }
}

// Python code to command parser with error handling
export function usePythonCodeParser() {
  const { parseAndExecuteCode, setExecutionError } = useSimulationStore()

  const executeCode = useCallback(async (code: string) => {
    try {
      setExecutionError(null)
      await parseAndExecuteCode(code)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setExecutionError(errorMessage)
      console.error('Code execution error:', error)
    }
  }, [parseAndExecuteCode, setExecutionError])

  const validatePythonSyntax = useCallback((code: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []
    const lines = code.split('\n')
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line || line.startsWith('#')) continue
      
      // Basic syntax validation
      if (line.includes('car.') && !line.match(/car\.(forward|backward|turn_left|turn_right|stop)\s*\(/)) {
        errors.push(`Line ${i + 1}: Unknown car method. Available methods: forward(), backward(), turn_left(), turn_right(), stop()`)
      }
      
      // Check for proper parentheses
      const openParens = (line.match(/\(/g) || []).length
      const closeParens = (line.match(/\)/g) || []).length
      if (openParens !== closeParens) {
        errors.push(`Line ${i + 1}: Mismatched parentheses`)
      }
      
      // Check for proper function calls
      if (line.includes('car.') && !line.includes('(')) {
        errors.push(`Line ${i + 1}: Missing parentheses for function call`)
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }, [])

  return {
    executeCode,
    validatePythonSyntax
  }
}

// Advanced command features
export function useAdvancedCommands() {
  const { addCommand, carPhysics, sensorData } = useSimulationStore()

  const moveToPosition = useCallback((x: number, z: number) => {
    const currentPos = carPhysics.position
    const deltaX = x - currentPos.x
    const deltaZ = z - currentPos.z
    const distance = Math.sqrt(deltaX * deltaX + deltaZ * deltaZ)
    const angle = Math.atan2(deltaX, -deltaZ) * (180 / Math.PI)
    
    // Calculate required turn
    const currentRotation = carPhysics.rotation.y * (180 / Math.PI)
    let turnAngle = angle - currentRotation
    
    // Normalize angle to -180 to 180
    while (turnAngle > 180) turnAngle -= 360
    while (turnAngle < -180) turnAngle += 360
    
    // Add turn command if needed
    if (Math.abs(turnAngle) > 5) {
      addCommand({
        type: turnAngle > 0 ? 'turn_right' : 'turn_left',
        value: Math.abs(turnAngle)
      })
    }
    
    // Add forward command
    addCommand({
      type: 'forward',
      value: distance
    })
  }, [addCommand, carPhysics])

  const followPath = useCallback((points: [number, number][]) => {
    points.forEach(([x, z]) => {
      moveToPosition(x, z)
    })
  }, [moveToPosition])

  const avoidObstacle = useCallback(() => {
    // Simple obstacle avoidance based on sensor data
    if (sensorData.front < 2) {
      if (sensorData.left > sensorData.right) {
        addCommand({ type: 'turn_left', value: 45 })
      } else {
        addCommand({ type: 'turn_right', value: 45 })
      }
      addCommand({ type: 'forward', value: 2 })
      if (sensorData.left > sensorData.right) {
        addCommand({ type: 'turn_right', value: 45 })
      } else {
        addCommand({ type: 'turn_left', value: 45 })
      }
    }
  }, [addCommand, sensorData])

  const createPattern = useCallback((pattern: 'square' | 'circle' | 'figure8') => {
    switch (pattern) {
      case 'square':
        for (let i = 0; i < 4; i++) {
          addCommand({ type: 'forward', value: 3 })
          addCommand({ type: 'turn_right', value: 90 })
        }
        break
      case 'circle':
        for (let i = 0; i < 36; i++) {
          addCommand({ type: 'forward', value: 0.5 })
          addCommand({ type: 'turn_right', value: 10 })
        }
        break
      case 'figure8':
        // First loop
        for (let i = 0; i < 18; i++) {
          addCommand({ type: 'forward', value: 0.3 })
          addCommand({ type: 'turn_right', value: 20 })
        }
        // Second loop (opposite direction)
        for (let i = 0; i < 18; i++) {
          addCommand({ type: 'forward', value: 0.3 })
          addCommand({ type: 'turn_left', value: 20 })
        }
        break
    }
  }, [addCommand])

  return {
    moveToPosition,
    followPath,
    avoidObstacle,
    createPattern
  }
}