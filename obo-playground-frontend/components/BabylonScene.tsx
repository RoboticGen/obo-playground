'use client';

import { useRef } from 'react';
import { Scene, AbstractMesh } from '@babylonjs/core';
import { Environment } from '@/lib/environmentsApi';
import { CarState } from './babylon';
import {
  useSceneInitialization,
  useCarState,
  useEnvironment,
  useGrid,
  useCamera,
} from './babylon/hooks';
import { SceneControls, CameraControls, LoadingOverlay } from './babylon/ui';

interface BabylonSceneProps {
  onSceneReady?: (scene: Scene, car: AbstractMesh | null) => void;
  carState?: CarState;
  environment?: Environment;
}

export default function BabylonScene({ onSceneReady, carState, environment }: BabylonSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize scene and get all refs
  const {
    sceneRef,
    cameraRef,
    carRef,
    leftWheelsRef,
    rightWheelsRef,
    frontWheelRef,
    gridLinesRef,
    carStateRef,
    initialPositionRef,
    initialRotationRef,
    isWebGPU,
    sceneLoaded,
    physicsActive,
  } = useSceneInitialization({
    canvasRef,
    environment,
    onSceneReady,
  });

  // Handle car state updates and reset
  useCarState({
    carState,
    sceneLoaded,
    carStateRef,
    carRef,
    leftWheelsRef,
    rightWheelsRef,
    frontWheelRef,
    initialPositionRef,
    initialRotationRef,
  });

  // Handle environment updates
  useEnvironment({
    sceneRef,
    environment,
    sceneLoaded,
  });

  // Handle grid visibility
  const { showGrid, setShowGrid } = useGrid({ gridLinesRef });

  // Handle camera controls
  const { focusOnCar } = useCamera({ cameraRef, carRef, sceneRef });

  return (
    <div className="relative h-full w-full">
      <canvas ref={canvasRef} className="h-full w-full outline-none" />

      <SceneControls
        isWebGPU={isWebGPU}
        physicsActive={physicsActive}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
      />

      <CameraControls onFocusOnCar={focusOnCar} />

      <LoadingOverlay isLoading={!sceneLoaded} />
    </div>
  );
}
