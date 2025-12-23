import { useEffect } from 'react';
import { AbstractMesh, Vector3 } from '@babylonjs/core';
import { CarState, DEFAULT_CAR_STATE } from '..';

interface UseCarStateProps {
  carState?: CarState;
  sceneLoaded: boolean;
  carStateRef: React.MutableRefObject<CarState>;
  carRef: React.MutableRefObject<AbstractMesh | null>;
  leftWheelsRef: React.MutableRefObject<AbstractMesh[]>;
  rightWheelsRef: React.MutableRefObject<AbstractMesh[]>;
  frontWheelRef: React.MutableRefObject<AbstractMesh | null>;
  initialPositionRef: React.MutableRefObject<Vector3>;
  initialRotationRef: React.MutableRefObject<number>;
}

export function useCarState({
  carState,
  sceneLoaded,
  carStateRef,
  carRef,
  leftWheelsRef,
  rightWheelsRef,
  frontWheelRef,
  initialPositionRef,
  initialRotationRef,
}: UseCarStateProps) {
  // Update car state
  useEffect(() => {
    if (carState && sceneLoaded) {
      carStateRef.current = carState;
    }
  }, [carState, sceneLoaded, carStateRef]);

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
  }, [carRef, leftWheelsRef, rightWheelsRef, frontWheelRef, carStateRef, initialPositionRef, initialRotationRef]);
}
