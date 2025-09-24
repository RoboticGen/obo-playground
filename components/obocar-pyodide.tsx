/**
 * Complete Obo Car Pyodide Integration Component
 * 
 * This component provides a full interface for running your Python car simulation
 * in the browser using Pyodide and your complete library.
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  initializeOboCarPyodide, 
  executePythonCode, 
  runOriginalCode, 
  runTestSuite 
} from '@/lib/obocar-pyodide';
import { Loader2, Play, TestTube, CheckCircle, AlertCircle, Code2 } from 'lucide-react';

interface ExecutionResult {
  output: string;
  result?: any;
  success?: boolean;
}

const OboCarPyodide: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [executionOutput, setExecutionOutput] = useState<string>('');
  const [customCode, setCustomCode] = useState(`# Import the Obo Car library
from obocar import obocar

# Create a car instance
car = obocar()

# Your simulation code here
print("🚗 Starting car simulation...")

# Basic movement
car.forward(5)
print(f"Position: {car.get_position()}")

# Check sensors
front_distance = car.sensor('front')
print(f"Front sensor: {front_distance:.1f}m")

# Status check
status = car.status()
print(f"Status: {status}")

print("✅ Simulation complete!")`);
  
  const outputRef = useRef<HTMLDivElement>(null);

  // Initialize Pyodide on component mount
  useEffect(() => {
    const initPyodide = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await initializeOboCarPyodide();
        setIsInitialized(true);
        appendOutput('✅ Pyodide and Obo Car library initialized successfully!');
      } catch (err) {
        setError(`Failed to initialize Pyodide: ${err}`);
        appendOutput(`❌ Initialization error: ${err}`);
      } finally {
        setIsLoading(false);
      }
    };

    initPyodide();
  }, []);

  const appendOutput = (text: string) => {
    setExecutionOutput(prev => {
      const newOutput = prev + '\n' + text;
      // Keep output manageable - keep last 5000 characters
      return newOutput.length > 5000 ? newOutput.slice(-5000) : newOutput;
    });
    
    // Auto-scroll to bottom
    setTimeout(() => {
      if (outputRef.current) {
        outputRef.current.scrollTop = outputRef.current.scrollHeight;
      }
    }, 100);
  };

  const clearOutput = () => {
    setExecutionOutput('');
  };

  const executeCode = async (code: string, label: string = 'Custom Code') => {
    if (!isInitialized) {
      appendOutput('❌ Pyodide not initialized yet!');
      return;
    }

    try {
      setIsLoading(true);
      appendOutput(`\n🚀 Executing ${label}...`);
      appendOutput('─'.repeat(50));
      
      const result = await executePythonCode(code);
      
      if (result.output) {
        appendOutput(result.output);
      }
      
      if (result.result !== null && result.result !== undefined) {
        appendOutput(`📊 Result: ${JSON.stringify(result.result, null, 2)}`);
      }
      
      appendOutput('─'.repeat(50));
      appendOutput(`✅ ${label} completed successfully!`);
      
    } catch (error) {
      appendOutput(`❌ Execution error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const runQuickTest = async () => {
    await executeCode(`
# Quick test of your obocar library
car = obocar()
print("🧪 Running quick test...")

# Test basic functionality
print(f"Initial position: {car.get_position()}")
print(f"Initial battery: {car.battery()}%")

# Move and check
car.forward(3)
car.right(45)

print(f"New position: {car.get_position()}")
print(f"New heading: {car.get_heading()}°")
print(f"Battery after movement: {car.battery()}%")
print(f"Distance traveled: {car.distance()}")

# Sensor check
front_sensor = car.sensor('front')
print(f"Front sensor reading: {front_sensor:.1f}m")

print("✅ Quick test completed!")
    `, 'Quick Test');
  };

  const runOriginalTest = async () => {
    try {
      setIsLoading(true);
      appendOutput('\n🎯 Running your original code...');
      appendOutput('─'.repeat(50));
      
      const result = await runOriginalCode();
      
      if (result.output) {
        appendOutput(result.output);
      }
      
      if (result.result) {
        appendOutput(`📊 Final Result: ${JSON.stringify(result.result, null, 2)}`);
      }
      
      appendOutput('─'.repeat(50));
      appendOutput('✅ Original code executed successfully!');
      
    } catch (error) {
      appendOutput(`❌ Error running original code: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const runFullTestSuite = async () => {
    try {
      setIsLoading(true);
      appendOutput('\n🧪 Running complete test suite...');
      appendOutput('─'.repeat(50));
      
      const result = await runTestSuite();
      
      if (result.output) {
        appendOutput(result.output);
      }
      
      if (result.result) {
        appendOutput(`📊 Test Results: ${JSON.stringify(result.result, null, 2)}`);
      }
      
      appendOutput('─'.repeat(50));
      appendOutput('✅ Test suite completed!');
      
    } catch (error) {
      appendOutput(`❌ Error running test suite: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              🚗 Obo Car Pyodide Integration
            </CardTitle>
            <CardDescription className="text-lg">
              Your complete Python car simulation library running in the browser with Pyodide
            </CardDescription>
            
            <div className="flex justify-center items-center gap-4 mt-4">
              <Badge variant={isInitialized ? "default" : "secondary"} className="flex items-center gap-2">
                {isInitialized ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Pyodide Ready
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4" />
                    Initializing...
                  </>
                )}
              </Badge>
              
              <Badge variant="outline">
                Version 0.1.0
              </Badge>
              
              <Badge variant="outline">
                Python in Browser
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Test your library with pre-built examples
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button 
              onClick={runQuickTest}
              disabled={!isInitialized || isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
              Quick Test
            </Button>
            
            <Button 
              onClick={runOriginalTest}
              disabled={!isInitialized || isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Run Original Code
            </Button>
            
            <Button 
              onClick={runFullTestSuite}
              disabled={!isInitialized || isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
              Full Test Suite
            </Button>

            <Separator orientation="vertical" className="h-6" />
            
            <Button 
              onClick={clearOutput}
              variant="ghost"
              size="sm"
            >
              Clear Output
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Custom Code Editor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5" />
                Custom Python Code
              </CardTitle>
              <CardDescription>
                Write and execute your own Python code using the obocar library
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                placeholder="Enter your Python code here..."
                className="min-h-[400px] font-mono text-sm"
              />
              
              <Button 
                onClick={() => executeCode(customCode)}
                disabled={!isInitialized || isLoading}
                className="w-full flex items-center gap-2"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Execute Code
              </Button>
            </CardContent>
          </Card>

          {/* Output Console */}
          <Card>
            <CardHeader>
              <CardTitle>Execution Output</CardTitle>
              <CardDescription>
                Real-time output from your Python code execution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                ref={outputRef}
                className="bg-gray-900 text-green-400 p-4 rounded-md font-mono text-sm min-h-[400px] max-h-[400px] overflow-y-auto whitespace-pre-wrap"
              >
                {executionOutput || '💡 Execute some code to see output here...'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Library Information */}
        <Card>
          <CardHeader>
            <CardTitle>📚 Your Obo Car Library Features</CardTitle>
            <CardDescription>
              Complete Python simulation library loaded in your browser
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-600">🚗 Movement</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <code>car.forward(distance)</code></li>
                  <li>• <code>car.backward(distance)</code></li>
                  <li>• <code>car.left(degrees)</code></li>
                  <li>• <code>car.right(degrees)</code></li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-green-600">📡 Sensors</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <code>car.sensor('front')</code></li>
                  <li>• <code>car.sensor('back')</code></li>
                  <li>• <code>car.sensor('left')</code></li>
                  <li>• <code>car.sensor('right')</code></li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-purple-600">📊 Status</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <code>car.battery()</code></li>
                  <li>• <code>car.distance()</code></li>
                  <li>• <code>car.get_position()</code></li>
                  <li>• <code>car.get_heading()</code></li>
                  <li>• <code>car.status()</code></li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-orange-600">🚧 Environment</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <code>car.get_obstacles()</code></li>
                  <li>• <code>car.add_obstacle(x, y)</code></li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-red-600">🔧 Utilities</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <code>car.wait(seconds)</code></li>
                  <li>• <code>car.reset()</code></li>
                  <li>• <code>car.get_event_log()</code></li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-indigo-600">🏗️ Creation</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <code>car = obocar()</code></li>
                  <li>• Complete library loaded</li>
                  <li>• Browser-ready Pyodide</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default OboCarPyodide;