import { useEffect } from 'react';
import { Scene } from '@babylonjs/core';
import { Environment } from '@/lib/environmentsApi';
import { updateObstacles, updateGroundColor } from '..';

interface UseEnvironmentProps {
  sceneRef: React.MutableRefObject<Scene | null>;
  environment?: Environment;
  sceneLoaded: boolean;
}

export function useEnvironment({ sceneRef, environment, sceneLoaded }: UseEnvironmentProps) {
  useEffect(() => {
    if (!sceneRef.current || !sceneLoaded) return;

    const obstacles = environment?.scene_config?.obstacles || [];
    updateObstacles(sceneRef.current, obstacles);

    if (environment?.scene_config?.groundColor) {
      updateGroundColor(sceneRef.current, environment.scene_config.groundColor);
    }
  }, [environment, sceneLoaded, sceneRef]);
}
