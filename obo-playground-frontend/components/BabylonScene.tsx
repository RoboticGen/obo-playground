'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as BABYLON from '@babylonjs/core';
import HavokPhysics from '@babylonjs/havok';
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
  Mesh,
  DirectionalLight,
  ShadowGenerator,
  WebGPUEngine,
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import '@babylonjs/loaders/OBJ';
import { Environment } from '@/lib/environmentsApi';
import { createPhysicsManager, getPhysicsManager, disposePhysicsManager } from '@/lib/physics';

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
  const frontWheelRef = useRef<AbstractMesh | null>(null);
  const engineRef = useRef<Engine | WebGPUEngine | null>(null);
  const cameraRef = useRef<ArcRotateCamera | null>(null);
  const physicsManagerRef = useRef<any>(null);
  const carStateRef = useRef<CarState>({
    leftMotorSpeed: 0,
    rightMotorSpeed: 0,
    leftMotorDirection: 0,
    rightMotorDirection: 0,
    frontDistance: 100,
    leftDistance: 100,
    rightDistance: 100,
  });
  const initialPositionRef = useRef<Vector3>(new Vector3(0, 1.0, 0)); // Match minimum height
  const initialRotationRef = useRef<number>(Math.PI);
  const gridLinesRef = useRef<Mesh[]>([]);
  const [isWebGPU, setIsWebGPU] = useState(false);
  const [sceneLoaded, setSceneLoaded] = useState(false);
  const [showGrid, setShowGrid] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Prevent multiple initializations
    if (engineRef.current || sceneRef.current) {
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
        } else {
          throw new Error('WebGPU not supported');
        }
      } catch (error) {
        
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
      
      // Add physics to ground (will be enabled after physics initialization)
      // Mark it so we can add physics later
      (ground as any).needsPhysics = true;

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

      // Load car model
      let carLoaded = false;
      
      // Try GLB first
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
          
          car.position = new Vector3(0, 2, 0);
          car.scaling = new Vector3(0.1, 0.1, 0.1);
          
          // CRITICAL: Set rotation quaternion to null to ensure euler rotation works
          car.rotationQuaternion = null;
          
          // Rotate car to face forward
          car.rotation.y = Math.PI;
          
          carRef.current = car;
          
          // Add a visual direction arrow
          const arrow = MeshBuilder.CreateCylinder('directionArrow', { height: 5, diameter: 0.5 }, scene);
          arrow.position = new Vector3(-3, 2, 0);
          arrow.rotation.z = Math.PI / 2;
          const arrowMat = new StandardMaterial('arrowMat', scene);
          arrowMat.diffuseColor = new Color3(1, 0, 0);
          arrowMat.emissiveColor = new Color3(0.5, 0, 0);
          arrow.material = arrowMat;
          arrow.parent = car;

          // Add meshes to shadow caster
          result.meshes.forEach((mesh) => {
            shadowGenerator.addShadowCaster(mesh);
          });

          // Find wheel meshes and motor connection rods
          
          // Helper function to recursively find all mesh descendants
          const findMeshDescendants = (node: any): AbstractMesh[] => {
            const meshes: AbstractMesh[] = [];
            
            if (node instanceof AbstractMesh && (node as any).geometry) {
              meshes.push(node);
            }
            
            const children = node.getChildren ? node.getChildren() : [];
            children.forEach((child: any) => {
              meshes.push(...findMeshDescendants(child));
            });
            
            return meshes;
          };
          
          // Find motor connection rods to determine wheel rotation axis
          let wheelRotationAxis: 'x' | 'y' | 'z' = 'x';
          result.transformNodes?.forEach((node) => {
            if (node.name.includes('Eixo - Encaixe D')) {
              const descendants = findMeshDescendants(node);
              if (descendants.length > 0) {
                const rodMesh = descendants[0];
                const boundingInfo = rodMesh.getBoundingInfo();
                const size = boundingInfo.boundingBox.maximum.subtract(boundingInfo.boundingBox.minimum);
                
                if (size.x > size.y && size.x > size.z) {
                  wheelRotationAxis = 'x';
                } else if (size.y > size.x && size.y > size.z) {
                  wheelRotationAxis = 'x';
                } else {
                  wheelRotationAxis = 'z';
                }
              }
            }
          });
          
          (car as any).wheelRotationAxis = wheelRotationAxis;
          
          // Find front steering wheel (12mmball)
          result.transformNodes?.forEach((node) => {
            if (node.name === '12mmball:1' || node.name.includes('12mmball')) {
              console.log('🎯 Found front steering wheel:', node.name);
              const wheelMeshes = findMeshDescendants(node);
              if (wheelMeshes.length > 0) {
                frontWheelRef.current = wheelMeshes[0];
                console.log('  ✅ Front wheel mesh:', wheelMeshes[0].name);
              }
            }
          });
          
          // Search through all transform nodes to find wheel parents
          if (result.transformNodes && result.transformNodes.length > 0) {
             (`📦 Found ${result.transformNodes.length} transform nodes`);
            result.transformNodes.forEach((node) => {
              const nodeName = node.name;
              
              if (nodeName === 'Roda 34 mm v2:3') {
                console.log('🔵 Found LEFT wheel parent:', nodeName);
                console.log('  🔎 Searching for descendant meshes...');
                const wheelMeshes = findMeshDescendants(node);
                leftWheelsRef.current.push(...wheelMeshes);
                console.log(`  ✅ Added ${wheelMeshes.length} left wheel meshes`);
              } else if (nodeName === 'Roda 34 mm v2:4') {
                console.log('🔴 Found RIGHT wheel parent:', nodeName);
                console.log('  🔎 Searching for descendant meshes...');
                const wheelMeshes = findMeshDescendants(node);
                rightWheelsRef.current.push(...wheelMeshes);
                console.log(`  ✅ Added ${wheelMeshes.length} right wheel meshes`);
              }
            });
          }
          
          // Fallback: check if wheel meshes are directly in result.meshes
          if (leftWheelsRef.current.length === 0 || rightWheelsRef.current.length === 0) {
            result.meshes.forEach((mesh) => {
              const meshName = mesh.name;
              
              if ((meshName.includes('Body1_node_101') || meshName === 'Roda 34 mm v2:3') && leftWheelsRef.current.length === 0) {
                leftWheelsRef.current.push(mesh);
              } else if ((meshName.includes('Body1_node_102') || meshName === 'Roda 34 mm v2:4') && rightWheelsRef.current.length === 0) {
                rightWheelsRef.current.push(mesh);
              }
            });
          }

          carLoaded = true;
        }
      } catch (glbError) {
        // GLB model not found, try GLTF
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
            car.position = new Vector3(0, 4, 0);
            car.scaling = new Vector3(0.5, 0.5, 0.5);
            carRef.current = car;

            result.meshes.forEach((mesh) => {
              shadowGenerator.addShadowCaster(mesh);
            });

            const findMeshDescendants = (node: any): AbstractMesh[] => {
              const meshes: AbstractMesh[] = [];
              if (node instanceof AbstractMesh && (node as any).geometry) {
                meshes.push(node);
              }
              const children = node.getChildren ? node.getChildren() : [];
              children.forEach((child: any) => {
                meshes.push(...findMeshDescendants(child));
              });
              return meshes;
            };
            
            if (result.transformNodes && result.transformNodes.length > 0) {
              result.transformNodes.forEach((node) => {
                const nodeName = node.name;
                
                if (nodeName === 'Roda 34 mm v2:3') {
                  console.log('🔵 Found LEFT wheel parent:', nodeName);
                  const wheelMeshes = findMeshDescendants(node);
                  leftWheelsRef.current.push(...wheelMeshes);
                  console.log(`  ✅ Added ${wheelMeshes.length} left wheel meshes`);
                } else if (nodeName === 'Roda 34 mm v2:4') {
                  console.log('🔴 Found RIGHT wheel parent:', nodeName);
                  const wheelMeshes = findMeshDescendants(node);
                  rightWheelsRef.current.push(...wheelMeshes);
                  console.log(`  ✅ Added ${wheelMeshes.length} right wheel meshes`);
                }
              });
            }
            
            if (leftWheelsRef.current.length === 0 || rightWheelsRef.current.length === 0) {
              result.meshes.forEach((mesh) => {
                const meshName = mesh.name;
                if ((meshName.includes('Body1_node_101') || meshName === 'Roda 34 mm v2:3') && leftWheelsRef.current.length === 0) {
                  console.log('🔵 Found LEFT wheel mesh directly:', meshName);
                  leftWheelsRef.current.push(mesh);
                } else if ((meshName.includes('Body1_node_102') || meshName === 'Roda 34 mm v2:4') && rightWheelsRef.current.length === 0) {
                  console.log('🔴 Found RIGHT wheel mesh directly:', meshName);
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

      // Initialize Havok Physics Engine
      try {
        const havokInstance = await HavokPhysics();
        const physicsManager = createPhysicsManager(scene, havokInstance);
        physicsManagerRef.current = physicsManager;
        await physicsManager.initialize();

        // Setup car physics if we have the meshes
        if (carRef.current && (leftWheelsRef.current.length > 0 || rightWheelsRef.current.length > 0)) {
          // Use placeholder wheels if not found in model
          if (leftWheelsRef.current.length === 0 && rightWheelsRef.current.length === 0) {
            const wheels = scene.meshes.filter(m => m.name.startsWith('wheel'));
            if (wheels.length >= 4) {
              leftWheelsRef.current = [wheels[0], wheels[2]];
              rightWheelsRef.current = [wheels[1], wheels[3]];
            }
          }

          physicsManager.setupCarPhysics(
            carRef.current,
            leftWheelsRef.current,
            rightWheelsRef.current
          );
        }

        // Add physics to ground
        const groundMesh = scene.getMeshByName('ground');
        
        if (groundMesh) {
          try {
            const groundBBox = groundMesh.getBoundingInfo().boundingBox;
            const groundSize = groundBBox.maximum.subtract(groundBBox.minimum);
            
            new BABYLON.PhysicsAggregate(
              groundMesh,
              BABYLON.PhysicsShapeType.BOX,
              { 
                mass: 0, 
                friction: 0.8, 
                restitution: 0.0,
                extents: new BABYLON.Vector3(groundSize.x / 2, 0.1, groundSize.z / 2)
              },
              scene
            );
          } catch (groundError) {
            console.error('Failed to create ground physics:', groundError);
          }
        }
      } catch (physicsError) {
        console.error('Havok physics initialization error:', physicsError);
      }

      // Call onSceneReady callback
      if (onSceneReady) {
        onSceneReady(scene, carRef.current);
      }

      setSceneLoaded(true);

      // Render loop with continuous car movement
      engine.runRenderLoop(() => {
        if (carRef.current && carStateRef.current) {
          const car = carRef.current;
          const currentCarState = carStateRef.current;
          
          const leftSpeed = (currentCarState.leftMotorSpeed / 512) * currentCarState.leftMotorDirection;
          const rightSpeed = (currentCarState.rightMotorSpeed / 512) * currentCarState.rightMotorDirection;

          // PHYSICS-DRIVEN MOVEMENT
          if (physicsManagerRef.current) {
            physicsManagerRef.current.applyMotorTorque(
              currentCarState.leftMotorSpeed * currentCarState.leftMotorDirection,
              currentCarState.rightMotorSpeed * currentCarState.rightMotorDirection
            );

            physicsManagerRef.current.updateWheelRotation();
            physicsManagerRef.current.constrainCarHeight();

            const physicsPos = physicsManagerRef.current.getCarPosition();
            const physicsRot = physicsManagerRef.current.getCarRotation();
            
            car.position = physicsPos;
            car.rotationQuaternion = physicsRot;

            if (cameraRef.current) {
              cameraRef.current.target = physicsPos.clone();
            }
          } else {
            // FALLBACK: KINEMATIC MODE
            const avgSpeed = (leftSpeed + rightSpeed) / 2;
            const turnRate = (rightSpeed - leftSpeed);
            const moveSpeed = avgSpeed * 0.1;
            const turnSpeed = turnRate * 0.15;
            
            // Rotate wheels (visual only in kinematic mode)
            const rotationAxis = (car as any).wheelRotationAxis || 'z';
            
            if (leftWheelsRef.current.length > 0) {
              leftWheelsRef.current.forEach((wheel) => {
                if (wheel) {
                  if (rotationAxis === 'x') {
                    wheel.rotation.x -= leftSpeed * 0.2;
                  } else if (rotationAxis === 'y') {
                    wheel.rotation.y -= leftSpeed * 0.2;
                  } else {
                    wheel.rotation.z -= leftSpeed * 0.2;
                  }
                }
              });
            }
            
            if (rightWheelsRef.current.length > 0) {
              rightWheelsRef.current.forEach((wheel) => {
                if (wheel) {
                  if (rotationAxis === 'x') {
                    wheel.rotation.x += rightSpeed * 0.2;
                  } else if (rotationAxis === 'y') {
                    wheel.rotation.y += rightSpeed * 0.2;
                  } else {
                    wheel.rotation.z += rightSpeed * 0.2;
                  }
                }
              });
            }
            
            // Apply car body rotation and position
            if (Math.abs(turnSpeed) > 0.0001) {
              car.rotation.y -= turnSpeed;
            }
            
            // Apply forward movement
            if (Math.abs(moveSpeed) > 0.0001) {
              car.position.x -= moveSpeed * Math.sin(car.rotation.y);
              car.position.z -= moveSpeed * Math.cos(car.rotation.y);
            }
            
            // Front wheel steering (visual)
            if (frontWheelRef.current && Math.abs(turnRate) > 0.01) {
              const steeringAngle = turnRate * 0.5;
              frontWheelRef.current.rotation.y = steeringAngle;
            } else if (frontWheelRef.current && Math.abs(turnRate) <= 0.01) {
              frontWheelRef.current.rotation.y *= 0.9;
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
      
      // Dispose physics
      if (physicsManagerRef.current) {
        disposePhysicsManager();
        physicsManagerRef.current = null;
      }
      
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
    };
  }, []);

  // Update car state when props change
  useEffect(() => {
    if (carState && sceneLoaded) {
      carStateRef.current = carState;
    }
  }, [carState, sceneLoaded]);

  // Update environment when changed
  useEffect(() => {
    if (!sceneRef.current || !sceneLoaded) return;
    
    const scene = sceneRef.current;
    
    // Remove old obstacles
    const oldObstacles = scene.meshes.filter(mesh => mesh.name.startsWith('obstacle_'));
    oldObstacles.forEach(mesh => mesh.dispose());
    
    // Create new obstacles from environment
    const envObstacles = environment?.scene_config?.obstacles || [];
    
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
        const directionalLight = scene.lights.find(l => l instanceof DirectionalLight) as DirectionalLight | undefined;
        if (directionalLight?.getShadowGenerator?.()) {
          const sg = directionalLight.getShadowGenerator() as BABYLON.ShadowGenerator;
          sg.addShadowCaster(mesh);
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
      }
    }
  }, [environment, sceneLoaded]);

  // Listen for reset events
  useEffect(() => {
    const handleReset = () => {
      if (carRef.current) {
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
