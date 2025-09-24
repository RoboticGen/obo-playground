"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"
import { Activity, Gauge, Navigation, Zap, Target, Clock, TrendingUp } from "lucide-react"
import { useSimulationStore } from "@/lib/car-control-system"

interface MetricHistory {
  time: number
  velocity: number
  battery: number
  frontSensor: number
  leftSensor: number
  rightSensor: number
  backSensor: number
  distanceTraveled: number
}

export function MetricsDashboard() {
  const { car, isRunning, commands } = useSimulationStore()
  const [metricHistory, setMetricHistory] = useState<MetricHistory[]>([])
  const [startTime, setStartTime] = useState<number>(Date.now())

  // Update metrics history
  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        const currentTime = (Date.now() - startTime) / 1000

        setMetricHistory((prev) => {
          const newEntry: MetricHistory = {
            time: currentTime,
            velocity: car.velocity,
            battery: car.battery,
            frontSensor: car.sensorReadings.front,
            leftSensor: car.sensorReadings.left,
            rightSensor: car.sensorReadings.right,
            backSensor: car.sensorReadings.back,
            distanceTraveled: car.distanceTraveled,
          }

          // Keep only last 50 entries for performance
          const updated = [...prev, newEntry].slice(-50)
          return updated
        })
      }, 500)

      return () => clearInterval(interval)
    }
  }, [isRunning, car, startTime])

  // Reset metrics when simulation resets
  useEffect(() => {
    if (!isRunning && car.executionTime === 0) {
      setMetricHistory([])
      setStartTime(Date.now())
    }
  }, [isRunning, car.executionTime])

  const executedCommands = commands.filter((cmd) => cmd.executed).length
  const totalCommands = commands.length
  const commandProgress = totalCommands > 0 ? (executedCommands / totalCommands) * 100 : 0

  const getSensorStatus = (reading: number) => {
    if (reading < 2) return { status: "danger", color: "text-red-500", bg: "bg-red-100" }
    if (reading < 4) return { status: "warning", color: "text-yellow-600", bg: "bg-yellow-100" }
    return { status: "safe", color: "text-green-600", bg: "bg-green-100" }
  }

  const frontSensorStatus = getSensorStatus(car.sensorReadings.front)
  const avgSensorReading =
    (car.sensorReadings.front + car.sensorReadings.left + car.sensorReadings.right + car.sensorReadings.back) / 4

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Real-time Status Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Gauge className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Position</span>
          </div>
          <div className="space-y-1">
            <div className="text-lg font-bold text-primary">
              ({car.position[0].toFixed(1)}, {car.position[2].toFixed(1)})
            </div>
            <div className="text-xs text-muted-foreground">Rotation: {car.rotation.toFixed(0)}°</div>
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Navigation className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium">Distance</span>
          </div>
          <div className="space-y-1">
            <div className="text-lg font-bold text-accent">{car.distanceTraveled.toFixed(1)}m</div>
            <div className="text-xs text-muted-foreground">Total traveled</div>
          </div>
        </Card>
      </div>

      {/* Battery & Performance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Battery & Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Battery Level</span>
              <span className="text-sm text-muted-foreground">{car.battery.toFixed(0)}%</span>
            </div>
            <Progress value={car.battery} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Command Progress</span>
              <span className="text-sm text-muted-foreground">
                {executedCommands}/{totalCommands}
              </span>
            </div>
            <Progress value={commandProgress} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="text-center">
              <div className="text-lg font-bold text-chart-4">{car.collisionCount}</div>
              <div className="text-xs text-muted-foreground">Collisions</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-chart-5">{car.executionTime.toFixed(1)}s</div>
              <div className="text-xs text-muted-foreground">Runtime</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sensor Readings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="w-4 h-4" />
            Sensor Readings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className={`p-2 rounded-lg ${frontSensorStatus.bg}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Front</span>
                <div className={`text-sm font-bold ${frontSensorStatus.color}`}>
                  {car.sensorReadings.front.toFixed(1)}m
                </div>
              </div>
            </div>

            <div className={`p-2 rounded-lg ${getSensorStatus(car.sensorReadings.back).bg}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Back</span>
                <div className={`text-sm font-bold ${getSensorStatus(car.sensorReadings.back).color}`}>
                  {car.sensorReadings.back.toFixed(1)}m
                </div>
              </div>
            </div>

            <div className={`p-2 rounded-lg ${getSensorStatus(car.sensorReadings.left).bg}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Left</span>
                <div className={`text-sm font-bold ${getSensorStatus(car.sensorReadings.left).color}`}>
                  {car.sensorReadings.left.toFixed(1)}m
                </div>
              </div>
            </div>

            <div className={`p-2 rounded-lg ${getSensorStatus(car.sensorReadings.right).bg}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Right</span>
                <div className={`text-sm font-bold ${getSensorStatus(car.sensorReadings.right).color}`}>
                  {car.sensorReadings.right.toFixed(1)}m
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Average Distance</span>
              <span className="text-xs text-muted-foreground">{avgSensorReading.toFixed(1)}m</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Chart */}
      <Card className="flex-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Performance History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 h-[calc(100%-60px)]">
          {metricHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metricHistory} margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="battery"
                  stroke="hsl(var(--chart-3))"
                  fill="hsl(var(--chart-3))"
                  fillOpacity={0.3}
                  strokeWidth={2}
                  name="Battery %"
                />
                <Area
                  type="monotone"
                  dataKey="frontSensor"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                  strokeWidth={1}
                  name="Front Sensor (m)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Run code to see performance data</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-2">
        <Badge variant={isRunning ? "default" : "secondary"}>{isRunning ? "Running" : "Stopped"}</Badge>
        <Badge variant={car.battery > 20 ? "secondary" : "destructive"}>
          Battery {car.battery > 20 ? "OK" : "Low"}
        </Badge>
        <Badge variant={car.sensorReadings.front > 2 ? "secondary" : "destructive"}>
          {car.sensorReadings.front > 2 ? "Path Clear" : "Obstacle"}
        </Badge>
        <Badge variant="outline">
          {car.collisionCount === 0 ? "No Collisions" : `${car.collisionCount} Collisions`}
        </Badge>
      </div>

      {/* Command History */}
      {commands.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Recent Commands
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-24 overflow-y-auto">
              {commands.slice(-5).map((command) => (
                <div key={command.id} className="flex items-center justify-between text-xs">
                  <span className="font-mono">
                    {command.type}({JSON.stringify(command.params).slice(1, -1)})
                  </span>
                  <Badge variant={command.executed ? "secondary" : "outline"} className="text-xs">
                    {command.executed ? "Done" : "Pending"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
