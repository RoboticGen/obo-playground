/**
 * Code execution module
 */

import { getPyodide, isPyodideInitialized } from './pyodide-init';
import {
  emitExecutionStarted,
  emitExecutionCompleted,
  emitExecutionOutput,
  emitError,
} from './events';

/**
 * Execute Python code
 */
export async function executeCode(code: string, requestId: string): Promise<void> {
  if (!isPyodideInitialized()) {
    emitError('Pyodide not initialized');
    return;
  }

  try {
    emitExecutionStarted();

    const pyodide = getPyodide();
    const result = await pyodide.runPythonAsync(code);

    if (result !== undefined && result !== null) {
      emitExecutionOutput(String(result));
    }

    emitExecutionCompleted();
  } catch (error: any) {
    emitError(error.message || String(error));
  }
}
