import { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import HavokPhysics from '@babylonjs/havok';
import { Scene, AbstractMesh, Vector3, Engine, ArcRotateCamera, Mesh } from '@babylonjs/core';
import { WebGPUEngine } from '@babylonjs/core';
import { Environment } from '@/lib/environmentsApi';
import { createPhysicsManager, disposePhysicsManager } from '@/lib/physics';
import {
  DEFAULT_CAR_STATE,
  createEngine,
  setupScene,
  setupCamera,
  setupLights,
  setupGround,
  setupGrid,
  loadCar,
  createObstacles,
  createRenderLoop,
} from '..';

interface UseSceneInitializationProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  environment?: Environment;
  onSceneReady?: (scene: Scene, car: AbstractMesh | null) => void;
}

export function useSceneInitialization({
  canvasRef,
  environment,
  onSceneReady,
}: UseSceneInitializationProps) {
  const sceneRef = useRef<Scene | null>(null);
  const engineRef = useRef<Engine | WebGPUEngine | null>(null);
  const cameraRef = useRef<ArcRotateCamera | null>(null);
  const carRef = useRef<AbstractMesh | null>(null);
  const leftWheelsRef = useRef<AbstractMesh[]>([]);
  const rightWheelsRef = useRef<AbstractMesh[]>([]);
  const frontWheelRef = useRef<AbstractMesh | null>(null);
  const physicsManagerRef = useRef<any>(null);
  const gridLinesRef = useRef<Mesh[]>([]);
  const carStateRef = useRef(DEFAULT_CAR_STATE);
  const initialPositionRef = useRef<Vector3>(new Vector3(0, 2, 0));
  const initialRotationRef = useRef<number>(Math.PI);

  const [isWebGPU, setIsWebGPU] = useState(false);
  const [sceneLoaded, setSceneLoaded] = useState(false);
  const [physicsActive, setPhysicsActive] = useState(false);

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
      await initializePhysics(scene, carRef.current);

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

    const initializePhysics = async (scene: Scene, car: AbstractMesh | null) => {
      try {
        const havokInstance = await HavokPhysics();
        const physicsManager = createPhysicsManager(scene, havokInstance);
        physicsManagerRef.current = physicsManager;
        await physicsManager.initialize();

        // Setup car physics
        if (car) {
          let leftWheels = leftWheelsRef.current;
          let rightWheels = rightWheelsRef.current;

          if (leftWheels.length === 0 && rightWheels.length === 0) {
            const wheels = scene.meshes.filter(m => m.name.startsWith('wheel'));
            if (wheels.length >= 4) {
              leftWheels = [wheels[0], wheels[2]];
              rightWheels = [wheels[1], wheels[3]];
            }
          }

          physicsManager.setupCarPhysics(car, leftWheels, rightWheels);
        }

        // Add ground physics - STATIC BOX
        const groundMesh = scene.getMeshByName('ground');
        if (groundMesh) {
          new BABYLON.PhysicsAggregate(
            groundMesh,
            BABYLON.PhysicsShapeType.BOX,
            {
              mass: 0,              // STATIC (infinite mass)
              restitution: 0.0,
              friction: 1.0
            },
            scene
          );
        }

        setPhysicsActive(true);
      } catch (error) {
        console.error('Physics initialization error:', error);
        setPhysicsActive(false);
      }
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

  return {
    sceneRef,
    engineRef,
    cameraRef,
    carRef,
    leftWheelsRef,
    rightWheelsRef,
    frontWheelRef,
    physicsManagerRef,
    gridLinesRef,
    carStateRef,
    initialPositionRef,
    initialRotationRef,
    isWebGPU,
    sceneLoaded,
    physicsActive,
  };
}
