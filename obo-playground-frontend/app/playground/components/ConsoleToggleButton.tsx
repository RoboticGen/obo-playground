/**
 * Console Toggle Button Component
 * Shows button to expand collapsed console
 */

import React from 'react';
import { PLAYGROUND_CONSTANTS } from '../constants';

interface ConsoleToggleButtonProps {
  onClick: () => void;
}

export default function ConsoleToggleButton({ onClick }: ConsoleToggleButtonProps) {
  return (
    <div className="border-t border-neutral-900 bg-neutral-950 px-4 py-2">
      <button
        onClick={onClick}
        className="flex w-full items-center justify-center gap-2 rounded-sm py-1.5 text-sm text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white"
        aria-label="Show console"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
        {PLAYGROUND_CONSTANTS.MESSAGES.SHOW_CONSOLE}
      </button>
    </div>
  );
}
