'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function SimpleOboCarTest() {
  const [pyodide, setPyodide] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    initializePyodide();
  }, []);

  const initializePyodide = async () => {
    setIsLoading(true);
    setOutput('Loading Pyodide...\n');
    
    try {
      // Load Pyodide
      const { loadPyodide } = await import('pyodide');
      const pyodideInstance = await loadPyodide();
      
      setOutput(prev => prev + 'Pyodide loaded successfully!\n');
      
      // Load the obocar module
      setOutput(prev => prev + 'Loading obocar module...\n');
      
      const response = await fetch('/python/obocar.py');
      const obocarCode = await response.text();
      
      // Execute the obocar module code
      pyodideInstance.runPython(obocarCode);
      
      setOutput(prev => prev + 'Obocar module loaded successfully!\n');
      
      // Test basic functionality
      const result = pyodideInstance.runPython(`
# Test the basic functionality
print("Testing obocar creation...")
car = obocar()
print(f"Car created at position: {car.get_position()}")

print("Basic test completed!")

# Return some data to JavaScript
{
    'position': car.get_position(),

    'heading': car.get_heading()
}
      `);
      
      setOutput(prev => prev + `Test result: ${JSON.stringify(result, null, 2)}\n`);
      
      setPyodide(pyodideInstance);
      setIsLoading(false);
      
    } catch (err: any) {
      console.error('Error initializing Pyodide:', err);
      setError(`Error: ${err.message}`);
      setIsLoading(false);
    }
  };

  const runBasicSimulation = async () => {
    if (!pyodide) return;
    
    setOutput(prev => prev + '\n--- Running Basic Simulation ---\n');
    
    try {
      const result = pyodide.runPython(`
# Your original code exactly as you wrote it
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

# Return final status
{
    'position': car.get_position(),

    'distance': distance,
    'heading': car.get_heading()
}
      `);
      
      setOutput(prev => prev + `Simulation completed! Final status: ${JSON.stringify(result, null, 2)}\n`);
      
    } catch (err: any) {
      setError(`Simulation error: ${err.message}`);
    }
  };

  const testMovement = async () => {
    if (!pyodide) return;
    
    setOutput(prev => prev + '\n--- Testing Movement ---\n');
    
    try {
      const result = pyodide.runPython(`
# Create a new car for testing
test_car = obocar()
print(f"Starting position: {test_car.get_position()}")

# Test movement
test_car.forward(2)
print(f"After forward(2): {test_car.get_position()}")

test_car.right(90)
print(f"After right(90): heading = {test_car.get_heading()}°")

test_car.forward(1)
print(f"After forward(1): {test_car.get_position()}")

# Test sensors
front_sensor = test_car.sensor('front')
print(f"Front sensor: {front_sensor:.1f}m")

{
    'position': test_car.get_position(),
    'heading': test_car.get_heading(),

    'front_sensor': front_sensor
}
      `);
      
      setOutput(prev => prev + `Movement test result: ${JSON.stringify(result, null, 2)}\n`);
      
    } catch (err: any) {
      setError(`Movement test error: ${err.message}`);
    }
  };

  if (isLoading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Loading Obo Car...</CardTitle>
          <CardDescription>Initializing Pyodide and loading the obocar library</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            <span>Please wait...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>🚗 Obo Car - Pyodide Test</CardTitle>
        <CardDescription>
          Testing the obocar Python library in the browser using Pyodide
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        <div className="flex space-x-2">
          <Button onClick={runBasicSimulation} disabled={!pyodide}>
            Run Basic Simulation
          </Button>
          <Button onClick={testMovement} disabled={!pyodide} variant="outline">
            Test Movement
          </Button>
          <Button onClick={() => setOutput('')} variant="outline">
            Clear Output
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <h3 className="font-medium text-red-800">Error:</h3>
            <pre className="text-red-700 text-sm mt-1">{error}</pre>
          </div>
        )}

        <div className="bg-gray-50 border rounded p-4">
          <h3 className="font-medium mb-2">Console Output:</h3>
          <pre className="text-sm overflow-auto max-h-96 whitespace-pre-wrap">
            {output || 'No output yet...'}
          </pre>
        </div>

      </CardContent>
    </Card>
  );
}