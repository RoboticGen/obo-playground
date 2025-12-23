import { useCallback } from 'react';
import * as BABYLON from '@babylonjs/core';
import { ArcRotateCamera, AbstractMesh, Scene } from '@babylonjs/core';

interface UseCameraProps {
  cameraRef: React.MutableRefObject<ArcRotateCamera | null>;
  carRef: React.MutableRefObject<AbstractMesh | null>;
  sceneRef: React.MutableRefObject<Scene | null>;
}

export function useCamera({ cameraRef, carRef, sceneRef }: UseCameraProps) {
  const focusOnCar = useCallback(() => {
    const camera = cameraRef.current;
    const car = carRef.current;
    if (!camera || !car) return;

    const targetPosition = car.position.clone();
    const animationTarget = new BABYLON.Animation(
      'camTargetAnim',
      'target',
      60,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    animationTarget.setKeys([
      { frame: 0, value: camera.target.clone() },
      { frame: 30, value: targetPosition },
    ]);

    camera.animations = [animationTarget];
    sceneRef.current?.beginAnimation(camera, 0, 30, false);
  }, [cameraRef, carRef, sceneRef]);

  return { focusOnCar };
}
