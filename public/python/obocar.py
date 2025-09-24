"""
Obo Car Simulation Library - Single File Version
A lightweight Python library for simulating car dynamics and physics.
Designed specifically for Pyodide in browser environments.

This file contains the complete obocar library in a single module
that can be easily loaded into Pyodide.
"""

import random
import math
import time
from typing import Dict, Tuple, List, Optional, Any, Union

# Try to import JavaScript integration
try:
    from js import window
    IN_BROWSER = True
except ImportError:
    IN_BROWSER = False
    print("Warning: Running outside browser environment. Some features may not work.")


import random
import math
import time
from typing import Dict, Tuple, List, Optional, Any

# Flag to detect if we're running in the browser
try:
    from js import window
    IN_BROWSER = True
    print("✅ Running in browser environment with JavaScript bridge")
except ImportError:
    IN_BROWSER = False
    print("⚠️ Running outside browser environment. Some features may not work.")


class OboChar:
    """
    Main vehicle class for Obo Car simulation.
    Provides methods for movement, sensors, and status monitoring.
    Designed to work in Pyodide/browser environments.
    """
    
    def __init__(self):
        """Initialize the Obo Car."""
        self.position = [0.0, 0.0]  # x, y coordinates
        self.angle = 0.0  # heading in degrees (0 = north)
        self.speed = 0.0  # current speed
        self.max_speed = 10.0  # maximum speed units per second
        self.battery_level = 100.0  # battery percentage
        self.total_distance = 0.0  # total distance traveled
        self.sensor_range = 20.0  # sensor detection range
        self.obstacles = self._generate_random_obstacles()
        self._event_log = []  # Track events for debugging
        
        # Reset car position in 3D scene if in browser
        if IN_BROWSER:
            try:
                window.oboCarAPI.reset()
                print("✅ Connected to 3D simulation environment")
            except Exception as e:
                print(f"⚠️ Could not connect to 3D simulation: {e}")
                print("Will run in standalone mode")
        
    def _generate_random_obstacles(self) -> List[Tuple[float, float]]:
        """Generate random obstacles in the environment."""
        obstacles = []
        # Create some interesting obstacle patterns
        obstacle_patterns = [
            # Wall pattern
            [(10, i) for i in range(0, 20, 2)],
            # Scattered obstacles
            [(random.uniform(-30, 30), random.uniform(-30, 30)) for _ in range(8)],
            # Circle pattern
            [(15 * math.cos(math.radians(i)), 15 * math.sin(math.radians(i))) 
             for i in range(0, 360, 45)]
        ]
        
        # Randomly choose a pattern
        chosen_pattern = random.choice(obstacle_patterns)
        obstacles.extend(chosen_pattern)
        
        return obstacles
        
    def _sync_with_3d_scene(self):
        """Synchronize internal state with 3D scene when in browser mode"""
        if IN_BROWSER:
            try:
                # Two-way synchronization:
                # First, debug log any issues with simulation state
                prev_pos = None
                prev_angle = None
                try:
                    prev_pos = window.oboCarAPI.getPosition()
                    prev_angle = window.oboCarAPI.getRotation()
                    if prev_pos and prev_angle:
                        # Account for coordinate system differences in position and angle
                        # Python uses [x, y] for position where:
                        # - x is left/right
                        # - y is forward/backward
                        # 3D scene uses [x, y, z] where:
                        # - x is left/right (same as Python's x)
                        # - y is up/down (not used in Python's 2D system)
                        # - z is forward/backward (corresponds to Python's y)
                        pos_diff = abs(prev_pos[0] - self.position[0]) + abs(prev_pos[2] - self.position[1])
                        
                        # ENHANCED DEBUG: Calculate scaling factors to help diagnose coordinate mapping
                        x_ratio = prev_pos[0] / self.position[0] if self.position[0] != 0 else 1.0
                        z_ratio = prev_pos[2] / self.position[1] if self.position[1] != 0 else 1.0
                        angle_ratio = prev_angle / self.angle if self.angle != 0 else 1.0
                        
                        # 3D angles and positions may need different scaling
                        if pos_diff > 0.1 or abs(prev_angle - self.angle) > 0.1:
                            print(f"⚠️ 3D scene and Python state mismatch detected!")
                            print(f"   JS: pos=[{prev_pos[0]:.1f}, {prev_pos[2]:.1f}], angle={prev_angle:.1f}°")
                            print(f"   PY: pos=[{self.position[0]:.1f}, {self.position[1]:.1f}], angle={self.angle:.1f}°")
                            print(f"   Scale factors: x={x_ratio:.2f}, z={z_ratio:.2f}, angle={angle_ratio:.2f}")
                except Exception as e:
                    print(f"⚠️ Error checking state differences: {e}")
                
                # Force update 3D scene with our Python state
                if hasattr(window.oboCarAPI, "updateState"):
                    # updateState now handles coordinate system differences
                    # Pass Python coordinates and angle directly
                    window.oboCarAPI.updateState(self.position[0], self.position[1], self.angle)
                    print(f"🔄 Synced 3D scene with Python state: pos=[{self.position[0]:.1f}, {self.position[1]:.1f}], angle={self.angle:.1f}°")
                else:
                    print("⚠️ updateState method not available for 3D sync")
                    
                # 2. Then get all state from 3D scene to ensure consistency
                pos = window.oboCarAPI.getPosition()
                if pos:
                    # Only update x and z as they correspond to our 2D x, y
                    self.position[0] = float(pos[0])
                    self.position[1] = float(pos[2])
                
                # Get rotation from 3D scene
                rot = window.oboCarAPI.getRotation() if hasattr(window.oboCarAPI, "getRotation") else None
                if rot:
                    self.angle = float(rot)
                    
                # Get battery from 3D scene
                bat = window.oboCarAPI.getBattery() if hasattr(window.oboCarAPI, "getBattery") else None
                if bat:
                    self.battery_level = float(bat)
                    
                # Get distance from 3D scene
                dist = window.oboCarAPI.getDistanceTraveled() if hasattr(window.oboCarAPI, "getDistanceTraveled") else None
                if dist:
                    self.total_distance = float(dist)
                    
                print(f"✅ Synchronized with 3D scene")
            except Exception as e:
                print(f"⚠️ Error synchronizing with 3D scene: {e}")
    
    def _log_event(self, event: str):
        """Log an event for debugging purposes."""
        self._event_log.append({
            'timestamp': time.time(),
            'event': event,
            'position': tuple(self.position),
            'angle': self.angle,
            'battery': self.battery_level
        })
    
    def forward(self, distance: float) -> 'OboChar':
        """
        Move the car forward by the specified distance.
        
        Args:
            distance: Distance to move forward (in units)
            
        Returns:
            Self for method chaining
        """
        print(f"🚗 Moving forward {distance} units...")
        self._log_event(f"forward({distance})")
        
        # Connect to 3D visualization if in browser
        if IN_BROWSER:
            try:
                print(f"🔗 Connecting to 3D scene: calling window.oboCarAPI.move({distance})")
                if hasattr(window, 'oboCarAPI') and hasattr(window.oboCarAPI, 'move'):
                    print(f"✅ Found oboCarAPI.move method")
                    window.oboCarAPI.move(distance)
                    print(f"✅ Called oboCarAPI.move({distance})")
                else:
                    available_attrs = dir(window.oboCarAPI) if hasattr(window, 'oboCarAPI') else []
                    print(f"❌ oboCarAPI not properly initialized. Available methods: {available_attrs}")
            except Exception as e:
                print(f"⚠️ Error connecting to 3D scene: {e}")
                import traceback
                traceback.print_exc()
        
        # Calculate new position for Python-side simulation
        angle_rad = math.radians(self.angle)
        new_x = self.position[0] + distance * math.sin(angle_rad)
        new_y = self.position[1] + distance * math.cos(angle_rad)
        
        self.position = [new_x, new_y]
        self.total_distance += abs(distance)
        
        # Consume battery (1% per unit of distance)
        battery_consumption = abs(distance) * 1.0
        self.battery_level = max(0, self.battery_level - battery_consumption)
        
        print(f"   Position: ({self.position[0]:.1f}, {self.position[1]:.1f})")
        
        # Check for collisions
        self._check_collisions()
        
        # Synchronize with 3D scene after movement
        if IN_BROWSER:
            self._sync_with_3d_scene()
        
        return self
    
    def backward(self, distance: float) -> 'OboChar':
        """
        Move the car backward by the specified distance.
        
        Args:
            distance: Distance to move backward (in units)
            
        Returns:
            Self for method chaining
        """
        print(f"🔄 Moving backward {distance} units...")
        
        # Connect to 3D visualization if in browser
        if IN_BROWSER:
            try:
                window.oboCarAPI.move(-distance)
                # Synchronize with 3D scene after movement
                self._sync_with_3d_scene()
            except Exception as e:
                print(f"⚠️ Error connecting to 3D scene: {e}")
                
        # Use forward with negative distance for Python-side simulation
        return self.forward(-distance)
    
    def left(self, degrees: float) -> 'OboChar':
        """
        Turn the car left by the specified degrees.
        
        Args:
            degrees: Degrees to turn left
            
        Returns:
            Self for method chaining
        """
        print(f"⬅️ Turning left {degrees} degrees...")
        self._log_event(f"left({degrees})")
        
        # Connect to 3D visualization if in browser
        if IN_BROWSER:
            try:
                window.oboCarAPI.rotate(-degrees)
            except Exception as e:
                print(f"⚠️ Error connecting to 3D scene: {e}")
        
        # Update internal state
        self.angle = (self.angle - degrees) % 360
        
        # Small battery consumption for turning
        self.battery_level = max(0, self.battery_level - 0.5)
        print(f"   New heading: {self.angle:.1f}°")
        
        # Synchronize with 3D scene after rotation
        if IN_BROWSER:
            self._sync_with_3d_scene()
        
        return self
    
    def right(self, degrees: float) -> 'OboChar':
        """
        Turn the car right by the specified degrees.
        
        Args:
            degrees: Degrees to turn right
            
        Returns:
            Self for method chaining
        """
        print(f"➡️ Turning right {degrees} degrees...")
        self._log_event(f"right({degrees})")
        
        # Connect to 3D visualization if in browser
        if IN_BROWSER:
            try:
                window.oboCarAPI.rotate(degrees)
            except Exception as e:
                print(f"⚠️ Error connecting to 3D scene: {e}")
        
        # Update internal state
        self.angle = (self.angle + degrees) % 360
        
        # Small battery consumption for turning
        self.battery_level = max(0, self.battery_level - 0.5)
        print(f"   New heading: {self.angle:.1f}°")
        
        # Synchronize with 3D scene after rotation
        if IN_BROWSER:
            self._sync_with_3d_scene()
        
        return self
    
    def sensor(self, direction: str = 'front') -> float:
        """
        Get distance reading from the specified sensor.
        
        Args:
            direction: Sensor direction ('front', 'back', 'left', 'right')
            
        Returns:
            Distance to nearest obstacle in meters
        """
        # Check for valid direction
        valid_directions = ['front', 'right', 'back', 'left']
        if direction not in valid_directions:
            raise ValueError(f"Invalid sensor direction: {direction}. Use: {valid_directions}")
        
        # Get sensor reading from 3D simulation if in browser
        if IN_BROWSER:
            try:
                # Ensure 3D scene is in sync before getting sensor reading
                self._sync_with_3d_scene()
                
                reading = window.oboCarAPI.getSensor(direction)
                if reading is not None:
                    self._log_event(f"sensor({direction}) = {reading:.1f}")
                    return reading
            except Exception as e:
                print(f"⚠️ Error getting sensor data from 3D scene: {e}")
                print("Using simulated sensor values instead")
        
        # Fall back to simulation if not in browser or if there was an error
        sensor_angles = {
            'front': 0,
            'right': 90,
            'back': 180,
            'left': 270
        }
        
        # Calculate sensor angle
        sensor_angle = (self.angle + sensor_angles[direction]) % 360
        sensor_angle_rad = math.radians(sensor_angle)
        
        # Find nearest obstacle in sensor direction
        min_distance = self.sensor_range
        
        for obstacle_x, obstacle_y in self.obstacles:
            # Calculate distance to obstacle
            dx = obstacle_x - self.position[0]
            dy = obstacle_y - self.position[1]
            distance = math.sqrt(dx**2 + dy**2)
            
            # Calculate angle to obstacle
            angle_to_obstacle = math.degrees(math.atan2(dx, dy))
            angle_diff = abs((angle_to_obstacle - sensor_angle + 180) % 360 - 180)
            
            # If obstacle is in sensor cone (±30 degrees) and closer than current min
            if angle_diff <= 30 and distance < min_distance:
                min_distance = distance
        
        # Add some random noise to simulate real sensor
        noise = random.uniform(-0.2, 0.2)
        result = max(0.1, min_distance + noise)
        
        self._log_event(f"sensor({direction}) = {result:.1f}")
        return result
    
    def battery(self) -> float:
        """
        Get current battery level.
        
        Returns:
            Battery level as percentage (0-100)
        """
        # Sync with 3D scene before reporting battery
        if IN_BROWSER:
            self._sync_with_3d_scene()
            
        return round(self.battery_level, 1)
    
    def distance(self) -> float:
        """
        Get total distance traveled.
        
        Returns:
            Total distance traveled in units
        """
        # Sync with 3D scene before reporting distance
        if IN_BROWSER:
            self._sync_with_3d_scene()
            
        return round(self.total_distance, 1)
    
    def wait(self, seconds: float) -> None:
        """
        Wait for the specified number of seconds.
        In Pyodide, this is simulated without blocking.
        
        Args:
            seconds: Time to wait in seconds
        """
        print(f"⏳ Waiting {seconds} seconds...")
        self._log_event(f"wait({seconds})")
        # In browser environment, we simulate the wait without actually blocking
    
    def get_position(self) -> Tuple[float, float]:
        """
        Get current position.
        
        Returns:
            Current (x, y) position
        """
        # Get position from 3D simulation if in browser
        if IN_BROWSER:
            try:
                # Print detailed debug info
                print("🔍 Getting position from 3D simulation...")
                
                # Try to access the JavaScript API
                if hasattr(window, 'oboCarAPI') and hasattr(window.oboCarAPI, 'getPosition'):
                    pos = window.oboCarAPI.getPosition()
                    
                    if pos is not None:
                        print(f"✅ Got position from 3D scene: [{pos[0]}, {pos[1]}, {pos[2]}]")
                        # Return x and z coordinates (ignoring y which is height)
                        return (round(float(pos[0]), 1), round(float(pos[2]), 1))
                    else:
                        print("❌ Position from 3D scene was None")
                else:
                    print("❌ window.oboCarAPI.getPosition not available")
            except Exception as e:
                print(f"⚠️ Error getting position data from 3D scene: {e}")
                import traceback
                traceback.print_exc()
        
        # Fall back to internal state if not in browser or if there was an error
        print(f"⚠️ Using internal position state: ({self.position[0]:.1f}, {self.position[1]:.1f})")
        return (round(self.position[0], 1), round(self.position[1], 1))
    
    def get_heading(self) -> float:
        """
        Get current heading.
        
        Returns:
            Current heading in degrees
        """
        return round(self.angle, 1)
    
    def status(self) -> Dict[str, Any]:
        """
        Get comprehensive status information.
        
        Returns:
            Dictionary containing all status information
        """
        # Get status from 3D simulation if in browser
        if IN_BROWSER:
            try:
                # Ensure 3D scene is in sync before getting status
                self._sync_with_3d_scene()
                
                js_status = window.oboCarAPI.getStatus()
                if js_status is not None:
                    # Convert JavaScript status to Python dictionary
                    return {
                        'position': (js_status.position[0], js_status.position[2]),
                        'heading': js_status.rotation,
                        'battery': js_status.battery,
                        'distance': js_status.distanceTraveled,
                        # Add some additional data from our Python simulation
                        'speed': round(self.speed, 1),
                        'obstacles_nearby': self._count_nearby_obstacles()
                    }
            except Exception as e:
                print(f"⚠️ Error getting status data from 3D scene: {e}")
        
        # Fall back to internal state if not in browser or if there was an error
        return {
            'position': self.get_position(),
            'heading': self.get_heading(),
            'battery': self.battery(),
            'distance': self.distance(),
            'speed': round(self.speed, 1),
            'obstacles_nearby': self._count_nearby_obstacles()
        }
    
    def _check_collisions(self) -> bool:
        """Check if the car has collided with any obstacles."""
        collision_distance = 1.0  # Collision threshold
        
        for obstacle_x, obstacle_y in self.obstacles:
            dx = obstacle_x - self.position[0]
            dy = obstacle_y - self.position[1]
            distance = math.sqrt(dx**2 + dy**2)
            
            if distance < collision_distance:
                print(f"⚠️ COLLISION! Hit obstacle at ({obstacle_x:.1f}, {obstacle_y:.1f})")
                self.battery_level = max(0, self.battery_level - 10)  # Collision penalty
                return True
        
        return False
    
    def _count_nearby_obstacles(self, radius: float = 10.0) -> int:
        """Count obstacles within specified radius."""
        count = 0
        for obstacle_x, obstacle_y in self.obstacles:
            dx = obstacle_x - self.position[0]
            dy = obstacle_y - self.position[1]
            distance = math.sqrt(dx**2 + dy**2)
            
            if distance <= radius:
                count += 1
        
        return count
    
    def get_obstacles(self) -> List[Tuple[float, float]]:
        """
        Get list of all obstacles in the environment.
        
        Returns:
            List of (x, y) obstacle positions
        """
        return self.obstacles.copy()
    
    def add_obstacle(self, x: float, y: float) -> None:
        """
        Add a new obstacle to the environment.
        
        Args:
            x: X coordinate of obstacle
            y: Y coordinate of obstacle
        """
        self.obstacles.append((x, y))
        print(f"🚧 Added obstacle at ({x:.1f}, {y:.1f})")
    
    def get_event_log(self) -> List[Dict]:
        """
        Get the event log for debugging.
        
        Returns:
            List of logged events
        """
        return self._event_log.copy()
    
    def reset(self) -> 'OboChar':
        """
        Reset the car to initial state.
        
        Returns:
            Self for method chaining
        """
        # Reset 3D simulation if in browser
        if IN_BROWSER:
            try:
                window.oboCarAPI.reset()
            except Exception as e:
                print(f"⚠️ Error resetting 3D scene: {e}")
        
        # Reset internal state
        self.position = [0.0, 0.0]
        self.angle = 0.0
        self.speed = 0.0
        self.battery_level = 100.0
        self.total_distance = 0.0
        self.obstacles = self._generate_random_obstacles()
        self._event_log = []
        print("🔄 Car reset to initial state")
        self._log_event("reset()")
        
        return self


# Factory function to create obocar instances
def obocar():
    """Create and return a new OboChar instance."""
    return OboChar()


# Make the main classes and functions available at module level
__version__ = "0.1.0"
__author__ = "Obo Car Team"
__all__ = ['obocar', 'OboChar']


# For testing/demo purposes
if __name__ == "__main__":
    # Basic demo that matches the user's original code
    print("🚗 Obo Car Library - Browser Demo")
    
    # Import the Obo Car library (simulated since we're in the same file)
    # from obocar import obocar
    
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
    
    print("Demo completed successfully!")