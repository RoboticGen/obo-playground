/**
 * Obo Car Simulator Component
 * 
 * A React component that integrates the Python obocar library
 * with your Next.js application using Pyodide.
 */

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { PyodideCarController } from '@/lib/pyodide-car-controller';
import { useSimulationStore } from '@/lib/car-control-system';
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Grid, Html } from "@react-three/drei";
import { Physics, RigidBody } from "@react-three/rapier";
import { OboCarScene } from '@/components/obo-car-scene';

// Define TypeScript interface for PyodideCarController
interface ICarController {
  getStatus: () => Promise<any>;
  getAllSensors: () => Promise<any>;
  moveForward: (distance: number) => Promise<void>;
  moveBackward: (distance: number) => Promise<void>;
  turnLeft: (degrees: number) => Promise<void>;
  turnRight: (degrees: number) => Promise<void>;
  reset: () => Promise<void>;
  runBasicSimulation: () => Promise<void>;
  executeCode: (code: string) => Promise<void>;
}

// Define TypeScript interface for our custom oboCarAPI implementation
interface OboCarAPIBridge {
  move: (distance: number) => boolean;
  getPosition: () => [number, number, number];
  getRotation: () => number;
  updateState: (x: number, y: number, angle: number) => boolean;
  reset: () => boolean;
  rotate: (angle: number) => boolean;
  moveDirect?: (x: number, z: number) => boolean;
}

export function OboCarSimulator() {
  const [controller, setController] = useState<ICarController | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const carRef = React.useRef<any>(null); // Reference to the 3D car object
  const [carStatus, setCarStatus] = useState<any>(null);
  const [sensorData, setSensorData] = useState<Record<string, number>>({});
  const [customCode, setCustomCode] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  // Auto-stabilization effect to prevent jumping
  useEffect(() => {
    const stabilizeCar = () => {
      if (carRef.current) {
        // Gradually reduce any residual velocity
        const body = carRef.current;
        const linVel = body.linvel();
        const angVel = body.angvel();
        
        // If velocities are very small, just stop completely
        if (Math.abs(linVel.x) < 0.01 && Math.abs(linVel.z) < 0.01 && Math.abs(linVel.y) < 0.1) {
          body.setLinvel({ x: 0, y: 0, z: 0 });
        }
        
        if (Math.abs(angVel.y) < 0.01) {
          body.setAngvel({ x: 0, y: 0, z: 0 });
        }
      }
    };

    const stabilizationInterval = setInterval(stabilizeCar, 50); // More frequent stabilization
    return () => clearInterval(stabilizationInterval);
  }, []);

  // Make sure simulation is always running and car is properly positioned
  useEffect(() => {
    // Get the current state
    const simState = useSimulationStore.getState();
    
    // Only initialize the simulation on first load
    if (!simState.isRunning) {
      console.log('Initializing simulation for the first time');
      
      // DON'T reset the simulation - only set the running state
      // This prevents losing position when the component re-renders
      
      // Start the simulation
      useSimulationStore.getState().setIsRunning(true);
      
      // Set initial car position only on first load
      console.log('Setting initial car position on first load');
      useSimulationStore.getState().updateCarPosition([0, 1, 0]);
      useSimulationStore.getState().updateCarRotation(0);
    }
    
    // Setup enhanced debugging
    const debugInterval = setInterval(() => {
      const state = useSimulationStore.getState();
      console.log('[v0] 🔍 DEBUG - Current 3D State:', {
        position: state.car?.position || 'Not available',
        rotation: state.car?.rotation || 'Not available',
        isRunning: state.isRunning,
        time: new Date().toISOString()
      });
    }, 5000); // Every 5 seconds to avoid console spam
    
    // Make sure it stays running
    const interval = setInterval(() => {
      if (!useSimulationStore.getState().isRunning) {
        useSimulationStore.getState().setIsRunning(true);
      }
    }, 1000);
    
    // Log initial state
    console.log('[v0] 🚀 Simulation initialized with car at position:', 
      useSimulationStore.getState().car.position, 
      'rotation:', useSimulationStore.getState().car.rotation);
    
    return () => {
      clearInterval(interval);
      clearInterval(debugInterval);
    };
  }, []);

  // Initialize Pyodide and the car controller
  useEffect(() => {
    const initController = async () => {
      setLoading(true);
      try {
        const carController = new PyodideCarController();
        await carController.initialize();
        setController(carController);
        setIsInitialized(true);
        
        // Create global bridge to simulation store for Python code to access
        if (typeof window !== 'undefined') {
          // Define our bridge interface with stabilized movement
          const bridge: OboCarAPIBridge = {
            move: (distance: number) => {
              console.log(`[v1] 🚗 JS Bridge: Moving car forward ${distance} units`);
              
              // Get the current state
              const { car } = useSimulationStore.getState();
              const currentRotation = car.rotation;
              
              // Convert the angle to radians correctly
              const rotationRad = (currentRotation * Math.PI) / 180;
              
              // Calculate the new position using proper trigonometry
              const newX = car.position[0] + distance * Math.sin(rotationRad);
              const newZ = car.position[2] - distance * Math.cos(rotationRad);
              
              console.log(`[v1] 🧮 Move calculation: rotation=${currentRotation}° (${rotationRad.toFixed(2)} rad), from=[${car.position[0]}, ${car.position[2]}], to=[${newX}, ${newZ}]`);
              
              // Ensure simulation is running
              if (!useSimulationStore.getState().isRunning) {
                useSimulationStore.getState().setIsRunning(true);
              }
              
              // STABILIZED MOVEMENT: Use smaller, controlled impulses
              const impulseStrength = Math.min(Math.abs(distance), 2) * Math.sign(distance); // Limit impulse strength
              const impulse = {
                x: Math.sin(rotationRad) * impulseStrength * 0.3, // Reduced force
                y: 0, 
                z: -Math.cos(rotationRad) * impulseStrength * 0.3
              };
              
              // Apply stabilized impulse
              if (carRef.current) {
                // First stop any existing movement
                carRef.current.setLinvel({ x: 0, y: 0, z: 0 });
                carRef.current.setAngvel({ x: 0, y: 0, z: 0 });
                
                // Then apply controlled impulse
                carRef.current.applyImpulse(impulse);
              }
              
              // Also update store for immediate visual feedback
              useSimulationStore.getState().updateCarPosition([newX, car.position[1], newZ]);
              
              console.log(`[v1] ✅ Applied stabilized movement impulse:`, impulse);
              return true;
            },
            
            getPosition: () => {
              const { car } = useSimulationStore.getState();
              console.log(`[v0] 🔍 Getting car position from 3D: [${car.position[0]}, ${car.position[1]}, ${car.position[2]}]`);
              console.log(`[v0] 🔍 Converting to Python format: [${car.position[0]}, ${car.position[2]}]`);
              
              // Return the full position - Python will extract what it needs
              return car.position;
            },
            
            getRotation: () => {
              const { car } = useSimulationStore.getState();
              console.log(`[v0] 🔄 Getting car rotation: ${car.rotation}°`);
              return car.rotation;
            },
            
            updateState: (x: number, y: number, angle: number) => {
              console.log(`[v2] 🔄 JS Bridge: Updating car state to pos=[${x}, ${y}], angle=${angle}°`);
              
              // Ensure the simulation is running
              if (!useSimulationStore.getState().isRunning) {
                useSimulationStore.getState().setIsRunning(true);
              }
              
              // STOP ALL MOVEMENT FIRST - CRITICAL FOR STABILITY
              if (carRef.current) {
                carRef.current.setLinvel({ x: 0, y: 0, z: 0 });
                carRef.current.setAngvel({ x: 0, y: 0, z: 0 });
              }
              
              // Update position and rotation in store
              useSimulationStore.getState().updateCarPosition([x, 1, y]);
              useSimulationStore.getState().updateCarRotation(angle);
              
              // TELEPORT the car to exact position (no physics movement)
              if (carRef.current) {
                carRef.current.setTranslation({ x: x, y: 1, z: y });
                carRef.current.setRotation({ 
                  x: 0, 
                  y: -angle * (Math.PI / 180), // Convert to radians with proper sign
                  z: 0, 
                  w: 1 
                });
              }
              
              console.log(`[v2] ✅ Car state stabilized and teleported to exact position`);
              
              // Verify the update
              setTimeout(() => {
                const currentState = useSimulationStore.getState().car;
                console.log(`[v2] ✅ Verified car state: pos=[${currentState.position[0]}, ${currentState.position[1]}, ${currentState.position[2]}], rotation=${currentState.rotation}°`);
              }, 10);
              
              return true;
            },
            
            reset: () => {
              console.log(`[v0] 🔄 JS Bridge: Resetting car position`);
              
              // Stop all movement first
              if (carRef.current) {
                carRef.current.setLinvel({ x: 0, y: 0, z: 0 });
                carRef.current.setAngvel({ x: 0, y: 0, z: 0 });
                carRef.current.setTranslation({ x: 0, y: 1, z: 0 });
                carRef.current.setRotation({ x: 0, y: 0, z: 0, w: 1 });
              }
              
              // Reset the simulation state
              useSimulationStore.getState().resetSimulation();
              
              // Immediately restart it to make sure updates are visible
              setTimeout(() => {
                useSimulationStore.getState().setIsRunning(true);
                console.log(`[v0] ✅ Simulation restarted after reset`);
              }, 100);
              return true;
            },
            
            // Enhanced rotation with stabilization
            rotate: (angle: number) => {
              const { car } = useSimulationStore.getState();
              const currentRotation = car.rotation;
              
              // Apply rotation directly
              const newRotation = (currentRotation - angle) % 360;
              const normalizedRotation = newRotation < 0 ? newRotation + 360 : newRotation;
              
              console.log(`[v1] 🔄 Rotating car from ${currentRotation}° to ${normalizedRotation}°`);
              
              // Stop any rotational movement first
              if (carRef.current) {
                carRef.current.setAngvel({ x: 0, y: 0, z: 0 });
              }
              
              // Ensure the simulation is running
              if (!useSimulationStore.getState().isRunning) {
                useSimulationStore.getState().setIsRunning(true);
              }
              
              // Update car rotation - simple and direct
              useSimulationStore.getState().updateCarRotation(normalizedRotation);
              
              // Also update physics body rotation
              if (carRef.current) {
                carRef.current.setRotation({ 
                  x: 0, 
                  y: -normalizedRotation * (Math.PI / 180), 
                  z: 0, 
                  w: 1 
                });
              }
              
              return true;
            },

            // Direct teleportation movement for precise control
            moveDirect: (x: number, z: number) => {
              console.log(`[v3] 🎯 Direct teleportation to [${x}, ${z}]`);
              
              // Ensure simulation is running
              if (!useSimulationStore.getState().isRunning) {
                useSimulationStore.getState().setIsRunning(true);
              }
              
              // Stop all movement first
              if (carRef.current) {
                carRef.current.setLinvel({ x: 0, y: 0, z: 0 });
                carRef.current.setAngvel({ x: 0, y: 0, z: 0 });
                
                // Teleport to exact position
                carRef.current.setTranslation({ 
                  x: x, 
                  y: 1, // Keep consistent height
                  z: z 
                });
              }
              
              // Also update the store
              useSimulationStore.getState().updateCarPosition([x, 1, z]);
              console.log(`[v3] ✅ Car teleported to [${x}, 1, ${z}]`);
              return true;
            }
          };
          
          // Assign to window.oboCarAPI for Python to access
          (window as any).oboCarAPI = bridge;
          
          // Set the simulation to running so that 3D car updates are applied
          useSimulationStore.getState().setIsRunning(true);
          console.log(`[v0] ✅ Created stabilized oboCarAPI bridge for Python`);
        }
        
        await updateCarStatus(carController);
      } catch (error: unknown) {
        console.error('Failed to initialize car controller:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        setOutput(`Error: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    initController();
  }, []);

  // New debug function to refresh the debug state
  const refreshDebugState = () => {
    // Force the simulation to update
    useSimulationStore.getState().setIsRunning(true);
    
    // Stop any car movement
    if (carRef.current) {
      carRef.current.setLinvel({ x: 0, y: 0, z: 0 });
      carRef.current.setAngvel({ x: 0, y: 0, z: 0 });
    }
    
    // Log the current state
    const currentState = useSimulationStore.getState().car;
    console.log(`[v2] 🔍 DEBUG - Refreshed car state: pos=[${currentState.position[0]}, ${currentState.position[1]}, ${currentState.position[2]}], rotation=${currentState.rotation}°`);
    
    // Update car status from controller
    updateCarStatus();
  };

  // Function to immediately stop all car movement
  const stopCarMovement = () => {
    if (carRef.current) {
      carRef.current.setLinvel({ x: 0, y: 0, z: 0 });
      carRef.current.setAngvel({ x: 0, y: 0, z: 0 });
      console.log('🛑 Car movement immediately stopped');
    }
  };
  
  const updateCarStatus = async (ctrl = controller) => {
    if (!ctrl || !isInitialized) return;
    
    try {
      const status = await ctrl.getStatus();
      const sensors = await ctrl.getAllSensors();
      setCarStatus(status);
      setSensorData(sensors);
      
      // Make sure the simulation is running for visualization updates
      if (!useSimulationStore.getState().isRunning) {
        useSimulationStore.getState().setIsRunning(true);
      }
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Failed to update status:', errorMessage);
    }
  };

  const handleMove = async (action: 'forward' | 'backward' | 'left' | 'right' | 'reset', value = 1) => {
    if (!controller) return;
    
    setLoading(true);
    try {
      // Stop movement before any new action
      stopCarMovement();
      
      switch (action) {
        case 'forward':
          await controller.moveForward(value);
          break;
        case 'backward':
          await controller.moveBackward(value);
          break;
        case 'left':
          await controller.turnLeft(value);
          break;
        case 'right':
          await controller.turnRight(value);
          break;
        case 'reset':
          await controller.reset();
          break;
      }
      await updateCarStatus();
    } catch (error: unknown) {
      console.error('Move failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setOutput(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const runBasicSimulation = async () => {
    if (!controller) return;
    
    setLoading(true);
    setOutput('Running basic simulation...\n');
    
    try {
      // Stop any existing movement before simulation
      stopCarMovement();
      
      await controller.runBasicSimulation();
      await updateCarStatus();
      setOutput(prev => prev + 'Basic simulation completed!\n');
    } catch (error: unknown) {
      console.error('Simulation failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setOutput(prev => prev + `Error: ${errorMessage}\n`);
    } finally {
      setLoading(false);
    }
  };

  const executeCustomCode = async () => {
    if (!controller || !customCode.trim()) return;
    
    setLoading(true);
    setOutput('Executing custom code...\n');
    
    try {
      // Stop any existing movement before code execution
      stopCarMovement();
      
      await controller.executeCode(customCode);
      await updateCarStatus();
      setOutput(prev => prev + 'Custom code executed successfully!\n');
    } catch (error: unknown) {
      console.error('Code execution failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setOutput(prev => prev + `Error: ${errorMessage}\n`);
    } finally {
      setLoading(false);
    }
  };

  const defaultCode = `# Import the Obo Car library
from obocar import obocar

# Create a car instance
car = obocar()

# Example of stable movement
car.forward(2)    # Move forward 2 units
car.wait(0.5)     # Wait for 0.5 seconds
car.right(90)     # Turn right 90 degrees
car.forward(1)    # Move forward 1 unit

# Get sensor readings:
# front_distance = car.sensor('front')
# left_distance = car.sensor('left')
# right_distance = car.sensor('right')

# Check car status:
# battery = car.battery()
# position = car.position()
# distance = car.distance()

print("✅ Ready to write your code and press 'Execute Code'")`;

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Initializing Pyodide and Obo Car library...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a moment on first load</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🚗 Obo Car Simulator
            <Badge variant="secondary">Pyodide Powered</Badge>
          </CardTitle>
          <CardDescription>
            Control a virtual car using Python code in your browser
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* 3D Visualization */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle>3D Simulation</CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[400px]">
              <div className="w-full h-full rounded-lg overflow-hidden bg-gradient-to-b from-sky-200 to-sky-100">
                <Canvas camera={{ position: [10, 10, 10], fov: 50 }} shadows>
                  <Suspense
                    fallback={
                      <Html center>
                        <div className="text-primary font-medium">Loading 3D Environment...</div>
                      </Html>
                    }
                  >
                    <Environment preset="sunset" />
                    <ambientLight intensity={0.4} />
                    <directionalLight position={[10, 10, 5]} intensity={1} castShadow shadow-mapSize={[2048, 2048]} />

                    <Physics gravity={[0, -9.81, 0]}>
                      <OboCarScene ref={carRef} />
                      <Grid
                        args={[20, 20]}
                        position={[0, -0.01, 0]}
                        cellSize={1}
                        cellThickness={0.5}
                        cellColor="#6366f1"
                        sectionSize={5}
                        sectionThickness={1}
                        sectionColor="#4f46e5"
                      />
                    </Physics>

                    <OrbitControls
                      enablePan={true}
                      enableZoom={true}
                      enableRotate={true}
                      maxPolarAngle={Math.PI / 2}
                      minDistance={5}
                      maxDistance={50}
                    />
                  </Suspense>
                </Canvas>
              </div>
            </CardContent>
          </Card>

          {/* Car Status Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium">Position</div>
                <div className="text-2xl font-bold">
                  {carStatus ? `(${carStatus.position[0]}, ${carStatus.position[1]})` : '(0, 0)'}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium">Heading</div>
                <div className="text-2xl font-bold">
                  {carStatus ? `${carStatus.heading}°` : '0°'}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium">Battery</div>
                <div className="text-2xl font-bold text-green-600">
                  {carStatus ? `${carStatus.battery}%` : '100%'}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium">Distance</div>
                <div className="text-2xl font-bold">
                  {carStatus ? `${carStatus.distance}m` : '0m'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sensor Readings */}
          <Card>
            <CardHeader>
              <CardTitle>Sensor Readings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['front', 'back', 'left', 'right'].map(direction => (
                  <div key={direction} className="text-center">
                    <div className="text-sm font-medium capitalize">{direction}</div>
                    <div className="text-xl font-bold">
                      {sensorData[direction] ? `${sensorData[direction].toFixed(1)}m` : '-.--m'}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Manual Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Manual Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                <div></div>
                <Button 
                  onClick={() => handleMove('forward', 1)}
                  disabled={loading}
                  className="aspect-square"
                >
                  ↑
                </Button>
                <div></div>
                
                <Button 
                  onClick={() => handleMove('left', 45)}
                  disabled={loading}
                  className="aspect-square"
                >
                  ←
                </Button>
                <Button 
                  onClick={() => handleMove('reset')}
                  disabled={loading}
                  variant="outline"
                  className="aspect-square"
                >
                  ⟲
                </Button>
                <Button 
                  onClick={() => handleMove('right', 45)}
                  disabled={loading}
                  className="aspect-square"
                >
                  →
                </Button>
                
                <div></div>
                <Button 
                  onClick={() => handleMove('backward', 1)}
                  disabled={loading}
                  className="aspect-square"
                >
                  ↓
                </Button>
                <div></div>
              </div>
              
              <div className="flex gap-2 mt-4 justify-center">
                <Button 
                  onClick={runBasicSimulation}
                  disabled={loading}
                  size="lg"
                >
                  Run Basic Simulation
                </Button>
                <Button 
                  onClick={stopCarMovement}
                  variant="outline"
                  size="lg"
                >
                  Stop Movement
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Custom Code Editor */}
          <Card>
            <CardHeader>
              <CardTitle>Custom Python Code</CardTitle>
              <CardDescription>
                Write your own Python code using the car object
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                placeholder="Write your Python code here... (Press 'Execute Code' to run)"
                className="font-mono text-sm min-h-[300px]"
              />
              <div className="flex gap-2">
                <Button 
                  onClick={executeCustomCode}
                  disabled={loading || !customCode.trim()}
                >
                  Execute Code
                </Button>
                <Button 
                  onClick={() => setCustomCode(defaultCode)}
                  variant="outline"
                >
                  Load Template
                </Button>
                <Button 
                  onClick={() => setCustomCode('')}
                  variant="outline"
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Output Console */}
          {output && (
            <Card>
              <CardHeader>
                <CardTitle>Output</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-40">
                  {output}
                </pre>
              </CardContent>
            </Card>
          )}
          
          {/* Debug Visualization */}
          <Card>
            <CardHeader className="py-2">
              <div className="flex justify-between items-center">
                <CardTitle>Debug Visualization</CardTitle>
                <Button 
                  onClick={() => setShowDebug(!showDebug)} 
                  variant="outline"
                  size="sm"
                >
                  {showDebug ? "Hide Debug" : "Show Debug"}
                </Button>
              </div>
            </CardHeader>
            {showDebug && (
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="text-sm font-bold mb-2">Car State</h3>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div>
                      <span className="text-xs text-gray-500">Position:</span>
                      <div className="font-mono text-sm">
                        X: {useSimulationStore.getState().car.position[0].toFixed(2)}<br />
                        Y: {useSimulationStore.getState().car.position[1].toFixed(2)}<br />
                        Z: {useSimulationStore.getState().car.position[2].toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Rotation:</span>
                      <div className="font-mono text-sm">
                        {useSimulationStore.getState().car.rotation.toFixed(2)}°
                      </div>
                      <span className="text-xs text-gray-500">Running:</span>
                      <div className="font-mono text-sm">
                        {useSimulationStore.getState().isRunning ? "Yes" : "No"}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={refreshDebugState}
                      size="sm"
                      variant="outline"
                    >
                      Refresh
                    </Button>
                    <Button 
                      onClick={stopCarMovement}
                      size="sm"
                      variant="outline"
                    >
                      Stop Movement
                    </Button>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

        </CardContent>
      </Card>
    </div>
  );
}