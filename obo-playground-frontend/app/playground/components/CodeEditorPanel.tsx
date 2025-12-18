/**
 * Code Editor Panel Component
 * Displays Python code editor with execution controls
 */

import React from 'react';
import CodeEditor from '@/components/CodeEditor';
import ConsolePanel from './ConsolePanel';
import ConsoleToggleButton from './ConsoleToggleButton';
import PyodideInitializingOverlay from './PyodideInitializingOverlay';

interface CodeEditorPanelProps {
  width: string;
  code: string;
  onCodeChange: (code: string) => void;
  onRunCode: () => void;
  isRunning: boolean;
  currentLine?: number;
  isPyodideReady: boolean;
  showConsole: boolean;
  onToggleConsole: (show: boolean) => void;
  output: string[];
  onClearOutput: () => void;
  onStopExecution: () => void;
}

export default function CodeEditorPanel({
  width,
  code,
  onCodeChange,
  onRunCode,
  isRunning,
  currentLine,
  isPyodideReady,
  showConsole,
  onToggleConsole,
  output,
  onClearOutput,
  onStopExecution,
}: CodeEditorPanelProps) {
  return (
    <div className="flex flex-col" style={{ width }}>
      <CodeEditorHeader isRunning={isRunning} currentLine={currentLine} />

      <div className={showConsole ? 'h-2/3' : 'flex-1'}>
        {!isPyodideReady && <PyodideInitializingOverlay />}
        <CodeEditor
          value={code}
          onChange={onCodeChange}
          onRun={onRunCode}
          isRunning={isRunning || !isPyodideReady}
          currentLine={currentLine}
        />
      </div>

      {!showConsole && <ConsoleToggleButton onClick={() => onToggleConsole(true)} />}

      {showConsole && (
        <ConsolePanel
          output={output}
          isRunning={isRunning}
          onClear={onClearOutput}
          onStop={onStopExecution}
          onToggle={() => onToggleConsole(false)}
        />
      )}
    </div>
  );
}

/**
 * Code Editor Panel Header
 */
interface CodeEditorHeaderProps {
  isRunning: boolean;
  currentLine?: number;
}

function CodeEditorHeader({ isRunning, currentLine }: CodeEditorHeaderProps) {
  return (
    <div className="flex h-12 items-center justify-between border-b border-neutral-900 bg-neutral-950 px-4">
      <span className="font-semibold text-white">Python Code</span>
      {isRunning && currentLine && (
        <span className="text-sm text-yellow-400">Line {currentLine}</span>
      )}
    </div>
  );
}
