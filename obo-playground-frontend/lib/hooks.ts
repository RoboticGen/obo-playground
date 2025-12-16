/**
 * Custom React Hooks
 * Reusable logic for the playground and other components
 */

import { useCallback, useState, useRef, useEffect } from 'react';
import {
  getPythonExecutor,
  ExecutionEvent,
  ExecutionEventHandler,
  CarState,
} from '@/lib/pythonExecutor';
import { projectsApi, Project } from '@/lib/api';
import { indexedDBService } from '@/lib/indexedDB';
import { autoSaveService } from '@/lib/autoSave';
import { DEFAULT_CAR_STATE, DEFAULT_CODE, CODE_EXECUTION_TIMEOUT } from '@/lib/constants';

// ============================================================================
// useProjectLoader Hook
// ============================================================================

/**
 * Hook for loading project and code from backend/IndexedDB
 * Handles offline fallback and caching strategies
 */
export function useProjectLoader(projectId: string | undefined) {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [project, setProject] = useState<Project | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const codeRef = useRef(code);

  const loadProject = useCallback(async () => {
    if (!projectId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch project metadata
      const projectData = await projectsApi.getProjectById(projectId);
      setProject(projectData);

      // Try to load code from backend
      try {
        const contentResponse = await projectsApi.getProjectContent(projectId);
        setCode(contentResponse.code);
        codeRef.current = contentResponse.code;

        // Save to IndexedDB for offline access
        await indexedDBService.saveCode(projectId, contentResponse.code, false);
      } catch (backendError) {
        // Fallback to IndexedDB
        console.log('Backend unavailable, using local storage...');
        const localCode = await indexedDBService.getCode(projectId);
        if (localCode) {
          setCode(localCode.code);
          codeRef.current = localCode.code;
        } else {
          setCode(DEFAULT_CODE);
          codeRef.current = DEFAULT_CODE;
        }
      }
    } catch (err) {
      console.error('Failed to load project:', err);
      setError('Failed to load project');

      // Try IndexedDB as last resort
      const localCode = await indexedDBService.getCode(projectId);
      if (localCode) {
        setCode(localCode.code);
        codeRef.current = localCode.code;
      }
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  return { code, setCode, codeRef, project, isLoading, error };
}

// ============================================================================
// useCodeExecution Hook
// ============================================================================

/**
 * Hook for executing Python code with event handling
 * Manages execution state, output, and error handling
 */
export function useCodeExecution() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentLine, setCurrentLine] = useState<number | undefined>(undefined);
  const [output, setOutput] = useState<string[]>([]);
  const [carState, setCarState] = useState<CarState>(DEFAULT_CAR_STATE);
  const [executionError, setExecutionError] = useState<string | null>(null);

  const addOutput = useCallback((message: string, type: 'info' | 'error' | 'success' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '📝';
    setOutput((prev) => [...prev, `[${timestamp}] ${prefix} ${message}`]);
  }, []);

  const clearOutput = useCallback(() => {
    setOutput([]);
  }, []);

  const executeCode = useCallback(
    async (code: string) => {
      try {
        setIsRunning(true);
        setExecutionError(null);
        clearOutput();

        const executor = await getPythonExecutor();

        // Create timeout handler
        let timeoutId: NodeJS.Timeout | null = null;

        const eventHandler: ExecutionEventHandler = (event: ExecutionEvent) => {
          switch (event.type) {
            case 'line':
              setCurrentLine(event.lineNumber);
              break;
            case 'output':
              if (event.message) {
                addOutput(event.message);
              }
              break;
            case 'error':
              setExecutionError(event.message || 'Unknown error');
              addOutput(event.message || 'Unknown error', 'error');
              break;
            case 'state_update':
              if (event.carState) {
                setCarState(event.carState);
              }
              break;
            case 'complete':
              addOutput('Execution completed', 'success');
              break;
          }
        };

        // Set timeout
        timeoutId = setTimeout(() => {
          setExecutionError('Execution timeout');
          addOutput('Code execution timed out', 'error');
        }, CODE_EXECUTION_TIMEOUT);

        await executor.executeCode(code, eventHandler);

        if (timeoutId) clearTimeout(timeoutId);
      } catch (error: any) {
        const errorMessage = error.message || 'Unknown error';
        setExecutionError(errorMessage);
        addOutput(errorMessage, 'error');
      } finally {
        setIsRunning(false);
      }
    },
    [addOutput, clearOutput]
  );

  return {
    isRunning,
    currentLine,
    output,
    carState,
    executionError,
    executeCode,
    addOutput,
    clearOutput,
  };
}

// ============================================================================
// useAutoSave Hook
// ============================================================================

/**
 * Hook for managing auto-save with connection awareness
 */
export function useAutoSave(projectId: string, code: string) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const codeRef = useRef(code);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  useEffect(() => {
    if (!projectId) return;

    const startAutoSave = () => {
      autoSaveService.startAutoSave(code, {
        projectId,
        onSaveToLocal: () => {
          setLastSaved(new Date());
          setIsSaving(false);
        },
      });
    };

    startAutoSave();

    return () => {
      autoSaveService.stopAutoSave(projectId);
    };
  }, [projectId, code]);

  return { lastSaved, isSaving };
}

// ============================================================================
// useNotifications Hook
// ============================================================================

/**
 * Hook for managing toast notifications
 */
export interface NotificationData {
  id: string;
  type: 'info' | 'success' | 'error' | 'warning';
  title: string;
  message?: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const addNotification = useCallback(
    (type: NotificationData['type'], title: string, message?: string) => {
      const id = Date.now().toString();
      setNotifications((prev) => [...prev, { id, type, title, message }]);

      // Auto-remove after 5 seconds
      setTimeout(() => {
        removeNotification(id);
      }, 5000);

      return id;
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return { notifications, addNotification, removeNotification };
}

// ============================================================================
// useSplitPanel Hook
// ============================================================================

/**
 * Hook for managing resizable split panel state
 */
export function useSplitPanel(initialWidth: number = 60) {
  const [leftPanelWidth, setLeftPanelWidth] = useState(initialWidth);
  const isDraggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

      // Clamp between 20% and 80%
      setLeftPanelWidth(Math.max(20, Math.min(80, newWidth)));
    },
    []
  );

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseMove, handleMouseUp]);

  return { leftPanelWidth, setLeftPanelWidth, isDraggingRef, containerRef, handleMouseDown };
}
