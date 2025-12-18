/**
 * Playground Header Component
 * Displays project info, status indicators, and control buttons
 */

import React from 'react';
import ConnectionStatusComponent from '@/components/ConnectionStatus';
import { PLAYGROUND_CONSTANTS } from '../constants';
import SaveStatusIndicator from './SaveStatusIndicator';
import MotorSpeedIndicators from './MotorSpeedIndicators';
import PyodideStatusBadge from './PyodideStatusBadge';

interface PlaygroundHeaderProps {
  projectId: string;
  carState: {
    leftMotorSpeed: number;
    rightMotorSpeed: number;
    [key: string]: unknown;
  };
  lastSaved: Date | null;
  isPyodideReady: boolean;
  isRunning: boolean;
  onStop: () => void;
  onReset: () => void;
}

export default function PlaygroundHeader({
  projectId,
  carState,
  lastSaved,
  isPyodideReady,
  isRunning,
  onStop,
  onReset,
}: PlaygroundHeaderProps) {
  const projectIdDisplay = projectId.substring(0, 8);

  return (
    <header className="flex h-16 items-center justify-between border-b border-neutral-900 bg-black px-6">
      {/* Logo and Title */}
      <ProjectInfo projectIdDisplay={projectIdDisplay} />

      {/* Status and Controls */}
      <HeaderControls
        lastSaved={lastSaved}
        leftMotorSpeed={carState.leftMotorSpeed}
        rightMotorSpeed={carState.rightMotorSpeed}
        isPyodideReady={isPyodideReady}
        isRunning={isRunning}
        onStop={onStop}
        onReset={onReset}
      />
    </header>
  );
}

/**
 * Project Information Section
 */
function ProjectInfo({ projectIdDisplay }: { projectIdDisplay: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-neutral-900 p-1.5">
        <img src="/logo.ico" alt="OBO Logo" className="h-full w-full object-contain" />
      </div>
      <div>
        <h1 className="text-lg font-bold text-white">OBO Playground</h1>
        <p className="text-xs text-neutral-500">Project: {projectIdDisplay}...</p>
      </div>
    </div>
  );
}

/**
 * Header Controls Section
 */
interface HeaderControlsProps {
  lastSaved: Date | null;
  leftMotorSpeed: number;
  rightMotorSpeed: number;
  isPyodideReady: boolean;
  isRunning: boolean;
  onStop: () => void;
  onReset: () => void;
}

function HeaderControls({
  lastSaved,
  leftMotorSpeed,
  rightMotorSpeed,
  isPyodideReady,
  isRunning,
  onStop,
  onReset,
}: HeaderControlsProps) {
  return (
    <div className="flex items-center gap-4">
      <SaveStatusIndicator lastSaved={lastSaved} />
      <ConnectionStatusComponent />
      <MotorSpeedIndicators leftSpeed={leftMotorSpeed} rightSpeed={rightMotorSpeed} />
      
      {!isPyodideReady && <PyodideStatusBadge />}

      {isRunning && (
        <StopButton onClick={onStop} />
      )}

      <ResetButton onClick={onReset} />
    </div>
  );
}

/**
 * Stop Button Component
 */
function StopButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-sm border border-red-900 bg-red-950 px-4 py-2 text-sm font-bold text-red-400 transition-colors hover:bg-red-900/50"
      aria-label="Stop execution"
    >
      ⏹ Stop
    </button>
  );
}

/**
 * Reset Button Component
 */
function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-sm border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-neutral-700 hover:bg-neutral-900"
      aria-label="Reset car position"
    >
      🔄 Reset
    </button>
  );
}
