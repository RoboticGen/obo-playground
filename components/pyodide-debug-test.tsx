'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function PyodideDebugTest() {
  const [pyodide, setPyodide] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);

  useEffect(() => {
    debugPyodideSetup();
  }, []);

  const debugPyodideSetup = async () => {
    setIsLoading(true);
    setOutput('=== PYODIDE DEBUG SETUP ===\n');
    
    try {
      // Step 1: Load Pyodide
      setStep(1);
      setOutput(prev => prev + 'Step 1: Loading Pyodide...\n');
      
      const { loadPyodide } = await import('pyodide');
      const pyodideInstance = await loadPyodide();
      
      setOutput(prev => prev + '✅ Pyodide loaded successfully!\n');
      
      // Step 2: Test basic Python execution
      setStep(2);
      setOutput(prev => prev + 'Step 2: Testing basic Python execution...\n');
      
      const basicTest = pyodideInstance.runPython(`
print("Hello from Pyodide!")
2 + 2
      `);
      
      setOutput(prev => prev + `✅ Basic Python works! Result: ${basicTest}\n`);
      
      // Step 3: Check file system access
      setStep(3);
      setOutput(prev => prev + 'Step 3: Testing file system access...\n');
      
      try {
        const response = await fetch('/python/obocar.py');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const obocarCode = await response.text();
        setOutput(prev => prev + `✅ obocar.py loaded! Size: ${obocarCode.length} chars\n`);
        
        // Step 4: Execute the obocar module
        setStep(4);
        setOutput(prev => prev + 'Step 4: Executing obocar module...\n');
        
        pyodideInstance.runPython(obocarCode);
        setOutput(prev => prev + '✅ obocar module executed!\n');
        
        // Step 5: Test obocar creation
        setStep(5);
        setOutput(prev => prev + 'Step 5: Testing obocar creation...\n');
        
        const testResult = pyodideInstance.runPython(`
# Test if obocar function is available
print("Available globals:", [name for name in globals() if not name.startswith('_')])
print("Testing obocar creation...")

# Try to create obocar instance
try:
    car = obocar()
    print(f"✅ Car created successfully!")
    print(f"Position: {car.get_position()}")

    result = {
        'success': True,
        'position': car.get_position(),

        'heading': car.get_heading()
    }
except Exception as e:
    print(f"❌ Error creating car: {e}")
    result = {'success': False, 'error': str(e)}

result
        `);
        
        setOutput(prev => prev + `Test result: ${JSON.stringify(testResult, null, 2)}\n`);
        
        if (testResult.success) {
          setOutput(prev => prev + '🎉 ALL TESTS PASSED! obocar is working!\n');
        } else {
          setError(`obocar creation failed: ${testResult.error}`);
        }
        
        setPyodide(pyodideInstance);
        
      } catch (fetchError: any) {
        setError(`Failed to load obocar.py: ${fetchError.message}`);
        setOutput(prev => prev + `❌ File access error: ${fetchError.message}\n`);
      }
      
    } catch (err: any) {
      console.error('Error in debug setup:', err);
      setError(`Setup error at step ${step}: ${err.message}`);
      setOutput(prev => prev + `❌ Error at step ${step}: ${err.message}\n`);
    } finally {
      setIsLoading(false);
    }
  };

  const testYourCode = async () => {
    if (!pyodide) {
      setError('Pyodide not ready yet');
      return;
    }
    
    setOutput(prev => prev + '\n=== TESTING YOUR ORIGINAL CODE ===\n');
    
    try {
      const result = pyodide.runPython(`
# Your exact original code
from obocar import obocar

# Create a car instance
car = obocar()

# Basic movement commands
print("🚗 Starting Obo Car simulation!")

# Move forward 3 units
car.forward(3)
car.wait(0.5)

# Check front sensor
front_distance = car.sensor('front')
print(f"Front sensor: {front_distance:.1f}m")

# Make decisions based on sensor data
if front_distance > 5:
    print("Path clear, moving forward")
    car.forward(2)
else:
    print("Obstacle detected, turning right")
    car.right(90)
    car.forward(2)

# Check status
distance = car.distance()
print(f"Mission complete! Distance: {distance:.1f}m")

# Return final status for JavaScript
{
    'position': car.get_position(),

    'distance': distance,
    'heading': car.get_heading()
}
      `);
      
      setOutput(prev => prev + `🎉 YOUR CODE WORKS! Final result:\n${JSON.stringify(result, null, 2)}\n`);
      
    } catch (err: any) {
      setError(`Code execution error: ${err.message}`);
      setOutput(prev => prev + `❌ Execution error: ${err.message}\n`);
    }
  };

  const runSimpleTest = async () => {
    if (!pyodide) return;
    
    setOutput(prev => prev + '\n=== SIMPLE MOVEMENT TEST ===\n');
    
    try {
      pyodide.runPython(`
# Create a fresh car for testing
test_car = obocar()
print(f"New car at: {test_car.get_position()}")

# Test basic movements
test_car.forward(1)
print(f"After forward(1): {test_car.get_position()}")

test_car.right(90)  
print(f"After right(90): heading = {test_car.get_heading()}°")

test_car.forward(1)
print(f"After forward(1): {test_car.get_position()}")

print("Simple test completed!")
      `);
      
      setOutput(prev => prev + '✅ Simple test completed!\n');
      
    } catch (err: any) {
      setError(`Simple test error: ${err.message}`);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>🔍 Pyodide Debug Test</CardTitle>
        <CardDescription>
          Debugging the obocar Python library integration step by step
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {isLoading && (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            <span>Running debug setup... (Step {step})</span>
          </div>
        )}

        <div className="flex space-x-2">
          <Button onClick={testYourCode} disabled={!pyodide || isLoading}>
            Test Your Original Code
          </Button>
          <Button onClick={runSimpleTest} disabled={!pyodide || isLoading} variant="outline">
            Run Simple Test
          </Button>
          <Button onClick={() => {setOutput(''); setError('');}} variant="outline">
            Clear Output
          </Button>
          <Button onClick={debugPyodideSetup} variant="outline">
            Re-run Debug
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <h3 className="font-medium text-red-800">Error:</h3>
            <pre className="text-red-700 text-sm mt-1 whitespace-pre-wrap">{error}</pre>
          </div>
        )}

        <div className="bg-gray-50 border rounded p-4">
          <h3 className="font-medium mb-2">Debug Output:</h3>
          <pre className="text-sm overflow-auto max-h-96 whitespace-pre-wrap font-mono">
            {output || 'Waiting for debug output...'}
          </pre>
        </div>

      </CardContent>
    </Card>
  );
}