/**
 * Event-Driven Code Execution Hook
 * Uses the event-driven executor with proper event handling
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { getPythonExecutor } from './pythonExecutorEvent';
import { getCarEventBus } from './carEventBus';
import { getErrorHandler } from './errorHandler';
import type { CarState } from './executionTypes';

/**
 * Hook for executing Python code with event-driven architecture
 * Provides cleaner event handling compared to callback-based approach
 */
export function useCodeExecutionEvent() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentLine, setCurrentLine] = useState<number | undefined>(undefined);
  const [output, setOutput] = useState<string[]>([]);
  const [carState, setCarState] = useState<CarState>({
    leftMotorSpeed: 0,
    rightMotorSpeed: 0,
    leftMotorDirection: 0,
    rightMotorDirection: 0,
    frontDistance: 100,
    leftDistance: 100,
    rightDistance: 100,
  });
  const [executionError, setExecutionError] = useState<string | null>(null);

  const executorRef = useRef<any>(null);
  const eventBusRef = useRef(getCarEventBus());
  const unsubscribesRef = useRef<(() => void)[]>([]);

  // Define callbacks first (before useEffect that uses them)
  const addOutput = useCallback((message: string, type: 'info' | 'error' | 'success' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '📝';
    setOutput((prev) => [...prev, `[${timestamp}] ${prefix} ${message}`]);
  }, []);

  const clearOutput = useCallback(() => {
    setOutput([]);
  }, []);

  // Setup event subscriptions
  useEffect(() => {
    const setupSubscriptions = async () => {
      try {
        const executor = await getPythonExecutor();
        executorRef.current = executor;

        // Subscribe to events
        const unsubs = [
          executor.onEvent('execution:line', (event) => {
            setCurrentLine(event.lineNumber);
          }),

          executor.onEvent('execution:output', (event) => {
            addOutput(event.message, 'info');
          }),

          executor.onEvent('state:changed', (event) => {
            setCarState({
              leftMotorSpeed: event.leftMotorSpeed,
              rightMotorSpeed: event.rightMotorSpeed,
              leftMotorDirection: event.leftMotorDirection,
              rightMotorDirection: event.rightMotorDirection,
              frontDistance: event.frontDistance,
              leftDistance: event.leftDistance,
              rightDistance: event.rightDistance,
            });
          }),

          executor.onEvent('error:occurred', (event) => {
            setExecutionError(event.message);
            addOutput(event.message, 'error');
          }),
        ];

        unsubscribesRef.current = unsubs;
      } catch (error: any) {
        console.error('[useCodeExecutionEvent] Setup failed:', error);
      }
    };

    setupSubscriptions();

    return () => {
      // Cleanup subscriptions
      unsubscribesRef.current.forEach((unsub) => unsub());
      unsubscribesRef.current = [];
    };
  }, [addOutput]);

  const executeCode = useCallback(
    async (code: string) => {
      try {
        if (!executorRef.current) {
          throw new Error('Executor not initialized');
        }

        setIsRunning(true);
        setExecutionError(null);
        clearOutput();

        await executorRef.current.executeCode(code);
        addOutput('Execution completed', 'success');
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

export type UseCodeExecutionEventReturn = ReturnType<typeof useCodeExecutionEvent>;
