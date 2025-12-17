/**
 * Console Panel Component
 * Displays code execution output with controls
 */

import React from 'react';
import { PLAYGROUND_CONSTANTS } from '../constants';

interface ConsolePanelProps {
  output: string[];
  isRunning: boolean;
  onClear: () => void;
  onStop: () => void;
  onToggle: () => void;
}

export default function ConsolePanel({
  output,
  isRunning,
  onClear,
  onStop,
  onToggle,
}: ConsolePanelProps) {
  return (
    <div className="flex h-1/3 flex-col border-t border-neutral-900 bg-black">
      <ConsoleHeader isRunning={isRunning} onClear={onClear} onStop={onStop} onToggle={onToggle} />
      <ConsoleOutput output={output} />
    </div>
  );
}

/**
 * Console Header with Controls
 */
interface ConsoleHeaderProps {
  isRunning: boolean;
  onClear: () => void;
  onStop: () => void;
  onToggle: () => void;
}

function ConsoleHeader({ isRunning, onClear, onStop, onToggle }: ConsoleHeaderProps) {
  return (
    <div className="flex h-10 items-center justify-between border-b border-neutral-900 bg-neutral-950 px-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-white">
          {PLAYGROUND_CONSTANTS.MESSAGES.CONSOLE_LABEL}
        </span>
        <CollapseButton onClick={onToggle} />
      </div>
      <div className="flex gap-2">
        {isRunning && <StopButton onClick={onStop} />}
        <ClearButton onClick={onClear} />
      </div>
    </div>
  );
}

/**
 * Console Output Display
 */
function ConsoleOutput({ output }: { output: string[] }) {
  return (
    <div className="flex-1 overflow-y-auto p-4 font-mono text-xs">
      {output.length === 0 ? (
        <p className="text-neutral-500">{PLAYGROUND_CONSTANTS.MESSAGES.CONSOLE_EMPTY}</p>
      ) : (
        output.map((line, index) => (
          <ConsoleOutputLine key={index} line={line} />
        ))
      )}
    </div>
  );
}

/**
 * Individual Console Output Line
 */
function ConsoleOutputLine({ line }: { line: string }) {
  const getLineColor = (text: string) => {
    if (text.includes('❌')) return 'text-red-400';
    if (text.includes('✅')) return 'text-green-400';
    return 'text-neutral-300';
  };

  return (
    <div className={`mb-1 ${getLineColor(line)}`}>
      {line}
    </div>
  );
}

/**
 * Collapse Button for Console
 */
function CollapseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-sm p-1 text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white"
      aria-label="Collapse console"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}

/**
 * Stop Button for Console
 */
function StopButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-sm bg-red-950 px-3 py-1 text-xs font-semibold text-red-400 hover:bg-red-900/50"
      aria-label="Stop execution"
    >
      Stop
    </button>
  );
}

/**
 * Clear Button for Console
 */
function ClearButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-sm bg-neutral-900 px-3 py-1 text-xs font-semibold text-white hover:bg-neutral-800"
      aria-label="Clear console output"
    >
      Clear
    </button>
  );
}
