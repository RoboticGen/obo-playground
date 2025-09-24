"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Settings, 
  Car, 
  Gauge,
  Target,
  Zap
} from "lucide-react"
import { useSimulationStore, AnimationState } from "@/lib/simulation-store"
import { useCommandExecutor, useAdvancedCommands } from "@/hooks/use-command-executor"

export function SimulationControls() {
  const {
    isRunning,
    isPaused,
    speed,
    debugMode,
    carAnimation,
    carPhysics,
    currentCommand,
    commandQueue,
    metrics,
    setSpeed,
    setDebugMode,
    resetSimulation,
    addObstacle,
    clearObstacles
  } = useSimulationStore()

  const { startExecution, stopExecution, pauseExecution, resumeExecution } = useCommandExecutor()
  const { moveToPosition, createPattern, avoidObstacle } = useAdvancedCommands()

  const handleSpeedChange = (value: number[]) => {
    setSpeed(value[0])
  }

  const handleAddObstacle = () => {
    const x = (Math.random() - 0.5) * 20
    const z = (Math.random() - 0.5) * 20
    addObstacle({
      position: { x, y: 0.5, z } as any,
      size: { x: 2, y: 1, z: 2 } as any,
      rotation: { x: 0, y: 0, z: 0 } as any,
      color: "#ff6b6b",
      type: "static"
    })
  }

  const getAnimationStateColor = (state: AnimationState) => {
    switch (state) {
      case AnimationState.IDLE:
        return "secondary"
      case AnimationState.MOVING_FORWARD:
        return "default"
      case AnimationState.MOVING_BACKWARD:
        return "outline"
      case AnimationState.TURNING_LEFT:
      case AnimationState.TURNING_RIGHT:
        return "secondary"
      case AnimationState.STOPPING:
        return "destructive"
      default:
        return "secondary"
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Simulation Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Execution Status */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Gauge className="w-4 h-4" />
            Status
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <Badge variant={isRunning ? "default" : "secondary"}>
              {isRunning ? "Running" : "Stopped"}
            </Badge>
            <Badge variant={getAnimationStateColor(carAnimation.currentState)}>
              {carAnimation.currentState.replace(/_/g, ' ')}
            </Badge>
          </div>
          {currentCommand && (
            <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
              Current: {currentCommand.type} ({currentCommand.value || 'default'})
            </div>
          )}
          {commandQueue.length > 0 && (
            <div className="text-xs text-muted-foreground">
              Queue: {commandQueue.length} commands
            </div>
          )}
        </div>

        <Separator />

        {/* Execution Controls */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Play className="w-4 h-4" />
            Control
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={isPaused ? resumeExecution : pauseExecution}
              disabled={!isRunning}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            <Button
              onClick={stopExecution}
              disabled={!isRunning}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Square className="w-3 h-3" />
              Stop
            </Button>
          </div>
          <Button
            onClick={resetSimulation}
            variant="outline"
            size="sm"
            className="w-full flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Simulation
          </Button>
        </div>

        <Separator />

        {/* Speed Control */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Speed: {speed.toFixed(1)}x
          </h4>
          <Slider
            value={[speed]}
            onValueChange={handleSpeedChange}
            min={0.1}
            max={5}
            step={0.1}
            className="w-full"
          />
        </div>

        <Separator />

        {/* Debug Settings */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Debug Settings</h4>
          <div className="flex items-center space-x-2">
            <Switch
              id="debug-mode"
              checked={debugMode}
              onCheckedChange={setDebugMode}
            />
            <Label htmlFor="debug-mode" className="text-sm">
              Debug Visualization
            </Label>
          </div>
        </div>

        <Separator />

        {/* Car Info */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Car className="w-4 h-4" />
            Car Status
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span>Position:</span>
              <span>
                ({carPhysics.position.x.toFixed(1)}, {carPhysics.position.z.toFixed(1)})
              </span>
            </div>
            <div className="flex justify-between">
              <span>Rotation:</span>
              <span>{(carPhysics.rotation.y * 180 / Math.PI).toFixed(1)}°</span>
            </div>
            <div className="flex justify-between">
              <span>Speed:</span>
              <span>{carPhysics.velocity.length().toFixed(1)} m/s</span>
            </div>
            <div className="flex justify-between">
              <span>Distance:</span>
              <span>{metrics.distanceTraveled.toFixed(1)} m</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Quick Commands */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Target className="w-4 h-4" />
            Quick Commands
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => createPattern('square')}
              variant="outline"
              size="sm"
              disabled={isRunning}
            >
              Square
            </Button>
            <Button
              onClick={() => createPattern('circle')}
              variant="outline"
              size="sm"
              disabled={isRunning}
            >
              Circle
            </Button>
            <Button
              onClick={() => createPattern('figure8')}
              variant="outline"
              size="sm"
              disabled={isRunning}
              className="col-span-2"
            >
              Figure 8
            </Button>
          </div>
        </div>

        <Separator />

        {/* Environment Controls */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Environment</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleAddObstacle}
              variant="outline"
              size="sm"
              disabled={isRunning}
            >
              Add Obstacle
            </Button>
            <Button
              onClick={clearObstacles}
              variant="outline"
              size="sm"
              disabled={isRunning}
            >
              Clear All
            </Button>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Performance</h4>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>Time:</span>
              <span>{(metrics.timeElapsed / 1000).toFixed(1)}s</span>
            </div>
            <div className="flex justify-between">
              <span>Commands:</span>
              <span>{metrics.commandsExecuted}</span>
            </div>
            <div className="flex justify-between">
              <span>Battery:</span>
              <span>{metrics.batteryLevel.toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}