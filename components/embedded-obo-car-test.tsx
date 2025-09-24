'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function EmbeddedOboCarTest() {
  const [pyodide, setPyodide] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  // Embed the Python code directly to avoid file loading issues
  const obocarCode = `
import random
import math
import time

class OboChar:
    def __init__(self):
        self.position = [0.0, 0.0]
        self.angle = 0.0
        self.speed = 0.0
        self.max_speed = 10.0
        self.total_distance = 0.0
        self.sensor_range = 20.0
        self.obstacles = self._generate_random_obstacles()
        self._event_log = []
        
    def _generate_random_obstacles(self):
        obstacles = []
        # Simple obstacle pattern
        for i in range(5):
            x = random.uniform(-20, 20)
            y = random.uniform(-20, 20)
            obstacles.append((x, y))
        return obstacles
    
    def _log_event(self, event):
        self._event_log.append({
            'event': event,
            'position': tuple(self.position),
            'angle': self.angle
        })
    
    def forward(self, distance):
        print(f"🚗 Moving forward {distance} units...")
        self._log_event(f"forward({distance})")
        
        angle_rad = math.radians(self.angle)
        new_x = self.position[0] + distance * math.sin(angle_rad)
        new_y = self.position[1] + distance * math.cos(angle_rad)
        
        self.position = [new_x, new_y]
        self.total_distance += abs(distance)
        
        print(f"   Position: ({self.position[0]:.1f}, {self.position[1]:.1f})")
    
    def backward(self, distance):
        print(f"🔄 Moving backward {distance} units...")
        self.forward(-distance)
    
    def left(self, degrees):
        print(f"⬅️ Turning left {degrees} degrees...")
        self._log_event(f"left({degrees})")
        self.angle = (self.angle - degrees) % 360
        print(f"   New heading: {self.angle:.1f}°")
    
    def right(self, degrees):
        print(f"➡️ Turning right {degrees} degrees...")
        self._log_event(f"right({degrees})")
        self.angle = (self.angle + degrees) % 360
        print(f"   New heading: {self.angle:.1f}°")
    
    def sensor(self, direction='front'):
        sensor_angles = {
            'front': 0, 'right': 90, 'back': 180, 'left': 270
        }
        
        if direction not in sensor_angles:
            raise ValueError(f"Invalid sensor direction: {direction}")
        
        sensor_angle = (self.angle + sensor_angles[direction]) % 360
        sensor_angle_rad = math.radians(sensor_angle)
        
        min_distance = self.sensor_range
        
        for obstacle_x, obstacle_y in self.obstacles:
            dx = obstacle_x - self.position[0]
            dy = obstacle_y - self.position[1]
            distance = math.sqrt(dx**2 + dy**2)
            
            angle_to_obstacle = math.degrees(math.atan2(dx, dy))
            angle_diff = abs((angle_to_obstacle - sensor_angle + 180) % 360 - 180)
            
            if angle_diff <= 30 and distance < min_distance:
                min_distance = distance
        
        noise = random.uniform(-0.2, 0.2)
        result = max(0.1, min_distance + noise)
        
        self._log_event(f"sensor({direction}) = {result:.1f}")
        return result
    

    
    def distance(self):
        return round(self.total_distance, 1)
    
    def wait(self, seconds):
        print(f"⏳ Waiting {seconds} seconds...")
        self._log_event(f"wait({seconds})")
    
    def get_position(self):
        return (round(self.position[0], 1), round(self.position[1], 1))
    
    def get_heading(self):
        return round(self.angle, 1)
    
    def status(self):
        return {
            'position': self.get_position(),
            'heading': self.get_heading(),
            'distance': self.distance(),
            'speed': round(self.speed, 1),
        }
    
    def reset(self):
        self.position = [0.0, 0.0]
        self.angle = 0.0
        self.speed = 0.0
        self.total_distance = 0.0
        self.obstacles = self._generate_random_obstacles()
        self._event_log = []
        print("🔄 Car reset to initial state")
        self._log_event("reset()")

def obocar():
    return OboChar()

print("obocar module loaded successfully!")
`;

  useEffect(() => {
    initEmbeddedTest();
  }, []);

  const initEmbeddedTest = async () => {
    setIsLoading(true);
    setOutput('Loading Pyodide with embedded obocar...\n');
    
    try {
      // Load Pyodide from CDN to avoid webpack issues
      if (!(window as any).loadPyodide) {
        // Dynamically load the Pyodide script
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
        script.async = true;
        document.head.appendChild(script);
        
        // Wait for script to load
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }
      
      const pyodideInstance = await (window as any).loadPyodide();
      
      setOutput(prev => prev + '✅ Pyodide loaded!\n');
      setOutput(prev => prev + 'Loading embedded obocar code...\n');
      
      // Execute the embedded obocar code
      pyodideInstance.runPython(obocarCode);
      
      setOutput(prev => prev + '✅ obocar loaded from embedded code!\n');
      
      // Test it works
      const testResult = pyodideInstance.runPython(`
car = obocar()
print(f"Test car created at {car.get_position()}")
{
    'success': True,
    'position': car.get_position()
}
      `);
      
      setOutput(prev => prev + `✅ Test successful: ${JSON.stringify(testResult)}\n`);
      
      setPyodide(pyodideInstance);
      setIsLoading(false);
      
    } catch (err: any) {
      setError(`Initialization failed: ${err.message}`);
      setIsLoading(false);
    }
  };

  const runYourCode = async () => {
    if (!pyodide) return;
    
    setOutput(prev => prev + '\n=== RUNNING YOUR ORIGINAL CODE ===\n');
    
    try {
      const result = pyodide.runPython(`
# Your exact original code
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

{
    'position': car.get_position(),
    'distance': distance,
    'heading': car.get_heading()
}
      `);
      
      setOutput(prev => prev + `🎉 SUCCESS! Result: ${JSON.stringify(result, null, 2)}\n`);
      
    } catch (err: any) {
      setError(`Execution error: ${err.message}`);
    }
  };

  if (isLoading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Loading Embedded obocar...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            <span>Initializing...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>🚗 Embedded Obo Car Test</CardTitle>
        <CardDescription>
          Testing with embedded Python code (no file loading)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        <div className="flex space-x-2">
          <Button onClick={runYourCode} disabled={!pyodide}>
            Run Your Original Code
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
          <h3 className="font-medium mb-2">Output:</h3>
          <pre className="text-sm overflow-auto max-h-96 whitespace-pre-wrap font-mono">
            {output || 'No output yet...'}
          </pre>
        </div>

      </CardContent>
    </Card>
  );
}