/**
 * Motor Speed Indicators Component
 * Displays real-time motor speed visualization
 */

import React from 'react';
import { PLAYGROUND_CONSTANTS } from '../constants';

interface MotorSpeedIndicatorsProps {
  leftSpeed: number;
  rightSpeed: number;
}

export default function MotorSpeedIndicators({ leftSpeed, rightSpeed }: MotorSpeedIndicatorsProps) {
  return (
    <div className="flex gap-4 text-sm">
      <MotorSpeedBar label="Left" speed={leftSpeed} />
      <MotorSpeedBar label="Right" speed={rightSpeed} />
    </div>
  );
}

/**
 * Individual Motor Speed Bar Component
 */
interface MotorSpeedBarProps {
  label: string;
  speed: number;
}

function MotorSpeedBar({ label, speed }: MotorSpeedBarProps) {
  const percentage = (speed / PLAYGROUND_CONSTANTS.MOTOR_MAX_SPEED) * 100;
  const displayPercentage = Math.min(100, Math.max(0, percentage));

  return (
    <div className="flex items-center gap-2">
      <span className="text-neutral-400">{label}:</span>
      <div className="flex h-6 w-24 items-center rounded-sm border border-neutral-800 bg-neutral-950 overflow-hidden">
        <div
          className="h-full bg-blue-700 transition-all duration-200"
          style={{ width: `${displayPercentage}%` }}
          aria-label={`${label} motor speed`}
        />
        <span className="ml-2 text-xs text-white">{speed}</span>
      </div>
    </div>
  );
}
