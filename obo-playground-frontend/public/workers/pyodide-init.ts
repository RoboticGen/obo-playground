/**
 * Pyodide initialization and management
 */

import { loadOBOCarModule } from './obocar-loader';
import { patchPythonEnvironment } from './python-patcher';
import { emitExecutionStarted, emitError } from './events';

const PYODIDE_VERSION = '0.23.4';
const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full`;

let pyodide: any = null;
let isInitialized = false;

/**
 * Initialize Pyodide
 */
export async function initPyodide(): Promise<void> {
  try {
    console.log('[PyodideWorker] Loading Pyodide...');

    await loadPyodideScript();
    pyodide = await createPyodideInstance();

    console.log('[PyodideWorker] Pyodide loaded, loading OBOCar module...');
    await loadOBOCarModule(pyodide);

    console.log('[PyodideWorker] OBOCar loaded, patching environment...');
    await patchPythonEnvironment(pyodide);

    isInitialized = true;
    console.log('[PyodideWorker] Initialized successfully');

    emitExecutionStarted();
  } catch (error: any) {
    console.error('[PyodideWorker] Init failed:', error);
    emitError(`Initialization failed: ${error.message}`);
  }
}

/**
 * Load Pyodide script from CDN
 */
async function loadPyodideScript(): Promise<void> {
  const scriptUrl = `${PYODIDE_CDN}/pyodide.js`;
  const response = await fetch(scriptUrl);

  if (!response.ok) {
    throw new Error(`Failed to load Pyodide script: HTTP ${response.status}`);
  }

  const scriptText = await response.text();
  eval(scriptText);

  if (!(self as any).loadPyodide) {
    throw new Error('loadPyodide function not available after script execution');
  }
}

/**
 * Create Pyodide instance
 */
async function createPyodideInstance(): Promise<any> {
  const loadPyodide = (self as any).loadPyodide;
  return await loadPyodide({
    indexURL: `${PYODIDE_CDN}/`,
  });
}

/**
 * Get Pyodide instance
 */
export function getPyodide(): any {
  return pyodide;
}

/**
 * Check if Pyodide is initialized
 */
export function isPyodideInitialized(): boolean {
  return isInitialized;
}
