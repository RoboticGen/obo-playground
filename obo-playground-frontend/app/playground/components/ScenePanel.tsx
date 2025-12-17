/**
 * Scene Panel Component
 * Displays 3D robot visualization
 */

import React from 'react';
import BabylonScene from '@/components/BabylonScene';
import { Environment } from '@/lib/environmentsApi';

interface ScenePanelProps {
  width: string;
  carState: any;
  environment?: Environment;
}

export default function ScenePanel({ width, carState, environment }: ScenePanelProps) {
  return (
    <div className="flex flex-col" style={{ width }}>
      <ScenePanelHeader environment={environment} carState={carState} />
      <div className="flex-1">
        <BabylonScene carState={carState} environment={environment} />
      </div>
    </div>
  );
}

/**
 * Scene Panel Header with Sensor Readings
 */
interface ScenePanelHeaderProps {
  environment?: Environment;
  carState: any;
}

function ScenePanelHeader({ environment, carState }: ScenePanelHeaderProps) {
  const environmentName = environment?.environment_name || 'Default';

  return (
    <div className="flex h-12 items-center justify-between border-b border-neutral-900 bg-neutral-950 px-4">
      <span className="font-semibold text-white">
        3D Simulation - {environmentName}
      </span>
      <div className="flex gap-4 text-xs text-neutral-400">
        <SensorReading label="Front" distance={carState.frontDistance} />
        <SensorReading label="Left" distance={carState.leftDistance} />
        <SensorReading label="Right" distance={carState.rightDistance} />
      </div>
    </div>
  );
}

/**
 * Individual Sensor Reading
 */
function SensorReading({ label, distance }: { label: string; distance: number }) {
  return (
    <span>{label}: {distance.toFixed(1)}cm</span>
  );
}
