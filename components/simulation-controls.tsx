"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Play, Pause, Square, RotateCcw, Settings, Zap, Eye, EyeOff } from "lucide-react"
import { useSimulationStore } from "@/lib/car-control-system"
import { useState } from "react"

export function SimulationControls() {
  const { isRunning, isPaused, speed, resetSimulation, togglePause, setSpeed } = useSimulationStore()
  const [showDebugInfo, setShowDebugInfo] = useState(false)
  const [physicsEnabled, setPhysicsEnabled] = useState(true)

  const handlePlayPause = () => {
    togglePause()
    console.log("[v0] Simulation", isPaused ? "resumed" : "paused")
  }

  const handleStop = () => {
    resetSimulation()
    console.log("[v0] Simulation stopped and reset")
  }

  const handleReset = () => {
    resetSimulation()
    console.log("[v0] Simulation reset to initial state")
  }

  const handleSpeedChange = (newSpeed: number[]) => {
    setSpeed(newSpeed[0])
    console.log("[v0] Simulation speed changed to", newSpeed[0])
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Simulation Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Playback Controls */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Button onClick={handlePlayPause} variant={isPaused ? "default" : "secondary"} size="sm" className="flex-1">
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              {isPaused ? "Resume" : "Pause"}
            </Button>
            <Button onClick={handleStop} variant="outline" size="sm">
              <Square className="w-4 h-4" />
            </Button>
            <Button onClick={handleReset} variant="outline" size="sm">
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="text-xs bg-transparent">
              Save State
            </Button>
            <Button variant="outline" size="sm" className="text-xs bg-transparent">
              Load State
            </Button>
          </div>
        </div>

        {/* Speed Control */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Simulation Speed</label>
            <span className="text-sm text-muted-foreground">{speed.toFixed(1)}x</span>
          </div>
          <Slider value={[speed]} onValueChange={handleSpeedChange} max={5} min={0.1} step={0.1} className="w-full" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0.1x</span>
            <span>1x</span>
            <span>5x</span>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <label className="text-sm font-medium">Physics Engine</label>
            </div>
            <Switch checked={physicsEnabled} onCheckedChange={setPhysicsEnabled} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {showDebugInfo ? (
                <Eye className="w-4 h-4 text-accent" />
              ) : (
                <EyeOff className="w-4 h-4 text-muted-foreground" />
              )}
              <label className="text-sm font-medium">Debug Info</label>
            </div>
            <Switch checked={showDebugInfo} onCheckedChange={setShowDebugInfo} />
          </div>
        </div>

        {/* Status Information */}
        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className={isRunning ? "text-green-600" : "text-muted-foreground"}>
                {isRunning ? (isPaused ? "Paused" : "Running") : "Stopped"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Physics:</span>
              <span className={physicsEnabled ? "text-green-600" : "text-muted-foreground"}>
                {physicsEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Debug:</span>
              <span className={showDebugInfo ? "text-accent" : "text-muted-foreground"}>
                {showDebugInfo ? "Visible" : "Hidden"}
              </span>
            </div>
          </div>
        </div>

        {/* Environment Presets */}
        <div className="space-y-2 pt-2 border-t">
          <label className="text-sm font-medium">Environment</label>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="text-xs bg-transparent">
              Basic Track
            </Button>
            <Button variant="outline" size="sm" className="text-xs bg-transparent">
              Obstacle Course
            </Button>
            <Button variant="outline" size="sm" className="text-xs bg-transparent">
              Maze Challenge
            </Button>
            <Button variant="outline" size="sm" className="text-xs bg-transparent">
              Free Roam
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
