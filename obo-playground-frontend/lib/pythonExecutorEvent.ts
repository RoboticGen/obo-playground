/**
 * Event-Driven Python Executor
 * Manages Python code execution via event-based messaging with worker
 */

import { getCarEventBus } from './carEventBus';
import { CarEvent } from './carEvents';
import MessageQueue, { WorkerMessage } from './messageQueue';
import { getErrorHandler } from './errorHandler';

interface WorkerRequest<T = any> {
  id: string;
  type: 'init' | 'execute' | 'sensor-update' | 'ping' | 'terminate';
  payload?: T;
}

/**
 * Manages Python execution via event-driven worker
 */
class EventDrivenPythonExecutor {
  private worker: Worker | null = null;
  private messageQueue: MessageQueue;
  private eventBus = getCarEventBus();
  private errorHandler = getErrorHandler();
  private isInitialized = false;
  private isExecuting = false; // Prevent concurrent executions
  private executionTimeout = 30000; // 30 seconds

  constructor() {
    this.messageQueue = new MessageQueue({
      timeout: this.executionTimeout,
      onError: (error) => {
        this.errorHandler.handle(error, {
          source: 'worker',
          severity: 'warning',
        });
      },
    });
  }

  /**
   * Initialize the worker and establish event connection
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      try {
        // Create worker
        this.worker = new Worker(
          new URL('../public/workers/pyodide-event.worker.ts', import.meta.url),
          { type: 'module' }
        );

        this.worker.onerror = (error: ErrorEvent) => {
          this.errorHandler.handle(new Error(error.message), {
            source: 'worker',
            severity: 'critical',
            context: { filename: error.filename, lineno: error.lineno },
          });
          reject(error);
        };

        // Setup event handler
        this.worker.onmessage = (event: MessageEvent) => {
          this.handleWorkerMessage(event.data);
        };

        // Set initialization timeout (increased to 60s for Pyodide CDN download)
        const initTimeout = setTimeout(() => {
          reject(new Error('Worker initialization timeout - Pyodide CDN may be slow or unreachable'));
        }, 60000);

        // Listen for successful initialization
        const unsubscribe = this.eventBus.once('execution:started', async () => {
          clearTimeout(initTimeout);
          
          // Try to send obocar.py content as fallback
          try {
            const response = await fetch('/obocar.py');
            if (response.ok) {
              const code = await response.text();
              const loadRequest: WorkerRequest = {
                id: `load_${Date.now()}`,
                type: 'load-module',
                payload: { code },
              };
              this.worker!.postMessage(loadRequest);
            }
          } catch (error) {
            console.warn('[pythonExecutorEvent] Could not preload obocar.py:', error);
          }
          
          this.isInitialized = true;
          unsubscribe();
          resolve();
        });

        // Send init message
        const initMessage: WorkerRequest = {
          id: 'init',
          type: 'init',
        };
        this.worker.postMessage(initMessage);
      } catch (error: any) {
        reject(new Error(`Failed to create worker: ${error.message}`));
      }
    });
  }

  /**
   * Handle messages from worker
   */
  private handleWorkerMessage(message: any): void {
    const { type, payload, timestamp } = message;

    if (type === 'event' && payload) {
      // Emit the event to the event bus
      const eventToEmit = {
        ...payload,
        timestamp: payload.timestamp || timestamp || Date.now(),
      };

      // Debug log for state changes
      if (payload.type === 'state:changed') {
        console.log('[pythonExecutorEvent] State changed:', eventToEmit);
      }

      this.eventBus.emit(eventToEmit);

      // Resolve pending request if this is a completion event
      if (payload.type === 'execution:completed' || payload.type === 'error:occurred') {
        // Message queue will handle cleanup via timeout
      }
    }
  }

  /**
   * Execute Python code
   */
  async executeCode(code: string): Promise<void> {
    if (!this.worker || !this.isInitialized) {
      throw new Error('Executor not initialized. Call initialize() first.');
    }

    // Prevent concurrent executions
    if (this.isExecuting) {
      throw new Error('Code is already executing. Please wait for it to complete.');
    }

    this.isExecuting = true;

    const executionId = `exec_${Date.now()}_${Math.random()}`;

    try {
      return await new Promise((resolve, reject) => {
        // Register pending request with timeout
        const unregister = this.messageQueue.registerRequest(
          executionId,
          resolve,
          reject
        );

        // Listen for completion (one-time listener)
        const unsubscribeComplete = this.eventBus.once('execution:completed', () => {
          unregister();
          resolve();
        });

        // Listen for errors (one-time listener)
        const unsubscribeError = this.eventBus.once('error:occurred', (event) => {
          unregister();
          unsubscribeError();
          unsubscribeComplete();
          reject(new Error(event.message));
        });

        // Send execution request
        const request: WorkerRequest = {
          id: executionId,
          type: 'execute',
          payload: { code },
        };

        this.worker!.postMessage(request);
      });
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * Update sensor values in Python
   */
  updateSensorValues(front: number, left: number, right: number): void {
    if (!this.worker || !this.isInitialized) return;

    const request: WorkerRequest = {
      id: `sensor_${Date.now()}`,
      type: 'sensor-update',
      payload: { front, left, right },
    };

    this.worker.postMessage(request);
  }

  /**
   * Subscribe to event bus events with typing
   */
  onEvent(eventType: any, handler: (event: any) => void | Promise<void>): () => void {
    return this.eventBus.on(eventType, handler as any);
  }

  /**
   * Subscribe to one event with typing
   */
  onceEvent(eventType: any, handler: (event: any) => void | Promise<void>): () => void {
    return this.eventBus.once(eventType, handler);
  }

  /**
   * Terminate the executor
   */
  terminate(): void {
    if (this.worker) {
      const request: WorkerRequest = {
        id: 'terminate',
        type: 'terminate',
      };
      this.worker.postMessage(request);
      this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }

    this.messageQueue.clear();
  }

  /**
   * Check if executor is ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

// Singleton instance
let executorInstance: EventDrivenPythonExecutor | null = null;

/**
 * Get the singleton executor instance
 */
export async function getPythonExecutor(): Promise<EventDrivenPythonExecutor> {
  if (!executorInstance) {
    executorInstance = new EventDrivenPythonExecutor();
    await executorInstance.initialize();
  }
  return executorInstance;
}

/**
 * Terminate executor and cleanup
 */
export function terminatePythonExecutor(): void {
  if (executorInstance) {
    executorInstance.terminate();
    executorInstance = null;
  }
}

export default getPythonExecutor;
