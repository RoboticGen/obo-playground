"use client"

import { Suspense, useEffect, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, Grid } from "@react-three/drei"
import { Physics } from "@react-three/rapier"
import * as THREE from "three"
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
  const [useWebGPU, setUseWebGPU] = useState(false)
  
  // Check WebGPU support on mount
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
      console.log("WebGPU is supported!")
      setUseWebGPU(true)
    } else {
      console.log("WebGPU not supported, using WebGL")
      setUseWebGPU(false)
    }
  }, [])
  
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

  // Initialize Python bridge and set up animation loop
  useEffect(() => {
    // Set up the OboCarBridge
    oboCarBridge.setupGlobalAPI()
    
    // Set up animation loop that will drive the event system
    const animationLoop = () => {
      // Only process events if simulation is running
      if (isRunning) {
        // This animation loop will run regardless of Python code execution
        // allowing for responsive UI even during infinite loops
      }
      
      // Continue the animation loop
      requestAnimationFrame(animationLoop)
    }
    
    // Start animation loop
    const animationFrameId = requestAnimationFrame(animationLoop)
    
    // Cleanup function
    return () => {
      cancelAnimationFrame(animationFrameId)
      // Clear any active event loops on unmount
      if (useSimulationStore.getState().activeLoops.length > 0) {
        useSimulationStore.getState().clearAllEventLoops()
      }
    }
  }, [isRunning])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
          
            <div className="flex items-center gap-3">
              {/* Logo image - place logo.png in your public/ folder */}
              <img
                src="/logo.png"
                alt="Obo Logo"
                className="w-10 h-10 rounded shadow"
                style={{ objectFit: "contain", background: "#fff" }}
              />
              <div>
                <h1 className="text-2xl font-bold">Obo Playground</h1>
                <p className="text-sm text-muted-foreground">
                  Learn programming through car simulation
                </p>
              </div>
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
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {useWebGPU ? "WebGPU" : "WebGL"}
                  </span>
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
                    style={{ width: "100%", height: "100%", background: "#1a1a1a" }}
                    gl={useWebGPU ? {
                      // WebGPU configuration
                      powerPreference: "high-performance",
                    } : {
                      // WebGL configuration
                      antialias: true,
                      alpha: false,
                      stencil: false,
                      depth: true,
                      logarithmicDepthBuffer: true,
                      toneMapping: THREE.ACESFilmicToneMapping,
                      toneMappingExposure: 1.2,
                      powerPreference: "high-performance",
                      preserveDrawingBuffer: true
                    }}
                    dpr={[1, 2]}
                    performance={{ min: 0.5 }}
                  >
                    <color attach="background" args={["#1a1a1a"]} />
                    {useWebGPU && (
                      <primitive object={new THREE.Color("#1a1a1a")} attach="background" />
                    )}
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow 
                      shadow-mapSize={[2048, 2048]}
                      shadow-camera-far={50}
                      shadow-camera-left={-20}
                      shadow-camera-right={20}
                      shadow-camera-top={20}
                      shadow-camera-bottom={-20}
                    />
                    <hemisphereLight intensity={0.3} groundColor="#444444" />
                    
                    <Physics gravity={[0, -9.81, 0]}>
                      <OboCarScene key="obo-car-scene-stable" />
                    </Physics>
                    
                    <OrbitControls
                      enablePan
                      enableZoom
                      enableRotate
                      maxPolarAngle={Math.PI / 2}
                      minDistance={5}
                      maxDistance={50}
                      enableDamping
                      dampingFactor={0.05}
                    />
                    
                    {/* Simple visible grid */}
                    <gridHelper args={[50, 50, "#00aaff", "#666666"]} position={[0, 0, 0]} />
                    
                    <Environment preset="night" />
                  </Canvas>
                </Suspense>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
     
    </div>
  )
}
