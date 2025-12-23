/**
 * OBOCar module loader with retry logic
 */

const MAX_ATTEMPTS = 3;
const RETRY_DELAY = 500;

/**
 * Load OBOCar module from public folder with retry logic
 */
export async function loadOBOCarModule(pyodide: any): Promise<void> {
  let lastError: any = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const url = getModuleUrl(attempt);
      console.log(`[PyodideWorker] Attempt ${attempt}: Fetching OBOCar from:`, url);

      const code = await fetchModuleCode(url);
      writeModuleToFileSystem(pyodide, code);
      await addModuleToPath(pyodide);

      console.log('[PyodideWorker] OBOCar module loaded successfully');
      return;
    } catch (error: any) {
      lastError = error;
      console.warn(`[PyodideWorker] Attempt ${attempt} failed:`, error.message);

      if (attempt < MAX_ATTEMPTS) {
        await delay(RETRY_DELAY);
      }
    }
  }

  throw new Error(
    `Failed to load obocar after ${MAX_ATTEMPTS} attempts: ${lastError?.message || 'Unknown error'}`
  );
}

/**
 * Get module URL based on attempt number
 */
function getModuleUrl(attempt: number): string {
  if (attempt === 1) {
    return new URL('/obocar.py', self.location.origin).href;
  } else if (attempt === 2) {
    return new URL('obocar.py', self.location.href).href;
  } else {
    return `${self.location.origin}/obocar.py`;
  }
}

/**
 * Fetch module code from URL
 */
async function fetchModuleCode(url: string): Promise<string> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const code = await response.text();

  if (!code || code.length === 0) {
    throw new Error('OBOCar file is empty');
  }

  console.log('[PyodideWorker] OBOCar file size:', code.length, 'bytes');
  return code;
}

/**
 * Write module code to Pyodide file system
 */
function writeModuleToFileSystem(pyodide: any, code: string): void {
  pyodide.FS.writeFile('/obocar.py', code);
}

/**
 * Add module path to Python sys.path
 */
async function addModuleToPath(pyodide: any): Promise<void> {
  await pyodide.runPythonAsync(`
import sys
if '/' not in sys.path:
    sys.path.insert(0, '/')
  `);
}

/**
 * Load module from main thread
 */
export async function loadModuleFromMainThread(pyodide: any, code: string): Promise<void> {
  writeModuleToFileSystem(pyodide, code);
  await addModuleToPath(pyodide);
  console.log('[PyodideWorker] OBOCar module loaded from main thread');
}

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
