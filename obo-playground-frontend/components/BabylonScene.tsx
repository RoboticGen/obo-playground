'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as BABYLON from '@babylonjs/core';
import HavokPhysics from '@babylonjs/havok';
import { Scene, AbstractMesh, Mesh, Vector3, Engine, ArcRotateCamera } from '@babylonjs/core';
import { WebGPUEngine } from '@babylonjs/core';
import { Environment } from '@/lib/environmentsApi';
import { createPhysicsManager, disposePhysicsManager } from '@/lib/physics';
import {
  CarState,
  DEFAULT_CAR_STATE,
  createEngine,
  setupScene,
  setupCamera,
  setupLights,
  setupGround,
  setupGrid,
  loadCar,
  createObstacles,
  updateObstacles,
  updateGroundColor,
  createRenderLoop,
} from './babylon';

interface BabylonSceneProps {
  onSceneReady?: (scene: Scene, car: AbstractMesh | null) => void;
  carState?: CarState;
  environment?: Environment;
}

export default function BabylonScene({ onSceneReady, carState, environment }: BabylonSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const engineRef = useRef<Engine | WebGPUEngine | null>(null);
  const cameraRef = useRef<ArcRotateCamera | null>(null);
  const carRef = useRef<AbstractMesh | null>(null);
  const leftWheelsRef = useRef<AbstractMesh[]>([]);
  const rightWheelsRef = useRef<AbstractMesh[]>([]);
  const frontWheelRef = useRef<AbstractMesh | null>(null);
  const physicsManagerRef = useRef<any>(null);
  const gridLinesRef = useRef<Mesh[]>([]);
  const carStateRef = useRef<CarState>(DEFAULT_CAR_STATE);
  const initialPositionRef = useRef<Vector3>(new Vector3(0, 2, 0));
  const initialRotationRef = useRef<number>(Math.PI);
  
  const [isWebGPU, setIsWebGPU] = useState(false);
  const [sceneLoaded, setSceneLoaded] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [physicsActive, setPhysicsActive] = useState(false);

  // Main scene initialization
  useEffect(() => {
    if (!canvasRef.current || engineRef.current || sceneRef.current) return;

    let isCleanedUp = false;

    const initScene = async () => {
      if (isCleanedUp) return;
      
      const canvas = canvasRef.current!;
      
      // Create engine
      const { engine, isWebGPU: webGPU } = await createEngine(canvas);
      if (isCleanedUp) {
        engine.dispose();
        return;
      }
      
      engineRef.current = engine;
      setIsWebGPU(webGPU);

      // Setup scene
      const scene = setupScene(engine);
      sceneRef.current = scene;

      // Setup camera
      const camera = setupCamera(scene, canvas);
      cameraRef.current = camera;

      // Setup lights and shadows
      const shadowGenerator = setupLights(scene);

      // Setup ground
      const groundColor = environment?.scene_config?.groundColor || '#4caf50';
      setupGround(scene, groundColor);

      // Setup grid
      gridLinesRef.current = setupGrid(scene);

      // Create obstacles
      const obstacles = environment?.scene_config?.obstacles || [];
      createObstacles(scene, obstacles, shadowGenerator);

      // Load car model
      const carResult = await loadCar(scene, shadowGenerator);
      carRef.current = carResult.car;
      leftWheelsRef.current = carResult.leftWheels;
      rightWheelsRef.current = carResult.rightWheels;
      frontWheelRef.current = carResult.frontWheel;

      // Initialize physics
      try {
        const havokInstance = await HavokPhysics();
        const physicsManager = createPhysicsManager(scene, havokInstance);
        physicsManagerRef.current = physicsManager;
        await physicsManager.initialize();

        // Setup car physics
        if (carRef.current) {
          let leftWheels = leftWheelsRef.current;
          let rightWheels = rightWheelsRef.current;
          
          if (leftWheels.length === 0 && rightWheels.length === 0) {
            const wheels = scene.meshes.filter(m => m.name.startsWith('wheel'));
            if (wheels.length >= 4) {
              leftWheels = [wheels[0], wheels[2]];
              rightWheels = [wheels[1], wheels[3]];
            }
          }

          physicsManager.setupCarPhysics(carRef.current, leftWheels, rightWheels);
        }

        // Add ground physics
        const groundMesh = scene.getMeshByName('ground');
        if (groundMesh) {
          const groundBBox = groundMesh.getBoundingInfo().boundingBox;
          const groundSize = groundBBox.maximum.subtract(groundBBox.minimum);
          
          new BABYLON.PhysicsAggregate(
            groundMesh,
            BABYLON.PhysicsShapeType.BOX,
            { mass: 0, friction: 0.8, restitution: 0.0, extents: new BABYLON.Vector3(groundSize.x / 2, 0.1, groundSize.z / 2) },
            scene
          );
        }

        // Physics initialized successfully
        setPhysicsActive(true);
      } catch (error) {
        console.error('Physics initialization error:', error);
        setPhysicsActive(false);
      }

      // Callback
      onSceneReady?.(scene, carRef.current);
      setSceneLoaded(true);

      // Setup render loop
      const renderLoop = createRenderLoop(scene, () => {
        if (!carRef.current || !carStateRef.current) return null;
        return {
          scene,
          car: carRef.current,
          carState: carStateRef.current,
          physicsManager: physicsManagerRef.current,
          camera: cameraRef.current,
          leftWheels: leftWheelsRef.current,
          rightWheels: rightWheelsRef.current,
          frontWheel: frontWheelRef.current,
        };
      });
      
      engine.runRenderLoop(renderLoop);

      // Handle resize
      const handleResize = () => engine?.resize();
      window.addEventListener('resize', handleResize);
      setTimeout(() => !isCleanedUp && engine?.resize(), 100);
    };

    initScene();

    return () => {
      isCleanedUp = true;
      disposePhysicsManager();
      physicsManagerRef.current = null;
      sceneRef.current?.dispose();
      sceneRef.current = null;
      engineRef.current?.dispose();
      engineRef.current = null;
      carRef.current = null;
      leftWheelsRef.current = [];
      rightWheelsRef.current = [];
    };
  }, []);

  // Update car state
  useEffect(() => {
    if (carState && sceneLoaded) {
      carStateRef.current = carState;
    }
  }, [carState, sceneLoaded]);

  // Update environment
  useEffect(() => {
    if (!sceneRef.current || !sceneLoaded) return;
    
    const obstacles = environment?.scene_config?.obstacles || [];
    updateObstacles(sceneRef.current, obstacles);
    
    if (environment?.scene_config?.groundColor) {
      updateGroundColor(sceneRef.current, environment.scene_config.groundColor);
    }
  }, [environment, sceneLoaded]);

  // Reset car handler
  useEffect(() => {
    const handleReset = () => {
      if (carRef.current) {
        carRef.current.position = initialPositionRef.current.clone();
        carRef.current.rotation.y = initialRotationRef.current;
        
        [...leftWheelsRef.current, ...rightWheelsRef.current].forEach(wheel => {
          wheel.rotation.x = 0;
          wheel.rotation.y = 0;
          wheel.rotation.z = 0;
        });
        
        if (frontWheelRef.current) {
          frontWheelRef.current.rotation.y = 0;
        }
        
        carStateRef.current = DEFAULT_CAR_STATE;
      }
    };

    window.addEventListener('resetCar', handleReset);
    return () => window.removeEventListener('resetCar', handleReset);
  }, []);

  // Toggle grid
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

    const targetPosition = car.position.clone();
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
        <div className="rounded-sm border border-neutral-800 bg-black/80 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
          {isWebGPU ? 'WebGPU' : 'WebGL'}
        </div>
        
        <div className={`rounded-sm border px-3 py-1.5 text-xs backdrop-blur-sm ${
          physicsActive 
            ? 'border-green-700 bg-green-900/80 text-green-300' 
            : 'border-red-700 bg-red-900/80 text-red-300'
        }`}>
          Physics: {physicsActive ? 'Active' : 'Inactive'}
        </div>
        
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

      {!sceneLoaded && (
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
