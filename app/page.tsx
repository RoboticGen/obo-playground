"use client"

import { Suspense, useState, useEffect } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, Grid, Html } from "@react-three/drei"
import { Physics } from "@react-three/rapier"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Zap, BookOpen, Settings, Trophy, Play, Square, RotateCcw, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OboCarScene } from "@/components/enhanced-obo-car-scene"
import { CodeEditor } from "@/components/code-editor"
import { MetricsDashboard } from "@/components/metrics-dashboard"
import { SimulationControls } from "@/components/enhanced-simulation-controls"
import { ChallengePanel } from "@/components/challenge-panel"
import { SessionManager } from "@/components/session-manager"
import { TerminalPanel } from "@/components/terminal-panel"
import Link from "next/link"
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

  const handleLoadChallenge = (code: string) => {
    setCurrentCode(code)
  }

  const handleLoadCode = (code: string) => {
    setCurrentCode(code)
  }

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
    if (isPaused) {
      resumeExecution()
    } else {
      pauseExecution()
    }
  }

  const handleReset = () => {
    resetSimulation()
  }

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
                <h1 className="text-2xl font-bold text-balance">Obo Playground</h1>
                <p className="text-sm text-muted-foreground">Learn programming through car simulation</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Execution Controls */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleExecuteCode}
                  disabled={isRunning || !currentCode.trim()}
                  className="flex items-center gap-2"
                  variant="default"
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
                  {isPaused ? 'Resume' : 'Pause'}
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
              </div>
              
              <Link href="/python" passHref>
                <Button variant="outline" className="flex items-center gap-2">
                  🐍 Python Mode
                </Button>
              </Link>
              
              <div className="flex items-center gap-2">
                <Badge variant={isRunning ? "default" : "secondary"}>
                  {isRunning ? "Running" : "Stopped"}
                </Badge>
                <Badge variant="outline">Physics Enabled</Badge>
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
        </div>
      </header>

      {/* Main Layout */}
      <div className="container mx-auto p-4 h-[calc(100vh-130px)] mb-[10px] min-h-[600px]">
        <div className="grid grid-cols-12 gap-2 md:gap-4 h-full">
          {/* Left Panel - Code Editor & Controls */}
          <div className="col-span-3 flex flex-col gap-4 h-full">
            <Card className="flex-1">
              <CardHeader className="pb-2 sticky top-0 bg-card z-10 h-[56px]">
                <CardTitle className="text-lg flex items-center gap-2">
                  Code Editor
                  <Badge variant="secondary" className="text-xs">
                    Python
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-auto min-h-[400px]">
                <CodeEditor />
              </CardContent>
            </Card>

            {/* Tabbed Controls */}
            <Tabs defaultValue="controls" className="flex-shrink-0">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="controls" className="gap-1">
                  <Settings className="w-4 h-4" />
                  Controls
                </TabsTrigger>
                <TabsTrigger value="challenges" className="gap-1">
                  <Trophy className="w-4 h-4" />
                  Challenges
                </TabsTrigger>
                <TabsTrigger value="sessions" className="gap-1">
                  <BookOpen className="w-4 h-4" />
                  Sessions
                </TabsTrigger>
              </TabsList>

              <TabsContent value="controls" className="mt-4">
                <SimulationControls />
              </TabsContent>

              <TabsContent value="challenges" className="mt-4">
                <ChallengePanel onLoadChallenge={handleLoadChallenge} />
              </TabsContent>

              <TabsContent value="sessions" className="mt-4">
                <SessionManager currentCode={currentCode} onLoadCode={handleLoadCode} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Center Panel - 3D Viewport */}
          <div className="col-span-7 h-full">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-2 flex-shrink-0 h-[56px]">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  3D Simulation
                  <div className="min-h-[20px] min-w-[100px] flex items-center">
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
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 min-h-0">
                <div className="w-full h-full bg-gradient-to-b from-sky-400 to-sky-200 rounded-lg overflow-hidden relative flex min-h-[450px]">
                  <div className="absolute top-2 left-2 right-2 z-10 min-h-[40px] flex items-center justify-center">
                    {executionError && (
                      <div className="bg-red-500 text-white p-2 rounded text-sm w-full">
                        Error: {executionError}
                      </div>
                    )}
                  </div>
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
                      style={{ 
                        background: 'linear-gradient(to bottom, #87ceeb, #98fb98)',
                        height: '100%', 
                        minHeight: '450px',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0
                      }}
                    >
                      <ambientLight intensity={0.4} />
                      <directionalLight
                        position={[10, 20, 10]}
                        intensity={1}
                        castShadow
                        shadow-mapSize={[2048, 2048]}
                        shadow-camera-near={0.1}
                        shadow-camera-far={50}
                        shadow-camera-left={-20}
                        shadow-camera-right={20}
                        shadow-camera-top={20}
                        shadow-camera-bottom={-20}
                      />
                      
                      <Physics debug={debugMode} gravity={[0, -9.81, 0]}>
                        <OboCarScene />
                      </Physics>
                      
                      <OrbitControls
                        enablePan={true}
                        enableZoom={true}
                        enableRotate={true}
                        maxPolarAngle={Math.PI / 2}
                        minDistance={5}
                        maxDistance={50}
                      />
                      
                      <Grid
                        position={[0, 0, 0]}
                        args={[20, 20]}
                        cellSize={1}
                        cellThickness={0.5}
                        cellColor="#666666"
                        sectionSize={5}
                        sectionThickness={1}
                        sectionColor="#999999"
                      />
                      
                      <Environment preset="sunset" />
                    </Canvas>
                  </Suspense>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Metrics Dashboard */}
          <div className="col-span-2 h-full">
            <Card className="h-full overflow-auto">
              <CardHeader className="pb-2 sticky top-0 bg-card z-10 h-[56px]">
                <CardTitle className="text-lg flex items-center gap-2">
                  Metrics Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 min-h-[400px]">
                <MetricsDashboard />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Terminal Panel for Compiler Output */}
      <TerminalPanel />
    </div>
  )
}
