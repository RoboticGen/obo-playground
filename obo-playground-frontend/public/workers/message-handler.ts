/**
 * Message handler for worker requests
 */

import type { WorkerRequest, ExecutePayload, SensorPayload, ModulePayload } from './types';
import { initPyodide, getPyodide } from './pyodide-init';
import { executeCode } from './code-executor';
import { updateSensorValues } from './sensor-manager';
import { loadModuleFromMainThread } from './obocar-loader';
import { emitExecutionStarted, emitError } from './events';

/**
 * Handle incoming worker messages
 */
export async function handleMessage(event: MessageEvent<WorkerRequest>): Promise<void> {
  const { id, type, payload } = event.data;
  console.log('[PyodideWorker] RECEIVED MESSAGE:', type, 'id:', id, 'payload:', payload);

  try {
    switch (type) {
      case 'init':
        await handleInit();
        break;

      case 'execute':
        await handleExecute(payload as ExecutePayload, id);
        break;

      case 'load-module':
        await handleLoadModule(payload as ModulePayload);
        break;

      case 'sensor-update':
        handleSensorUpdate(payload as SensorPayload);
        break;

      case 'ping':
        handlePing();
        break;

      case 'terminate':
        handleTerminate();
        break;

      default:
        emitError(`Unknown message type: ${type}`);
    }
  } catch (error: any) {
    emitError(`Worker error: ${error.message}`);
  }
}

/**
 * Handle init request
 */
async function handleInit(): Promise<void> {
  console.log('[PyodideWorker] Processing INIT request');
  await initPyodide();
}

/**
 * Handle execute request
 */
async function handleExecute(payload: ExecutePayload, requestId: string): Promise<void> {
  console.log('[PyodideWorker] Processing EXECUTE request, code length:', payload?.code?.length);
  if (payload?.code) {
    await executeCode(payload.code, requestId);
  }
}

/**
 * Handle load module request
 */
async function handleLoadModule(payload: ModulePayload): Promise<void> {
  if (!payload?.code) return;

  try {
    const pyodide = getPyodide();
    if (!pyodide) {
      throw new Error('Pyodide not initialized');
    }
    await loadModuleFromMainThread(pyodide, payload.code);
  } catch (error: any) {
    console.error('[PyodideWorker] Failed to load module from main thread:', error);
    emitError(`Failed to load module: ${error.message}`);
  }
}

/**
 * Handle sensor update request
 */
function handleSensorUpdate(payload: SensorPayload): void {
  if (payload) {
    updateSensorValues(
      payload.front ?? 100,
      payload.left ?? 100,
      payload.right ?? 100
    );
  }
}

/**
 * Handle ping request
 */
function handlePing(): void {
  emitExecutionStarted();
}

/**
 * Handle terminate request
 */
function handleTerminate(): void {
  console.log('[PyodideWorker] Terminating');
  self.close();
}
