/**
 * Playground Page
 * Main coding interface with Python code editor and 3D robot visualization
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Notification, { NotificationContainer, NotificationType } from '@/components/Notification';
import { connectionMonitor, ConnectionStatus as ConnStatus } from '@/lib/connectionMonitor';
import { indexedDBService } from '@/lib/indexedDB';
import { Environment } from '@/lib/environmentsApi';
import {
  useProjectLoader,
  useAutoSave,
  useNotifications,
  useSplitPanel,
} from '@/lib/hooks';
import { useCodeExecutionEvent } from '@/lib/useCodeExecutionEvent';
import { DEFAULT_SPLIT_PANEL_WIDTH } from '@/lib/constants';
import { PLAYGROUND_CONSTANTS } from '../constants';
import PlaygroundHeader from '../components/PlaygroundHeader';
import ScenePanel from '../components/ScenePanel';
import CodeEditorPanel from '../components/CodeEditorPanel';
import ResizableDivider from '../components/ResizableDivider';
import StatusBar from '../components/StatusBar';
import SceneLoadingSpinner from '../components/SceneLoadingSpinner';
import ProjectLoadingSpinner from '../components/ProjectLoadingSpinner';

/**
 * Babylon 3D Scene Component
 * Loaded dynamically to avoid SSR issues
 */
const BabylonScene = dynamic(() => import('@/components/BabylonScene'), {
  ssr: false,
  loading: () => <SceneLoadingSpinner />,
});

/**
 * Main Playground Page Component
 */
export default function PlaygroundPage() {
  const params = useParams();
  const projectId = params?.id as string;

  // State Management
  const { code, setCode, codeRef, project, isLoading } = useProjectLoader(projectId);
  const { isRunning, currentLine, output, carState, executeCode, addOutput, clearOutput } =
    useCodeExecutionEvent();
  const { lastSaved } = useAutoSave(projectId, code);
  const { notifications, addNotification, removeNotification } = useNotifications();
  const { leftPanelWidth, containerRef, handleMouseDown } = useSplitPanel(
    DEFAULT_SPLIT_PANEL_WIDTH
  );

  // UI State
  const [showConsole, setShowConsole] = useState(true);
  const [projectEnvironment, setProjectEnvironment] = useState<Environment | undefined>(undefined);
  const [connectionStatus, setConnectionStatus] = useState<ConnStatus>('checking');
  const [isPyodideReady, setIsPyodideReady] = useState(false);

  // Effects
  useInitializeProjectEnvironment(project, addOutput, setProjectEnvironment);
  useInitializePyodide(addOutput, setIsPyodideReady);
  useInitializeConnectionMonitor(connectionStatus, addNotification, setConnectionStatus);
  usePreventDataLoss(projectId, codeRef);
  useCleanupOnUnmount();

  // Event Handlers
  const handleRunCode = useCallback(async () => {
    if (!isPyodideReady) {
      addOutput(PLAYGROUND_CONSTANTS.MESSAGES.PYTHON_NOT_READY, 'error');
      return;
    }
    clearOutput();
    addOutput(PLAYGROUND_CONSTANTS.MESSAGES.CODE_EXECUTING, 'info');
    await executeCode(code);
  }, [code, isPyodideReady, executeCode, addOutput, clearOutput]);

  const handleStopExecution = useCallback(() => {
    addOutput(PLAYGROUND_CONSTANTS.MESSAGES.CODE_STOPPED, 'info');
  }, [addOutput]);

  const handleResetCar = useCallback(() => {
    window.dispatchEvent(new CustomEvent('resetCar'));
    addOutput(PLAYGROUND_CONSTANTS.MESSAGES.CAR_RESET, 'success');
  }, [addOutput]);

  // Render
  if (isLoading) {
    return <ProjectLoadingSpinner />;
  }

  const scenePanelWidth = `${leftPanelWidth}%`;
  const editorPanelWidth = `${100 - leftPanelWidth}%`;

  return (
    <div className="flex h-screen flex-col bg-black">
      <PlaygroundHeader
        projectId={projectId}
        carState={carState}
        lastSaved={lastSaved}
        isPyodideReady={isPyodideReady}
        isRunning={isRunning}
        onStop={handleStopExecution}
        onReset={handleResetCar}
      />

      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        <ScenePanel
          width={scenePanelWidth}
          carState={carState}
          environment={projectEnvironment}
        />

        <ResizableDivider onMouseDown={handleMouseDown} />

        <CodeEditorPanel
          width={editorPanelWidth}
          code={code}
          onCodeChange={setCode}
          onRunCode={handleRunCode}
          isRunning={isRunning}
          currentLine={currentLine}
          isPyodideReady={isPyodideReady}
          showConsole={showConsole}
          onToggleConsole={setShowConsole}
          output={output}
          onClearOutput={clearOutput}
          onStopExecution={handleStopExecution}
        />
      </div>

      <StatusBar isRunning={isRunning} isPyodideReady={isPyodideReady} />

      <NotificationContainer>
        {notifications.map((notification: any) => (
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
// Custom Hooks for Effect Organization
// ============================================================================

/**
 * Initialize project environment when project loads
 */
function useInitializeProjectEnvironment(
  project: any,
  addOutput: (message: string, type?: NotificationType) => void,
  setProjectEnvironment: (env: Environment) => void
) {
  useEffect(() => {
    if (project?.environment) {
      setProjectEnvironment(project.environment as Environment);
      addOutput(
        `${PLAYGROUND_CONSTANTS.MESSAGES.ENVIRONMENT_LOADED} ${project.environment.environment_name}`,
        'success'
      );
    }
  }, [project, addOutput, setProjectEnvironment]);
}

/**
 * Initialize Pyodide Python runtime
 */
function useInitializePyodide(
  addOutput: (message: string, type?: NotificationType) => void,
  setIsPyodideReady: (ready: boolean) => void
) {
  useEffect(() => {
    const initPyodide = async () => {
      try {
        addOutput(PLAYGROUND_CONSTANTS.MESSAGES.PYTHON_LOADING, 'info');
        const { getPythonExecutor } = await import('@/lib/pythonExecutorEvent');
        await getPythonExecutor();
        setIsPyodideReady(true);
        addOutput(PLAYGROUND_CONSTANTS.MESSAGES.PYTHON_INITIALIZED, 'success');
      } catch (error: any) {
        console.error('Pyodide initialization error:', error);
        addOutput(
          `${PLAYGROUND_CONSTANTS.MESSAGES.PYTHON_FAILED}: ${error.message}`,
          'error'
        );
        setIsPyodideReady(false);
      }
    };

    initPyodide();
  }, [addOutput, setIsPyodideReady]);
}

/**
 * Initialize connection status monitoring
 */
function useInitializeConnectionMonitor(
  connectionStatus: ConnStatus,
  addNotification: (type: NotificationType, title: string, message: string) => void,
  setConnectionStatus: (status: ConnStatus) => void
) {
  useEffect(() => {
    connectionMonitor.init();

    const unsubscribe = connectionMonitor.subscribe((status) => {
      const prevStatus = connectionStatus;
      setConnectionStatus(status);

      if (prevStatus !== 'checking' && prevStatus !== status) {
        if (status === 'online') {
          addNotification(
            'success',
            PLAYGROUND_CONSTANTS.MESSAGES.BACK_ONLINE,
            PLAYGROUND_CONSTANTS.MESSAGES.CONNECTION_RESTORED
          );
        } else if (status === 'offline') {
          addNotification(
            'warning',
            PLAYGROUND_CONSTANTS.MESSAGES.OFFLINE_MODE,
            PLAYGROUND_CONSTANTS.MESSAGES.SYNC_ON_RESTORE
          );
        }
      }
    });

    return () => unsubscribe();
  }, [connectionStatus, addNotification, setConnectionStatus]);
}

/**
 * Prevent data loss when user leaves page
 */
function usePreventDataLoss(projectId: string, codeRef: React.MutableRefObject<string>) {
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (codeRef.current) {
        indexedDBService.saveCode(projectId, codeRef.current, true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [projectId, codeRef]);
}

/**
 * Cleanup connection monitor on unmount
 */
function useCleanupOnUnmount() {
  useEffect(() => {
    return () => {
      connectionMonitor.destroy();
    };
  }, []);
}
