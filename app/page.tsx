"use client"

import { Suspense, useEffect } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, Grid } from "@react-three/drei"
import { Physics } from "@react-three/rapier"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, Play } from "lucide-react"
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
    executionError,
    commandQueue,
    resetSimulation,
  } = useSimulationStore()

  const { startExecution } = useCommandExecutor()
  const { executeCode, validatePythonSyntax } = usePythonCodeParser()

  const handleExecuteCode = async () => {
    if (!currentCode.trim()) return
    const validation = validatePythonSyntax(currentCode)
    if (!validation.isValid) {
      console.error("Syntax errors:", validation.errors)
      return
    }

    await executeCode(currentCode)
    startExecution()
  }

  // Initialize Python bridge
  useEffect(() => {
    oboCarBridge.setupGlobalAPI()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
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
                    <span className="ml-2 text-red-500 text-sm">Error</span>
                  )}
                  {commandQueue.length > 0 && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      Commands: {commandQueue.length}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                <Suspense
                  fallback={
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-primary font-medium">
                        Loading 3D Scene...
                      </div>
                    </div>
                  }
                >
                  <Canvas
                    camera={{ position: [10, 8, 10], fov: 60 }}
                    shadows
                    style={{ width: "100%", height: "100%" }}
                  >
                    <ambientLight intensity={0.4} />
                    <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
                    
                    <Physics gravity={[0, -9.81, 0]}>
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
