'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Loader2, Play, TestTube } from 'lucide-react';

// Define Pyodide interface
interface PyodideInterface {
  runPython: (code: string) => any;
  FS: {
    writeFile: (path: string, data: string) => void;
  };
  pyimport: (moduleName: string) => any;
  // Add other methods as needed
}

// PyodideWorker will be initialized when the component mounts
let pyodideReady = false;
let pyodideInstance: PyodideInterface | null = null;

const OboCarPyodideComponent: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [output, setOutput] = useState('');
  const [pythonCode, setPythonCode] = useState(`from obocar import obocar

# Create a car instance
car = obocar()
`);

  const outputRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const initializePyodide = async () => {
      if (!(window as any).loadPyodide) {
        // Load the Pyodide script
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
        script.async = true;
        script.onload = () => loadPyodideEnvironment();
        document.body.appendChild(script);
      } else {
        loadPyodideEnvironment();
      }
    };

    const loadPyodideEnvironment = async () => {
      try {
        setIsLoading(true);
        appendOutput('Loading Pyodide environment...');
        
        // Load Pyodide
        pyodideInstance = await (window as any).loadPyodide();
        appendOutput('✅ Pyodide loaded successfully!');
        
        // Load obocar.py
        appendOutput('Loading obocar module...');
        try {
          const response = await fetch('obocar.py');
          if (!response.ok) {
            throw new Error(`Failed to fetch obocar.py: ${response.status} ${response.statusText}`);
          }
          
          const obocarCode = await response.text();
          appendOutput('✅ obocar.py fetched successfully!');
          
          // Write to virtual filesystem
          if (pyodideInstance) {
            pyodideInstance.FS.writeFile('obocar.py', obocarCode);
            appendOutput('✅ obocar.py written to virtual filesystem!');
            
            // Make pyodideInstance available to Python code
            (window as any).pyodideInstance = pyodideInstance;
            
            // Debug: Check filesystem and Python path
            const debugInfo = pyodideInstance.runPython(`
              import sys, os
              f"Python sys.path: {sys.path}\\nCurrent directory: {os.getcwd()}\\nFiles: {os.listdir()}"
            `);
            appendOutput(debugInfo as string);
            
            // Try using pyimport directly instead of Python import
            try {
              const obocarModule = pyodideInstance.pyimport("obocar");
              appendOutput('✅ obocar module imported successfully via pyimport!');
              
              // Test if we can create a car
              try {
                if (typeof obocarModule.obocar === 'function') {
                  const car = obocarModule.obocar();
                  appendOutput(`✅ Created car instance. Position: ${car.get_position()}`);
                  pyodideReady = true;
                } else {
                  appendOutput(`❌ obocar function not found in module. Available: ${Object.keys(obocarModule).join(", ")}`);
                }
              } catch (carError) {
                appendOutput(`❌ Error creating car: ${carError instanceof Error ? carError.message : String(carError)}`);
              }
            } catch (importError) {
              appendOutput(`❌ pyimport failed: ${importError instanceof Error ? importError.message : String(importError)}`);
              
              // Fallback to regular Python import
              const testImport = pyodideInstance.runPython(`
                try:
                  import obocar
                  car = obocar.obocar()
                  f"success: {car.get_position()}"
                except Exception as e:
                  import traceback
                  traceback_str = traceback.format_exc()
                  f"error: {str(e)}\\n{traceback_str}"
              `);
              
              if (testImport.startsWith("success")) {
                appendOutput('✅ obocar module imported successfully via Python import!');
                pyodideReady = true;
              } else {
                throw new Error(testImport as string);
              }
            }
          }
        } catch (error) {
          appendOutput(`❌ Error loading obocar module: ${error instanceof Error ? error.message : String(error)}`);
          console.error(error);
        }
      } catch (error) {
        appendOutput(`❌ Error initializing Pyodide: ${error instanceof Error ? error.message : String(error)}`);
        console.error('Pyodide initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializePyodide();

    // Cleanup
    return () => {
      pyodideReady = false;
      pyodideInstance = null;
    };
  }, []);

  const appendOutput = (text: string) => {
    setOutput((prev) => prev + text + '\n');
    
    // Auto-scroll to bottom of output
    setTimeout(() => {
      if (outputRef.current) {
        outputRef.current.scrollTop = outputRef.current.scrollHeight;
      }
    }, 10);
  };

  const clearOutput = () => {
    setOutput('');
  };

  const runPythonCode = async (code: string) => {
    if (!pyodideReady || !pyodideInstance) {
      appendOutput('❌ Pyodide not ready yet!');
      return;
    }

    try {
      setIsLoading(true);
      appendOutput('Running Python code...');
      appendOutput('--------------------------------------------------');
      
      // Try the more robust import approach - adjust the import method based on how we initially imported
      let modifiedCode = code;
      if (code.includes('from obocar import obocar')) {
        appendOutput('Detected "from obocar import obocar" - using appropriate import method');
        // Replace the import with an approach that will work with our filesystem setup
        modifiedCode = modifiedCode.replace(
          'from obocar import obocar', 
          'from js import pyodideInstance\n__BROWSER__ = True  # Set flag to prevent demo code from running\nobocarModule = pyodideInstance.pyimport("obocar")\nobocar = obocarModule.obocar'
        );
      } else if (code.includes('import obocar')) {
        appendOutput('Detected "import obocar" - using appropriate import method');
        // Replace the import with an approach that will work with our filesystem setup
        modifiedCode = modifiedCode.replace(
          'import obocar', 
          'from js import pyodideInstance\n__BROWSER__ = True  # Set flag to prevent demo code from running\nobocarModule = pyodideInstance.pyimport("obocar")'
        );
      }
      
      const result = pyodideInstance.runPython(`
import sys
from io import StringIO

# Capture stdout
old_stdout = sys.stdout
sys.stdout = mystdout = StringIO()

try:
${modifiedCode.split('\n').map(line => '    ' + line).join('\n')}
except Exception as e:
    print(f"❌ Error: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()

# Restore stdout and get output
sys.stdout = old_stdout
mystdout.getvalue()
      `);
      
      appendOutput(result as string);
      appendOutput('--------------------------------------------------');
      appendOutput('✅ Code execution completed!');
    } catch (error) {
      appendOutput(`❌ Error executing Python code: ${error instanceof Error ? error.message : String(error)}`);
      console.error('Python execution error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runMovementTest = async () => {
    clearOutput();
    const testCode = `
      from obocar import obocar

      car = obocar()
      initial_pos = car.get_position()
      car.forward(5)
      new_pos = car.get_position()

      assert new_pos != initial_pos
      assert car.distance() == 5.0

      car.right(90)
      assert car.get_heading() == 90.0

      car.left(45)
      assert car.get_heading() == 45.0

      print("✅ Movement test passed")
    `;
    
    await runPythonCode(testCode);
  };

  const handleRunCode = () => {
    clearOutput();
    runPythonCode(pythonCode);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Obo Car Pyodide Simulator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="flex flex-col">
            <label htmlFor="python-code" className="text-sm font-medium mb-2">
              Python Code
            </label>
            <Textarea
              id="python-code"
              value={pythonCode}
              onChange={(e) => setPythonCode(e.target.value)}
              className="font-mono min-h-[200px]"
              placeholder="Write your Python code here..."
              disabled={isLoading}
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleRunCode}
              disabled={isLoading || !pyodideReady}
              className="flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Run Code
            </Button>
            
            <Button
              onClick={runMovementTest}
              disabled={isLoading || !pyodideReady}
              variant="outline"
              className="flex items-center gap-2"
            >
              <TestTube className="h-4 w-4" />
              Run Movement Test
            </Button>
            
            <Button
              onClick={clearOutput}
              variant="outline"
              disabled={isLoading}
            >
              Clear Output
            </Button>
          </div>
          
          <Separator />
          
          <div className="flex flex-col">
            <label htmlFor="output" className="text-sm font-medium mb-2">
              Output
            </label>
            <pre
              id="output"
              ref={outputRef}
              className="bg-muted p-4 rounded-md font-mono text-sm overflow-auto whitespace-pre-wrap min-h-[200px] max-h-[400px]"
            >
              {output || 'Output will appear here...'}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OboCarPyodideComponent;