/**
 * Playground Page
 * Main coding interface with Python code editor and 3D robot visualization
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import CodeEditor from '@/components/CodeEditor';
import ConnectionStatusComponent from '@/components/ConnectionStatus';
import Notification, { NotificationContainer, NotificationType } from '@/components/Notification';
import { connectionMonitor, ConnectionStatus as ConnStatus } from '@/lib/connectionMonitor';
import { indexedDBService } from '@/lib/indexedDB';
import { Environment } from '@/lib/environmentsApi';
import {
  useProjectLoader,
  useCodeExecution,
  useAutoSave,
  useNotifications,
  useSplitPanel,
} from '@/lib/hooks';
import { DEFAULT_SPLIT_PANEL_WIDTH } from '@/lib/constants';

/**
 * Babylon 3D Scene Component
 * Loaded dynamically to avoid SSR issues
 */
const BabylonScene = dynamic(() => import('@/components/BabylonScene'), {
  ssr: false,
  loading: () => <SceneLoadingSpinner />,
});

/**
 * Loading spinner component for 3D engine initialization
 */
function SceneLoadingSpinner() {
  return (
    <div className="flex h-full items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
        <p className="text-lg text-white">Loading 3D Engine...</p>
      </div>
    </div>
  );
}

/**
 * Main Playground Page Component
 */
export default function PlaygroundPage() {
  const params = useParams();
  const projectId = params?.id as string;

  // =========================================================================
  // State Management - Using Custom Hooks
  // =========================================================================

  // Project and code loading
  const { code, setCode, codeRef, project, isLoading } = useProjectLoader(projectId);

  // Code execution
  const { isRunning, currentLine, output, carState, executeCode, addOutput, clearOutput } =
    useCodeExecution();

  // Auto-save management
  const { lastSaved } = useAutoSave(projectId, code);

  // UI notifications
  const { notifications, addNotification, removeNotification } = useNotifications();

  // Split panel resizing
  const { leftPanelWidth, containerRef, handleMouseDown } = useSplitPanel(
    DEFAULT_SPLIT_PANEL_WIDTH
  );

  // Local UI state
  const [showConsole, setShowConsole] = useState(true);
  const [projectEnvironment, setProjectEnvironment] = useState<Environment | undefined>(undefined);
  const [connectionStatus, setConnectionStatus] = useState<ConnStatus>('checking');
  const [isPyodideReady, setIsPyodideReady] = useState(false);

  // =========================================================================
  // Effect Hooks - Initialize Environment
  // =========================================================================

  /**
   * Load project environment on mount
   */
  useEffect(() => {
    if (project?.environment) {
      setProjectEnvironment(project.environment as Environment);
      addOutput(`Loaded environment: ${project.environment.environment_name}`, 'success');
    }
  }, [project]);

  /**
   * Initialize Pyodide Python runtime
   */
  useEffect(() => {
    const initPyodide = async () => {
      try {
        addOutput('Initializing Python runtime...', 'info');
        const { getPythonExecutor } = await import('@/lib/pythonExecutor');
        await getPythonExecutor();
        setIsPyodideReady(true);
        addOutput('Python runtime ready! ✅', 'success');
      } catch (error: any) {
        console.error('Pyodide initialization error:', error);
        addOutput(`Failed to initialize Python: ${error.message}`, 'error');
        setIsPyodideReady(false);
      }
    };

    initPyodide();
  }, [addOutput]);

  /**
   * Initialize connection monitoring
   */
  useEffect(() => {
    connectionMonitor.init();

    const unsubscribe = connectionMonitor.subscribe((status) => {
      const prevStatus = connectionStatus;
      setConnectionStatus(status);

      // Show notification on status change
      if (prevStatus !== 'checking' && prevStatus !== status) {
        if (status === 'online') {
          addNotification('success', 'Back Online', 'Connection restored.');
        } else if (status === 'offline') {
          addNotification('warning', 'Offline Mode', 'Changes will sync when back online.');
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [connectionStatus, addNotification]);

  /**
   * Prevent data loss on page unload
   */
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (codeRef.current) {
        indexedDBService.saveCode(projectId, codeRef.current, true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [projectId]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      connectionMonitor.destroy();
    };
  }, []);

  // =========================================================================
  // Event Handlers
  // =========================================================================

  /**
   * Handle code execution request
   */
  const handleRunCode = useCallback(async () => {
    if (!isPyodideReady) {
      addOutput('Python runtime is still loading, please wait...', 'error');
      return;
    }

    clearOutput();
    addOutput('Starting execution...', 'info');
    await executeCode(code);
  }, [code, isPyodideReady, executeCode, addOutput, clearOutput]);

  /**
   * Handle stop execution request
   */
  const handleStopExecution = useCallback(() => {
    // Note: Full stop requires more work on the executor
    addOutput('Execution stopped by user', 'info');
  }, [addOutput]);

  /**
   * Reset car to initial state
   */
  const handleResetCar = useCallback(() => {
    window.dispatchEvent(new CustomEvent('resetCar'));
    addOutput('Car reset to initial position', 'success');
  }, [addOutput]);

  // =========================================================================
  // Render
  // =========================================================================

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-700 border-t-transparent"></div>
          <p className="text-lg font-semibold text-white">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-black">
      {/* Header */}
      <PlaygroundHeader
        projectId={projectId}
        carState={carState}
        lastSaved={lastSaved}
        isPyodideReady={isPyodideReady}
        isRunning={isRunning}
        onStop={handleStopExecution}
        onReset={handleResetCar}
      />

      {/* Main Content */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        {/* 3D Scene Panel */}
        <div className="flex flex-col" style={{ width: `${leftPanelWidth}%` }}>
          <div className="flex h-12 items-center justify-between border-b border-neutral-900 bg-neutral-950 px-4">
            <span className="font-semibold text-white">
              3D Simulation {projectEnvironment && `- ${projectEnvironment.environment_name}`}
            </span>
            <div className="flex gap-4 text-xs text-neutral-400">
              <span>Front: {carState.frontDistance.toFixed(1)}cm</span>
              <span>Left: {carState.leftDistance.toFixed(1)}cm</span>
              <span>Right: {carState.rightDistance.toFixed(1)}cm</span>
            </div>
          </div>
          <div className="flex-1">
            <BabylonScene carState={carState} environment={projectEnvironment} />
          </div>
        </div>

        {/* Resizable Divider */}
        <ResizableDivider onMouseDown={handleMouseDown} />

        {/* Code Editor Panel */}
        <div className="flex flex-col" style={{ width: `${100 - leftPanelWidth}%` }}>
          <div className="flex h-12 items-center justify-between border-b border-neutral-900 bg-neutral-950 px-4">
            <span className="font-semibold text-white">Python Code</span>
            {isRunning && currentLine && (
              <span className="text-sm text-yellow-400">Line {currentLine}</span>
            )}
          </div>

          <div className={showConsole ? 'h-2/3' : 'flex-1'}>
            {!isPyodideReady && <PyodideInitializingOverlay />}
            <CodeEditor
              value={code}
              onChange={setCode}
              onRun={handleRunCode}
              isRunning={isRunning || !isPyodideReady}
              currentLine={currentLine}
            />
          </div>

          {/* Console Toggle Button */}
          {!showConsole && <ConsoleToggleButton onClick={() => setShowConsole(true)} />}

          {/* Console Output */}
          {showConsole && (
            <ConsolePanel
              output={output}
              isRunning={isRunning}
              onClear={clearOutput}
              onStop={handleStopExecution}
              onToggle={() => setShowConsole(false)}
            />
          )}
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar isRunning={isRunning} isPyodideReady={isPyodideReady} />

      {/* Notifications */}
      <NotificationContainer>
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            type={notification.type}
            title={notification.title}
            message={notification.message}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </NotificationContainer>
    </div>
  );
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Playground Header Component
 */
interface PlaygroundHeaderProps {
  projectId: string;
  carState: any;
  lastSaved: Date | null;
  isPyodideReady: boolean;
  isRunning: boolean;
  onStop: () => void;
  onReset: () => void;
}

function PlaygroundHeader({
  projectId,
  carState,
  lastSaved,
  isPyodideReady,
  isRunning,
  onStop,
  onReset,
}: PlaygroundHeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-neutral-900 bg-black px-6">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-neutral-900 p-1.5">
          <img src="/logo.ico" alt="OBO" className="h-full w-full object-contain" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">OBO Playground</h1>
          <p className="text-xs text-neutral-500">Project: {projectId.substring(0, 8)}...</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Auto-save Status */}
        <SaveStatusIndicator lastSaved={lastSaved} />

        {/* Connection Status */}
        <ConnectionStatusComponent />

        {/* Motor Indicators */}
        <MotorSpeedIndicators leftSpeed={carState.leftMotorSpeed} rightSpeed={carState.rightMotorSpeed} />

        {/* Pyodide Status */}
        {!isPyodideReady && <PyodideStatusBadge />}

        {/* Stop Button */}
        {isRunning && (
          <button
            onClick={onStop}
            className="rounded-sm border border-red-900 bg-red-950 px-4 py-2 text-sm font-bold text-red-400 transition-colors hover:bg-red-900/50"
          >
            ⏹ Stop
          </button>
        )}

        {/* Reset Button */}
        <button
          onClick={onReset}
          className="rounded-sm border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-neutral-700 hover:bg-neutral-900"
        >
          🔄 Reset
        </button>
      </div>
    </header>
  );
}

/**
 * Save Status Indicator Component
 */
function SaveStatusIndicator({ lastSaved }: { lastSaved: Date | null }) {
  return (
    <div className="flex items-center gap-2 text-xs text-neutral-400">
      {lastSaved ? (
        <>
          <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Saved {lastSaved.toLocaleTimeString()}</span>
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
          </svg>
          <span>Auto-save enabled</span>
        </>
      )}
    </div>
  );
}

/**
 * Motor Speed Indicators Component
 */
function MotorSpeedIndicators({ leftSpeed, rightSpeed }: { leftSpeed: number; rightSpeed: number }) {
  return (
    <div className="flex gap-4 text-sm">
      <MotorSpeedBar label="Left" speed={leftSpeed} />
      <MotorSpeedBar label="Right" speed={rightSpeed} />
    </div>
  );
}

/**
 * Individual Motor Speed Bar
 */
function MotorSpeedBar({ label, speed }: { label: string; speed: number }) {
  const percentage = (speed / 512) * 100;
  return (
    <div className="flex items-center gap-2">
      <span className="text-neutral-400">{label}:</span>
      <div className="flex h-6 w-24 items-center rounded-sm border border-neutral-800 bg-neutral-950">
        <div className="h-full rounded-sm bg-blue-700 transition-all" style={{ width: `${percentage}%` }}></div>
        <span className="ml-2 text-xs text-white">{speed}</span>
      </div>
    </div>
  );
}

/**
 * Pyodide Status Badge
 */
function PyodideStatusBadge() {
  return (
    <div className="flex items-center gap-2 rounded-sm border border-yellow-900/50 bg-yellow-950/20 px-3 py-2 text-sm text-yellow-400">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent"></div>
      Initializing Python...
    </div>
  );
}

/**
 * Resizable Divider Component
 */
function ResizableDivider({ onMouseDown }: { onMouseDown: () => void }) {
  return (
    <div
      onMouseDown={onMouseDown}
      className="group relative w-1 cursor-col-resize bg-neutral-900 transition-colors hover:bg-blue-700"
    >
      <div className="absolute inset-y-0 -left-1 -right-1" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-neutral-700 px-0.5 py-4 opacity-0 transition-opacity group-hover:opacity-100">
        <svg className="h-4 w-2 text-white" fill="currentColor" viewBox="0 0 8 16">
          <circle cx="2" cy="4" r="1" />
          <circle cx="6" cy="4" r="1" />
          <circle cx="2" cy="8" r="1" />
          <circle cx="6" cy="8" r="1" />
          <circle cx="2" cy="12" r="1" />
          <circle cx="6" cy="12" r="1" />
        </svg>
      </div>
    </div>
  );
}

/**
 * Console Toggle Button
 */
function ConsoleToggleButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="border-t border-neutral-900 bg-neutral-950 px-4 py-2">
      <button
        onClick={onClick}
        className="flex w-full items-center justify-center gap-2 rounded-sm py-1.5 text-sm text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
        Show Console
      </button>
    </div>
  );
}

/**
 * Console Panel Component
 */
interface ConsolePanelProps {
  output: string[];
  isRunning: boolean;
  onClear: () => void;
  onStop: () => void;
  onToggle: () => void;
}

function ConsolePanel({ output, isRunning, onClear, onStop, onToggle }: ConsolePanelProps) {
  return (
    <div className="flex h-1/3 flex-col border-t border-neutral-900 bg-black">
      <div className="flex h-10 items-center justify-between border-b border-neutral-900 bg-neutral-950 px-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">Console Output</span>
          <button
            onClick={onToggle}
            className="rounded-sm p-1 text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        <div className="flex gap-2">
          {isRunning && (
            <button
              onClick={onStop}
              className="rounded-sm bg-red-950 px-3 py-1 text-xs font-semibold text-red-400 hover:bg-red-900/50"
            >
              Stop
            </button>
          )}
          <button
            onClick={onClear}
            className="rounded-sm bg-neutral-900 px-3 py-1 text-xs font-semibold text-white hover:bg-neutral-800"
          >
            Clear
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs">
        {output.length === 0 ? (
          <p className="text-neutral-500">No output yet. Run your code to see results here.</p>
        ) : (
          output.map((line, index) => (
            <div
              key={index}
              className={`mb-1 ${line.includes('❌') ? 'text-red-400' : line.includes('✅') ? 'text-green-400' : 'text-neutral-300'}`}
            >
              {line}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Pyodide Initializing Overlay
 */
function PyodideInitializingOverlay() {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-700 border-t-transparent"></div>
        <p className="text-lg font-semibold text-white">Loading Python Runtime...</p>
        <p className="mt-2 text-sm text-neutral-400">This may take a moment on first load</p>
      </div>
    </div>
  );
}

/**
 * Status Bar Component
 */
function StatusBar({ isRunning, isPyodideReady }: { isRunning: boolean; isPyodideReady: boolean }) {
  const status = isRunning ? '🟢 Running' : isPyodideReady ? '⚪ Ready' : '🟡 Initializing...';

  return (
    <div className="flex h-8 items-center justify-between border-t border-neutral-900 bg-neutral-950 px-4 text-xs text-neutral-400">
      <span>Status: {status}</span>
      <span>Python Runtime: Pyodide (WebAssembly)</span>
    </div>
  );
}
