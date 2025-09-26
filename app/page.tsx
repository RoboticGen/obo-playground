"use client"

import { Suspense, useEffect } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, Grid } from "@react-three/drei"
import { Physics } from "@react-three/rapier"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Zap, Play, Square, RotateCcw, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OboCarScene } from "@/components/enhanced-obo-car-scene"
import { CodeEditor } from "@/components/code-editor"
import { TerminalPanel } from "@/components/terminal-panel"
import { useSimulationStore } from "@/lib/simulation-store"
import { useCommandExecutor, usePythonCodeParser } from "@/hooks/use-command-executor"
import { oboCarBridge } from "@/lib/python-bridge"

export default function OboPlayground() {
  const {
    currentCode,
    setCurrentCode,
    isRunning,
    isPaused,
    resetSimulation,
    setDebugMode,
    debugMode,
    commandQueue,
    executionError
  } = useSimulationStore()

  const { startExecution, stopExecution, pauseExecution, resumeExecution } = useCommandExecutor()
  const { executeCode, validatePythonSyntax } = usePythonCodeParser()

  const handleExecuteCode = async () => {
    if (!currentCode.trim()) return
    
    const validation = validatePythonSyntax(currentCode)
    if (!validation.isValid) {
      console.error('Syntax errors:', validation.errors)
      return
    }

    await executeCode(currentCode)
    startExecution()
  }

  const handleStopExecution = () => {
    stopExecution()
    resetSimulation()
  }

  const handlePauseResume = () => {
    if (isPaused) resumeExecution()
    else pauseExecution()
  }

  const handleReset = () => resetSimulation()

  // Initialize Python bridge
  useEffect(() => {
    oboCarBridge.setupGlobalAPI()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Obo Playground</h1>
                <p className="text-sm text-muted-foreground">
                  Learn programming through car simulation
                </p>
              </div>
            </div>

            {/* Execution Controls */}
            <div className="flex items-center gap-2">
              <Button
                onClick={handleExecuteCode}
                disabled={isRunning || !currentCode.trim()}
                className="flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Execute
              </Button>
              
              <Button
                onClick={handlePauseResume}
                disabled={!isRunning}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {isPaused ? "Resume" : "Pause"}
              </Button>
              
              <Button
                onClick={handleStopExecution}
                disabled={!isRunning}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Square className="w-4 h-4" />
                Stop
              </Button>
              
              <Button
                onClick={handleReset}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>

              <Badge variant={isRunning ? "default" : "secondary"}>
                {isRunning ? "Running" : "Stopped"}
              </Badge>
              <Badge 
                variant={debugMode ? "default" : "secondary"}
                className="cursor-pointer"
                onClick={() => setDebugMode(!debugMode)}
              >
                Debug: {debugMode ? "ON" : "OFF"}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="container mx-auto p-4 h-[calc(100vh-130px)] min-h-[600px]">
        <div className="grid grid-cols-12 gap-4 h-full">
          {/* Left Panel - Code Editor */}
          <div className="col-span-4 flex flex-col h-full">
            <Card className="flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  Code Editor
                  <Badge variant="secondary" className="text-xs">Python</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-auto">
                <CodeEditor />
              </CardContent>
            </Card>
          </div>

          {/* Center Panel - 3D Simulation */}
          <div className="col-span-8 h-full">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  3D Simulation
                  {executionError && (
                    <Badge variant="destructive" className="ml-2">
                      Error
                    </Badge>
                  )}
                  {commandQueue.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      Commands: {commandQueue.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                <Suspense
                  fallback={
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-primary font-medium">Loading 3D Scene...</div>
                    </div>
                  }
                >
                  <Canvas
                    camera={{ position: [10, 8, 10], fov: 60 }}
                    shadows
                    style={{ width: "100%", height: "100%" }}
                  >
                    <ambientLight intensity={0.4} />
                    <directionalLight
                      position={[10, 20, 10]}
                      intensity={1}
                      castShadow
                    />
                    
                    <Physics debug={debugMode} gravity={[0, -9.81, 0]}>
                      <OboCarScene />
                    </Physics>
                    
                    <OrbitControls
                      enablePan
                      enableZoom
                      enableRotate
                      maxPolarAngle={Math.PI / 2}
                      minDistance={5}
                      maxDistance={50}
                    />
                    
                    <Grid args={[20, 20]} cellSize={1} sectionSize={5} />
                    <Environment preset="sunset" />
                  </Canvas>
                </Suspense>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Terminal Panel */}
      <TerminalPanel />
    </div>
  )
}
