interface Window {
  terminalOutput?: (message: string, type?: 'info' | 'error' | 'warning' | 'success') => void;
  loadPyodide?: () => Promise<any>;
  carControlAPI?: any;
  oboCarAPI?: any;
  pyodideInstance?: any;
}