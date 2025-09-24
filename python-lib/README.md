# Obo Car Simulation Library

A lightweight Python library for simulating car dynamics and physics, designed to work seamlessly with Pyodide in browser environments.

## Features

- **Simple API**: Easy-to-use methods for car movement and control
- **Sensor System**: Front, back, left, and right distance sensors
- **Battery Management**: Realistic battery consumption simulation
- **Collision Detection**: Obstacle avoidance and collision handling
- **Pyodide Compatible**: Works perfectly in browser environments
- **Event Logging**: Track all car actions for debugging

## Installation

### For Pyodide (Browser)

```javascript
// Load Pyodide and install the package
const pyodide = await loadPyodide();

// Copy the obocar directory to Pyodide's filesystem
// Then import and use
pyodide.runPython(`
import sys
sys.path.append('/path/to/python-lib')

from obocar import obocar
car = obocar()
`);
```

### For Local Python

```bash
pip install -e python-lib/
```

## Quick Start

```python
# Import the Obo Car library
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
battery = car.battery()
distance = car.distance()
print(f"Mission complete! Battery: {battery:.1f}%, Distance: {distance:.1f}m")
```

## API Reference

### Movement Methods
- `car.forward(distance)` - Move forward
- `car.backward(distance)` - Move backward  
- `car.left(degrees)` - Turn left
- `car.right(degrees)` - Turn right

### Sensor Methods
- `car.sensor('front')` - Front distance sensor
- `car.sensor('back')` - Back distance sensor
- `car.sensor('left')` - Left distance sensor
- `car.sensor('right')` - Right distance sensor

### Status Methods
- `car.battery()` - Battery percentage (0-100)
- `car.distance()` - Total distance traveled
- `car.get_position()` - Current (x, y) position
- `car.get_heading()` - Current heading in degrees
- `car.status()` - Complete status dictionary

### Utility Methods
- `car.wait(seconds)` - Wait/pause
- `car.reset()` - Reset to initial state
- `car.get_obstacles()` - Get obstacle positions
- `car.add_obstacle(x, y)` - Add new obstacle

## Pyodide Integration

This library is specifically designed to work with Pyodide, making it perfect for:
- Web-based coding tutorials
- Browser-based robotics simulations
- Interactive educational content
- Real-time car control interfaces

## Dependencies

- Only uses Python standard library (math, random, time, typing)
- No external dependencies required
- Fully compatible with Pyodide's limitations