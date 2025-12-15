'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as BABYLON from '@babylonjs/core';
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  StandardMaterial,
  Color3,
  SceneLoader,
  AbstractMesh,
  PhysicsImpostor,
  Mesh,
  DirectionalLight,
  ShadowGenerator,
  WebGPUEngine,
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import '@babylonjs/loaders/OBJ';
import { Environment } from '@/lib/environmentsApi';

interface CarState {
  leftMotorSpeed: number;
  rightMotorSpeed: number;
  leftMotorDirection: number;
  rightMotorDirection: number;
  frontDistance: number;
  leftDistance: number;
  rightDistance: number;
}

interface BabylonSceneProps {
  onSceneReady?: (scene: Scene, car: AbstractMesh | null) => void;
  carState?: CarState;
  environment?: Environment;
}

export default function BabylonScene({ onSceneReady, carState, environment }: BabylonSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const carRef = useRef<AbstractMesh | null>(null);
  const leftWheelsRef = useRef<AbstractMesh[]>([]);
  const rightWheelsRef = useRef<AbstractMesh[]>([]);
  const frontWheelRef = useRef<AbstractMesh | null>(null); // Front steering wheel
  const engineRef = useRef<Engine | WebGPUEngine | null>(null);
  const cameraRef = useRef<ArcRotateCamera | null>(null);
  const carStateRef = useRef<CarState>({
    leftMotorSpeed: 0,
    rightMotorSpeed: 0,
    leftMotorDirection: 0,
    rightMotorDirection: 0,
    frontDistance: 100,
    leftDistance: 100,
    rightDistance: 100,
  });
  const initialPositionRef = useRef<Vector3>(new Vector3(0, 2, 0));
  const initialRotationRef = useRef<number>(Math.PI);
  const gridLinesRef = useRef<Mesh[]>([]);
  const [isWebGPU, setIsWebGPU] = useState(false);
  const [sceneLoaded, setSceneLoaded] = useState(false);
  const [showGrid, setShowGrid] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Prevent multiple initializations
    if (engineRef.current || sceneRef.current) {
       ('⚠️ Scene already initialized, skipping... (This is normal in React development mode)');
      return;
    }

    let isCleanedUp = false;

    const initScene = async () => {
      if (isCleanedUp) return;
      
      const canvas = canvasRef.current!;
      
      // Try WebGPU first, fallback to WebGL
      let engine: Engine | WebGPUEngine;
      let useWebGPU = false;
      
      try {
        if (await WebGPUEngine.IsSupportedAsync) {
           ('🚀 Initializing WebGPU engine...');
          const webGPUEngine = new WebGPUEngine(canvas);
          await webGPUEngine.initAsync();
          
          if (isCleanedUp) {
            // Component unmounted during initialization
            webGPUEngine.dispose();
            return;
          }
          
          engine = webGPUEngine;
          useWebGPU = true;
          setIsWebGPU(true);
           ('✅ WebGPU engine initialized');
        } else {
          throw new Error('WebGPU not supported');
        }
      } catch (error) {
         ('⚠️ WebGPU not available, falling back to WebGL');
        
        if (isCleanedUp) return;
        
        engine = new Engine(canvas, true, {
          preserveDrawingBuffer: true,
          stencil: true,
        });
        setIsWebGPU(false);
      }

      if (isCleanedUp) {
        engine.dispose();
        return;
      }

      engineRef.current = engine;

      // Create scene
      const scene = new Scene(engine);
      scene.clearColor = new Color3(0.85, 0.9, 1).toColor4();
      sceneRef.current = scene;

      // Camera - ArcRotateCamera for orbiting around the car
      const camera = new ArcRotateCamera(
        'camera',
        -Math.PI / 2,  // Alpha (horizontal rotation)
        Math.PI / 3,   // Beta (vertical angle)
        80,            // Radius (distance from target)
        Vector3.Zero(), // Target position
        scene
      );
      
      // Store camera reference
      cameraRef.current = camera;
      
      // Attach camera controls to canvas
      camera.attachControl(canvas, true);
      
      // Zoom limits
      camera.lowerRadiusLimit = 10;   // Closest zoom
      camera.upperRadiusLimit = 300;  // Farthest zoom
      
      // Mouse wheel zoom speed (lower = faster zoom)
      camera.wheelPrecision = 5;
      
      // Camera movement speeds
      camera.panningSensibility = 50;  // Panning speed (middle mouse button)
      camera.angularSensibilityX = 500; // Horizontal rotation speed
      camera.angularSensibilityY = 500; // Vertical rotation speed
      
      // Allow camera to move below ground
      camera.lowerBetaLimit = 0.1;
      camera.upperBetaLimit = Math.PI / 2;
      
      // Enable panning (Ctrl + Left mouse or Middle mouse)
      camera.panningSensibility = 50;

      // Lights
      const hemisphericLight = new HemisphericLight(
        'hemisphericLight',
        new Vector3(0, 1, 0),
        scene
      );
      hemisphericLight.intensity = 0.7;

      const directionalLight = new DirectionalLight(
        'directionalLight',
        new Vector3(-1, -2, -1),
        scene
      );
      directionalLight.position = new Vector3(20, 40, 20);
      directionalLight.intensity = 0.5;

      // Shadow generator
      const shadowGenerator = new ShadowGenerator(1024, directionalLight);
      shadowGenerator.useBlurExponentialShadowMap = true;

      // Ground - use environment config if available
      const ground = MeshBuilder.CreateGround(
        'ground',
        { width: 200, height: 200 },
        scene
      );
      const groundMaterial = new StandardMaterial('groundMaterial', scene);
      
      // Use environment ground color or default
      const groundColor = environment?.scene_config?.groundColor || '#4caf50';
      const color = Color3.FromHexString(groundColor);
      groundMaterial.diffuseColor = color;
      groundMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
      ground.material = groundMaterial;
      ground.receiveShadows = true;

      // Grid pattern on ground
      const gridLines: Mesh[] = [];
      for (let i = -10; i <= 10; i++) {
        if (i !== 0) {
          const lineX = MeshBuilder.CreateBox(
            `lineX${i}`,
            { width: 200, height: 0.1, depth: 0.2 },
            scene
          );
          lineX.position = new Vector3(0, 0.05, i * 10);
          const lineZ = MeshBuilder.CreateBox(
            `lineZ${i}`,
            { width: 0.2, height: 0.1, depth: 200 },
            scene
          );
          lineZ.position = new Vector3(i * 10, 0.05, 0);
          
          const lineMaterial = new StandardMaterial(`lineMat${i}`, scene);
          lineMaterial.diffuseColor = new Color3(0.3, 0.6, 0.3);
          lineX.material = lineMaterial;
          lineZ.material = lineMaterial;
          gridLines.push(lineX, lineZ);
        }
      }
      gridLinesRef.current = gridLines;

      // Create obstacles from environment configuration
      const obstacles: Mesh[] = [];
      const envObstacles = environment?.scene_config?.obstacles || [];
      
       (`🏗️ Creating ${envObstacles.length} obstacles from environment`);
      
      envObstacles.forEach((obstacle, index) => {
        let mesh: Mesh | null = null;
        
        switch (obstacle.type) {
          case 'box':
          case 'wall':
            mesh = MeshBuilder.CreateBox(`obstacle_${index}`, {
              width: obstacle.size[0],
              height: obstacle.size[1],
              depth: obstacle.size[2],
            }, scene);
            break;
            
          case 'sphere':
            mesh = MeshBuilder.CreateSphere(`obstacle_${index}`, {
              diameter: obstacle.size[0],
            }, scene);
            break;
            
          case 'cylinder':
            mesh = MeshBuilder.CreateCylinder(`obstacle_${index}`, {
              diameter: obstacle.size[0],
              height: obstacle.size[1],
            }, scene);
            break;
        }
        
        if (mesh) {
          // Set position
          mesh.position = new Vector3(
            obstacle.position[0],
            obstacle.position[1],
            obstacle.position[2]
          );
          
          // Set rotation if provided
          if (obstacle.rotation) {
            mesh.rotation = new Vector3(
              obstacle.rotation[0],
              obstacle.rotation[1],
              obstacle.rotation[2]
            );
          }
          
          // Set color
          const material = new StandardMaterial(`obstacleMat_${index}`, scene);
          const color = obstacle.color || '#888888';
          material.diffuseColor = Color3.FromHexString(color);
          mesh.material = material;
          
          // Add shadows
          shadowGenerator.addShadowCaster(mesh);
          obstacles.push(mesh);
        }
      });

      // Load car model - try multiple formats
       ('🚗 Loading car model...');
      let carLoaded = false;
      
      // Try GLB first (recommended format, best supported)
      try {
        const result = await SceneLoader.ImportMeshAsync(
          '',
          '/model/',
          'obocar.glb',
          scene
        );

        if (result.meshes.length > 0) {
          // GLB files often have __root__ as meshes[0], which is an empty transform node
          // We need to use this root to rotate the entire car model hierarchy
          const car = result.meshes[0];
          
           (`🚗 Car root node: ${car.name}, type: ${car.constructor.name}`);
           (`📦 Total meshes in model: ${result.meshes.length}`);
           (`📦 Total transform nodes: ${result.transformNodes?.length || 0}`);
          
          car.position = new Vector3(0, 2, 0);
          car.scaling = new Vector3(0.1, 0.1, 0.1);
          
          // CRITICAL: Set rotation quaternion to null to ensure euler rotation works
          car.rotationQuaternion = null;
          
          // Rotate car to face forward (adjust angle based on model orientation)
          car.rotation.y = Math.PI; // -90 degrees to face correct direction
          
          carRef.current = car;
          
          // Add a visual direction arrow to see car rotation clearly (forward is -X direction)
          const arrow = MeshBuilder.CreateCylinder('directionArrow', { height: 5, diameter: 0.5 }, scene);
          arrow.position = new Vector3(-3, 2, 0); // In front of car (-X is forward)
          arrow.rotation.z = Math.PI / 2; // Point forward along X axis
          const arrowMat = new StandardMaterial('arrowMat', scene);
          arrowMat.diffuseColor = new Color3(1, 0, 0); // Red arrow
          arrowMat.emissiveColor = new Color3(0.5, 0, 0); // Glowing
          arrow.material = arrowMat;
          arrow.parent = car; // Attach to car so it rotates with it
           ('🎯 Added red direction arrow to car');

          // Add meshes to shadow caster
          result.meshes.forEach((mesh) => {
            shadowGenerator.addShadowCaster(mesh);
          });

          // Find wheel MESHES by searching for parent transform nodes and collecting descendants
          // Roda 34 mm v2:3 (parent) -> Roda 34 mm v2 -> Body1_node_101 (actual mesh!)
           ('🔍 Searching for wheel meshes and motor connection rods...');
          
          // Helper function to recursively find all mesh descendants
          const findMeshDescendants = (node: any): AbstractMesh[] => {
            const meshes: AbstractMesh[] = [];
            
            // If this node is a mesh with geometry, add it
            if (node instanceof AbstractMesh && (node as any).geometry) {
              meshes.push(node);
               ('    ✓ Found mesh:', node.name);
            }
            
            // Recursively check all children
            const children = node.getChildren ? node.getChildren() : [];
            children.forEach((child: any) => {
              meshes.push(...findMeshDescendants(child));
            });
            
            return meshes;
          };
          
          // Find motor connection rods to determine wheel rotation axis
          let wheelRotationAxis: 'x' | 'y' | 'z' = 'x'; // Default to X (most common for car wheels)
          result.transformNodes?.forEach((node) => {
            if (node.name.includes('Eixo - Encaixe D')) {
               ('🔧 Found motor rod:', node.name);
              const descendants = findMeshDescendants(node);
              if (descendants.length > 0) {
                const rodMesh = descendants[0];
                // Check bounding box to determine rod orientation
                const boundingInfo = rodMesh.getBoundingInfo();
                const size = boundingInfo.boundingBox.maximum.subtract(boundingInfo.boundingBox.minimum);
                 (`  📏 Rod dimensions: X=${size.x.toFixed(2)}, Y=${size.y.toFixed(2)}, Z=${size.z.toFixed(2)}`);
                
                // The rod axis determines which axis the wheel rotates around
                // Rod along X → Wheels rotate around X (most common for cars)
                // Rod along Y → Wheels rotate around X or Z (perpendicular to rod)
                // Rod along Z → Wheels rotate around Z
                if (size.x > size.y && size.x > size.z) {
                  wheelRotationAxis = 'x';
                   ('  ⚙️ Motor rod along X-axis → Wheels rotate around X-axis');
                } else if (size.y > size.x && size.y > size.z) {
                  // Rod is vertical, wheel should rotate horizontally
                  wheelRotationAxis = 'x'; // Use X for side-to-side car wheels
                   ('  ⚙️ Motor rod along Y-axis → Wheels rotate around X-axis (perpendicular)');
                } else {
                  wheelRotationAxis = 'z';
                   ('  ⚙️ Motor rod along Z-axis → Wheels rotate around Z-axis');
                }
              }
            }
          });
          
          // Store the rotation axis for use in render loop
          (car as any).wheelRotationAxis = wheelRotationAxis;
           (`🎯 Wheel rotation axis determined: ${wheelRotationAxis.toUpperCase()}`);
          
          // Find front steering wheel (12mmball)
          result.transformNodes?.forEach((node) => {
            if (node.name === '12mmball:1' || node.name.includes('12mmball')) {
               ('🎯 Found front steering wheel:', node.name);
              const wheelMeshes = findMeshDescendants(node);
              if (wheelMeshes.length > 0) {
                frontWheelRef.current = wheelMeshes[0];
                 ('  ✅ Front wheel mesh:', wheelMeshes[0].name);
              }
            }
          });
          
          // Search through all transform nodes to find wheel parents
          if (result.transformNodes && result.transformNodes.length > 0) {
             (`📦 Found ${result.transformNodes.length} transform nodes`);
            result.transformNodes.forEach((node) => {
              const nodeName = node.name;
              
              if (nodeName === 'Roda 34 mm v2:3') {
                 ('🔵 Found LEFT wheel parent:', nodeName);
                 ('  🔎 Searching for descendant meshes...');
                const wheelMeshes = findMeshDescendants(node);
                leftWheelsRef.current.push(...wheelMeshes);
                 (`  ✅ Added ${wheelMeshes.length} left wheel meshes`);
              } else if (nodeName === 'Roda 34 mm v2:4') {
                 ('🔴 Found RIGHT wheel parent:', nodeName);
                 ('  🔎 Searching for descendant meshes...');
                const wheelMeshes = findMeshDescendants(node);
                rightWheelsRef.current.push(...wheelMeshes);
                 (`  ✅ Added ${wheelMeshes.length} right wheel meshes`);
              }
            });
          }
          
          // Fallback: check if wheel meshes are directly in result.meshes
          if (leftWheelsRef.current.length === 0 || rightWheelsRef.current.length === 0) {
            result.meshes.forEach((mesh) => {
              const meshName = mesh.name;
              
              // Look for Body1_node_101 (left wheel mesh) and Body1_node_102 (right wheel mesh)
              if ((meshName.includes('Body1_node_101') || meshName === 'Roda 34 mm v2:3') && leftWheelsRef.current.length === 0) {
                 ('🔵 Found LEFT wheel mesh directly:', meshName);
                leftWheelsRef.current.push(mesh);
              } else if ((meshName.includes('Body1_node_102') || meshName === 'Roda 34 mm v2:4') && rightWheelsRef.current.length === 0) {
                 ('🔴 Found RIGHT wheel mesh directly:', meshName);
                rightWheelsRef.current.push(mesh);
              }
            });
          }

           (`✅ Car model loaded (GLB format) - ${leftWheelsRef.current.length} left wheels, ${rightWheelsRef.current.length} right wheels`);
          carLoaded = true;
        }
      } catch (glbError) {
         ('ℹ️ GLB model not found');
      }

      // Try GLTF if GLB failed
      if (!carLoaded) {
        try {
          const result = await SceneLoader.ImportMeshAsync(
            '',
            '/model/',
            'obocar.gltf',
            scene
          );

          if (result.meshes.length > 0) {
            const car = result.meshes[0];
            car.position = new Vector3(0, 3.5, 0);
            car.scaling = new Vector3(0.5, 0.5, 0.5);
            carRef.current = car;

            // Add meshes to shadow caster
            result.meshes.forEach((mesh) => {
              shadowGenerator.addShadowCaster(mesh);
            });

            // Find wheel MESHES (same logic as GLB)
             ('🔍 Searching for wheel meshes in GLTF scene...');
            
            const findMeshDescendants = (node: any): AbstractMesh[] => {
              const meshes: AbstractMesh[] = [];
              if (node instanceof AbstractMesh && (node as any).geometry) {
                meshes.push(node);
                 ('    ✓ Found mesh:', node.name);
              }
              const children = node.getChildren ? node.getChildren() : [];
              children.forEach((child: any) => {
                meshes.push(...findMeshDescendants(child));
              });
              return meshes;
            };
            
            if (result.transformNodes && result.transformNodes.length > 0) {
               (`📦 Found ${result.transformNodes.length} transform nodes`);
              result.transformNodes.forEach((node) => {
                const nodeName = node.name;
                
                if (nodeName === 'Roda 34 mm v2:3') {
                   ('🔵 Found LEFT wheel parent:', nodeName);
                  const wheelMeshes = findMeshDescendants(node);
                  leftWheelsRef.current.push(...wheelMeshes);
                   (`  ✅ Added ${wheelMeshes.length} left wheel meshes`);
                } else if (nodeName === 'Roda 34 mm v2:4') {
                   ('🔴 Found RIGHT wheel parent:', nodeName);
                  const wheelMeshes = findMeshDescendants(node);
                  rightWheelsRef.current.push(...wheelMeshes);
                   (`  ✅ Added ${wheelMeshes.length} right wheel meshes`);
                }
              });
            }
            
            if (leftWheelsRef.current.length === 0 || rightWheelsRef.current.length === 0) {
              result.meshes.forEach((mesh) => {
                const meshName = mesh.name;
                if ((meshName.includes('Body1_node_101') || meshName === 'Roda 34 mm v2:3') && leftWheelsRef.current.length === 0) {
                   ('🔵 Found LEFT wheel mesh directly:', meshName);
                  leftWheelsRef.current.push(mesh);
                } else if ((meshName.includes('Body1_node_102') || meshName === 'Roda 34 mm v2:4') && rightWheelsRef.current.length === 0) {
                   ('🔴 Found RIGHT wheel mesh directly:', meshName);
                  rightWheelsRef.current.push(mesh);
                }
              });
            }

             (`✅ Car model loaded (GLTF format) - ${leftWheelsRef.current.length} left wheels, ${rightWheelsRef.current.length} right wheels`);
            carLoaded = true;
          }
        } catch (gltfError) {
           ('ℹ️ GLTF model not found');
        }
      }

      // Create placeholder car if no model loaded
      if (!carLoaded) {
         ('📦 Creating placeholder car model');
        
        // Create placeholder car
        const carBody = MeshBuilder.CreateBox('carBody', { width: 3, height: 1, depth: 4.5 }, scene);
        carBody.position = new Vector3(0, 1.5, 0);
        
        const carMaterial = new StandardMaterial('carMaterial', scene);
        carMaterial.diffuseColor = new Color3(0.2, 0.6, 0.9);
        carBody.material = carMaterial;
        
        // Add wheels
        const wheelPositions = [
          new Vector3(-1.5, 0.3, 2),
          new Vector3(1.5, 0.3, 2),
          new Vector3(-1.5, 0.3, -2),
          new Vector3(1.5, 0.3, -2),
        ];
        
        wheelPositions.forEach((pos, index) => {
          const wheel = MeshBuilder.CreateCylinder(
            `wheel${index}`,
            { height: 0.5, diameter: 1 },
            scene
          );
          wheel.rotation.z = Math.PI / 2;
          wheel.position = pos;
          wheel.parent = carBody;
          
          const wheelMaterial = new StandardMaterial(`wheelMaterial${index}`, scene);
          wheelMaterial.diffuseColor = new Color3(0.1, 0.1, 0.1);
          wheel.material = wheelMaterial;
        });
        
        carRef.current = carBody;
        shadowGenerator.addShadowCaster(carBody);
      }

      // Call onSceneReady callback
      if (onSceneReady) {
        onSceneReady(scene, carRef.current);
      }

      setSceneLoaded(true);

      // Render loop with continuous car movement
      let lastLogTime = 0;
      let hasLoggedRefCheck = false;
      let frameCount = 0;
      engine.runRenderLoop(() => {
        frameCount++;
        
        if (!hasLoggedRefCheck) {
           ('🔄 Render loop - carRef:', !!carRef.current, 'carStateRef:', carStateRef.current);
          hasLoggedRefCheck = true;
        }
        
        // Log frame count every second to verify render loop is running
        const now = Date.now();
        if (now - lastLogTime > 1000) {
           (`🎬 Frame ${frameCount} - Render loop active`);
        }
        
        if (carRef.current && carStateRef.current) {
          const car = carRef.current;
          const currentCarState = carStateRef.current;
          
          // Calculate differential drive motion
          const leftSpeed = (currentCarState.leftMotorSpeed / 512) * currentCarState.leftMotorDirection;
          const rightSpeed = (currentCarState.rightMotorSpeed / 512) * currentCarState.rightMotorDirection;
          
          // Differential drive: avgSpeed moves car forward/backward, turnRate rotates it
          const avgSpeed = (leftSpeed + rightSpeed) / 2;
          const turnRate = (rightSpeed - leftSpeed);
          
          // Scale factors for realistic movement (SIGNIFICANTLY increased for visibility)
          const moveSpeed = avgSpeed * 0.1; // Forward/backward speed - THIS HAPPENS EVERY FRAME (~60fps)
          const turnSpeed = turnRate * 0.15;  // Rotation speed from wheel friction - MASSIVELY INCREASED for visible rotation
          
          // Debug logging (once per second) - ALWAYS log motor state
          const now = Date.now();
          if (now - lastLogTime > 1000) {
            const hasMotorActivity = currentCarState.leftMotorSpeed > 0 || currentCarState.rightMotorSpeed > 0;
             ('🎮 Motor state:', {
              leftMotorSpeed: currentCarState.leftMotorSpeed,
              leftMotorDirection: currentCarState.leftMotorDirection,
              rightMotorSpeed: currentCarState.rightMotorSpeed,
              rightMotorDirection: currentCarState.rightMotorDirection,
              leftSpeed: leftSpeed.toFixed(2),
              rightSpeed: rightSpeed.toFixed(2),
              avgSpeed: avgSpeed.toFixed(2),
              turnRate: turnRate.toFixed(2),
              turnSpeed: turnSpeed.toFixed(3),
              moveSpeed: moveSpeed.toFixed(3),
              rotation: car.rotation.y.toFixed(2),
              position: `(${car.position.x.toFixed(1)}, ${car.position.z.toFixed(1)})`,
              hasMotorActivity,
              wheelsFound: `L:${leftWheelsRef.current.length} R:${rightWheelsRef.current.length}`
            });
            lastLogTime = now;
          }
          
          // Rotate individual wheels based on motor speeds
          // Use the axis determined from motor rod orientation
          const rotationAxis = (car as any).wheelRotationAxis || 'z';
          
          if (leftWheelsRef.current.length > 0) {
            leftWheelsRef.current.forEach((wheel, index) => {
              if (wheel) {
                // LEFT wheels rotate in NEGATIVE direction
                if (rotationAxis === 'x') {
                  wheel.rotation.x -= leftSpeed * 0.2;
                } else if (rotationAxis === 'y') {
                  wheel.rotation.y -= leftSpeed * 0.2;
                } else {
                  wheel.rotation.z -= leftSpeed * 0.2;
                }
                
                // Debug first wheel rotation every 60 frames
                if (index === 0 && frameCount % 60 === 0 && Math.abs(leftSpeed) > 0.01) {
                   (`🔵 LEFT wheel [${wheel.name}] rotation (${rotationAxis}): ${wheel.rotation[rotationAxis].toFixed(2)}, speed=${leftSpeed.toFixed(2)}`);
                }
              }
            });
          }
          
          if (rightWheelsRef.current.length > 0) {
            rightWheelsRef.current.forEach((wheel, index) => {
              if (wheel) {
                // RIGHT wheels rotate in POSITIVE direction (mirrored from left)
                if (rotationAxis === 'x') {
                  wheel.rotation.x += rightSpeed * 0.2;
                } else if (rotationAxis === 'y') {
                  wheel.rotation.y += rightSpeed * 0.2;
                } else {
                  wheel.rotation.z += rightSpeed * 0.2;
                }
                
                // Debug first wheel rotation every 60 frames
                if (index === 0 && frameCount % 60 === 0 && Math.abs(rightSpeed) > 0.01) {
                   (`🔴 RIGHT wheel [${wheel.name}] rotation (${rotationAxis}): ${wheel.rotation[rotationAxis].toFixed(2)}, speed=${rightSpeed.toFixed(2)}`);
                }
              }
            });
          }
          
          // Rotate front steering wheel based on turn rate
          if (frontWheelRef.current && Math.abs(turnRate) > 0.01) {
            // Turn rate determines steering angle (max ~30 degrees)
            const steeringAngle = turnRate * 0.5; // Limit steering angle
            frontWheelRef.current.rotation.y = steeringAngle;
            
            if (frameCount % 60 === 0) {
               (`🎯 Front wheel steering: ${(steeringAngle * 180 / Math.PI).toFixed(1)}°, turnRate=${turnRate.toFixed(2)}`);
            }
          } else if (frontWheelRef.current && Math.abs(turnRate) <= 0.01) {
            // Return to center when not turning
            frontWheelRef.current.rotation.y *= 0.9; // Smooth return to center
          }
          
          // Apply car body rotation EVERY FRAME
          if (Math.abs(turnSpeed) > 0.0001) {
            const oldRotation = car.rotation.y;
            car.rotation.y -= turnSpeed;  // Subtract to match correct turn direction
            
            // Debug rotation application every 10 frames
            if (frameCount % 10 === 0) {
               (`🔄 ROTATION: old=${oldRotation.toFixed(3)}, turnSpeed=${turnSpeed.toFixed(3)}, new=${car.rotation.y.toFixed(3)}, diff=${(car.rotation.y - oldRotation).toFixed(3)}`);
            }
          }
          
          // Apply car body forward movement EVERY FRAME based on rotation
          if (Math.abs(avgSpeed) > 0.001) {
            // Car model's forward is along -X axis, perpendicular (left/right) is Z axis
            const forwardX = Math.cos(car.rotation.y);   // X is forward direction
            const forwardZ = -Math.sin(car.rotation.y);  // Z is perpendicular (left/right)
            
            // APPLY MOVEMENT EVERY FRAME - this is the key to continuous motion
            car.position.x += forwardX * moveSpeed;
            car.position.z += forwardZ * moveSpeed;
          }
          
          // Log periodically for debugging - ALWAYS log when motors are active
          if (frameCount % 60 === 0) {
            const hasMotion = Math.abs(avgSpeed) > 0.001 || Math.abs(turnSpeed) > 0.0001;
            if (hasMotion) {
               (`🚗 Moving: Frame ${frameCount}, avgSpeed ${avgSpeed.toFixed(2)}, Pos (${car.position.x.toFixed(1)}, ${car.position.z.toFixed(1)}), Rot ${car.rotation.y.toFixed(2)}, Left wheels: ${leftWheelsRef.current.length}, Right wheels: ${rightWheelsRef.current.length}`);
            }
          }
        }
        
        scene.render();
      });

      // Handle resize with debounce for WebGPU
      let resizeTimeout: NodeJS.Timeout;
      const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          if (engine) {
            engine.resize();
          }
        }, 100);
      };
      window.addEventListener('resize', handleResize);
      
      // Initial resize
      setTimeout(() => {
        if (!isCleanedUp && engine) {
          engine.resize();
        }
      }, 100);
    };

    initScene();

    // Cleanup function
    return () => {
      isCleanedUp = true;
      
      if (sceneRef.current) {
        sceneRef.current.dispose();
        sceneRef.current = null;
      }
      
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
      
      carRef.current = null;
      leftWheelsRef.current = [];
      rightWheelsRef.current = [];
       ('🧹 Babylon.js cleaned up');
    };
  }, []);

  // Update car state when props change
  useEffect(() => {
    if (carState && sceneLoaded) {
       ('✅ BabylonScene updating car state:', carState);
       ('📍 Ref before update:', carStateRef.current);
      carStateRef.current = carState;
       ('📍 Ref after update:', carStateRef.current);
    }
  }, [carState, sceneLoaded]);

  // Update environment when changed
  useEffect(() => {
    if (!sceneRef.current || !sceneLoaded) return;
    
    const scene = sceneRef.current;
     ('🌍 Environment changed, recreating obstacles...');
    
    // Remove old obstacles
    const oldObstacles = scene.meshes.filter(mesh => mesh.name.startsWith('obstacle_'));
    oldObstacles.forEach(mesh => mesh.dispose());
    
    // Create new obstacles from environment
    const envObstacles = environment?.scene_config?.obstacles || [];
     (`🏗️ Creating ${envObstacles.length} new obstacles`);
    
    envObstacles.forEach((obstacle, index) => {
      let mesh: Mesh | null = null;
      
      switch (obstacle.type) {
        case 'box':
        case 'wall':
          mesh = MeshBuilder.CreateBox(`obstacle_${index}`, {
            width: obstacle.size[0],
            height: obstacle.size[1],
            depth: obstacle.size[2],
          }, scene);
          break;
          
        case 'sphere':
          mesh = MeshBuilder.CreateSphere(`obstacle_${index}`, {
            diameter: obstacle.size[0],
          }, scene);
          break;
          
        case 'cylinder':
          mesh = MeshBuilder.CreateCylinder(`obstacle_${index}`, {
            diameter: obstacle.size[0],
            height: obstacle.size[1],
          }, scene);
          break;
      }
      
      if (mesh) {
        mesh.position = new Vector3(
          obstacle.position[0],
          obstacle.position[1],
          obstacle.position[2]
        );
        
        if (obstacle.rotation) {
          mesh.rotation = new Vector3(
            obstacle.rotation[0],
            obstacle.rotation[1],
            obstacle.rotation[2]
          );
        }
        
        const material = new StandardMaterial(`obstacleMat_${index}`, scene);
        const color = obstacle.color || '#888888';
        material.diffuseColor = Color3.FromHexString(color);
        mesh.material = material;
        
        // Add shadows if shadowGenerator exists
        const shadowGenerator = scene.lights.find(l => l instanceof DirectionalLight)?.getShadowGenerator?.();
        if (shadowGenerator) {
          shadowGenerator.addShadowCaster(mesh);
        }
      }
    });
    
    // Update ground color
    const ground = scene.getMeshByName('ground');
    if (ground && environment?.scene_config?.groundColor) {
      const groundMaterial = ground.material as StandardMaterial;
      if (groundMaterial) {
        const color = Color3.FromHexString(environment.scene_config.groundColor);
        groundMaterial.diffuseColor = color;
         (`🎨 Ground color updated to ${environment.scene_config.groundColor}`);
      }
    }
  }, [environment, sceneLoaded]);

  // Listen for reset events
  useEffect(() => {
    const handleReset = () => {
      if (carRef.current) {
         ('🔄 Resetting car to initial position');
        carRef.current.position = initialPositionRef.current.clone();
        carRef.current.rotation.y = initialRotationRef.current;
        
        // Reset wheels rotation
        leftWheelsRef.current.forEach(wheel => {
          wheel.rotation.x = 0;
          wheel.rotation.y = 0;
          wheel.rotation.z = 0;
        });
        rightWheelsRef.current.forEach(wheel => {
          wheel.rotation.x = 0;
          wheel.rotation.y = 0;
          wheel.rotation.z = 0;
        });
        if (frontWheelRef.current) {
          frontWheelRef.current.rotation.y = 0;
        }
        
        // Reset car state
        carStateRef.current = {
          leftMotorSpeed: 0,
          rightMotorSpeed: 0,
          leftMotorDirection: 0,
          rightMotorDirection: 0,
          frontDistance: 100,
          leftDistance: 100,
          rightDistance: 100,
        };
      }
    };

    window.addEventListener('resetCar', handleReset);
    return () => window.removeEventListener('resetCar', handleReset);
  }, []);

  // Toggle grid visibility
  useEffect(() => {
    gridLinesRef.current.forEach(line => {
      line.isVisible = showGrid;
    });
  }, [showGrid]);

  // Focus camera on car
  const focusOnCar = useCallback(() => {
    const camera = cameraRef.current;
    const car = carRef.current;
    if (!camera || !car) return;

    // Smoothly animate camera to focus on car
    const targetPosition = car.position.clone();
    
    // Create animation for camera target
    const animationTarget = new BABYLON.Animation(
      "camTargetAnim",
      "target",
      60,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    animationTarget.setKeys([
      { frame: 0, value: camera.target.clone() },
      { frame: 30, value: targetPosition }
    ]);

    camera.animations = [animationTarget];
    sceneRef.current?.beginAnimation(camera, 0, 30, false);
  }, []);

  return (
    <div className="relative h-full w-full">
      <canvas ref={canvasRef} className="h-full w-full outline-none" />
      
      {/* Top-left controls */}
      <div className="absolute left-4 top-4 flex flex-col items-start gap-2">
        {/* Engine info badge */}
        <div className="rounded-sm border border-neutral-800 bg-black/80 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
          {isWebGPU ? 'WebGPU' : 'WebGL'}
        </div>
        
        {/* Grid toggle button */}
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`rounded-sm border p-2 backdrop-blur-sm transition-colors ${
            showGrid
              ? 'border-blue-700 bg-blue-700/20 text-blue-400 hover:bg-blue-700/30'
              : 'border-neutral-800 bg-black/80 text-neutral-400 hover:bg-neutral-900/80'
          }`}
          title="Toggle Grid"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5h16M4 12h16M4 19h16M4 5v14M12 5v14M20 5v14" />
          </svg>
        </button>
      </div>

      {/* Top-right controls */}
      <div className="absolute right-4 top-4 flex flex-col gap-2">
        {/* Focus on car button */}
        <button
          onClick={focusOnCar}
          className="group rounded-sm border border-neutral-800 bg-black/80 px-3 py-2 backdrop-blur-sm transition-all hover:border-blue-700 hover:bg-blue-700/20"
          title="Focus on Car"
        >
          <svg className="h-5 w-5 text-neutral-400 transition-colors group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
      </div>

      {sceneLoaded === false && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-700 border-t-transparent"></div>
            <p className="text-lg font-semibold text-white">Loading 3D Scene...</p>
          </div>
        </div>
      )}
    </div>
  );
}
