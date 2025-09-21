// Utility to load and run Pyodide in the browser using CDN
// Exposes a function to initialize Pyodide and run Python code

let pyodidePromise: Promise<any> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.body.appendChild(script);
  });
}

export async function loadPyodideAndPackages(): Promise<any> {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      await loadScript('https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js');
      // @ts-ignore
      const pyodide = await window.loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/' });
      return pyodide;
    })();
  }
  return pyodidePromise;
}

// Add cancellation support: if cancelRef.cancelled, abort execution
export async function runPython(code: string, cancelRef?: {cancelled: boolean}): Promise<any> {
  const pyodide = await loadPyodideAndPackages();
  let interrupted = false;
  // Patch: periodically check for cancellation
  function wrapAsync(code: string) {
    return `import asyncio\nasync def __user_main__():\n    try:\n        ${code.split('\n').map(l => '        '+l).join('\n')}\n    except asyncio.CancelledError:\n        pass\n\nimport sys\nimport types\nimport builtins\nimport asyncio\nasync def __run_with_cancel():\n    task = asyncio.create_task(__user_main__())\n    while not task.done():\n        await asyncio.sleep(0.05)\n        if hasattr(builtins, '__cancelled__') and builtins.__cancelled__:\n            task.cancel()\n            break\n    try:\n        await task\n    except asyncio.CancelledError:\n        pass\n\nbuiltins.__cancelled__ = False\nasyncio.run(__run_with_cancel())`;
  }
  if (cancelRef) {
    // Set up a polling interval to set a global var in Pyodide
    const interval = setInterval(() => {
      if (cancelRef.cancelled) {
        // @ts-ignore
        if (pyodide.globals) pyodide.globals.set("__cancelled__", true);
        interrupted = true;
        clearInterval(interval);
      }
    }, 50);
    try {
      pyodide.globals.set("__cancelled__", false);
      return await pyodide.runPythonAsync(wrapAsync(code));
    } finally {
      clearInterval(interval);
    }
  } else {
    return await pyodide.runPythonAsync(code);
  }
}
