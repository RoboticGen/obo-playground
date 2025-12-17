/**
 * Status Bar Component
 * Displays execution status and runtime information
 */

import React from 'react';
import { PLAYGROUND_CONSTANTS } from '../constants';

interface StatusBarProps {
  isRunning: boolean;
  isPyodideReady: boolean;
}

export default function StatusBar({ isRunning, isPyodideReady }: StatusBarProps) {
  const statusDisplay = isRunning
    ? `${PLAYGROUND_CONSTANTS.STATUS_ICONS.RUNNING} Running`
    : isPyodideReady
      ? `${PLAYGROUND_CONSTANTS.STATUS_ICONS.READY} Ready`
      : `${PLAYGROUND_CONSTANTS.STATUS_ICONS.INITIALIZING} Initializing...`;

  return (
    <div className="flex h-8 items-center justify-between border-t border-neutral-900 bg-neutral-950 px-4 text-xs text-neutral-400">
      <span>Status: {statusDisplay}</span>
      <span>{PLAYGROUND_CONSTANTS.MESSAGES.RUNTIME_STATUS}</span>
    </div>
  );
}
