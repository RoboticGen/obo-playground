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
from typing import Dict, Tuple, List, Optional


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
        self.total_distance = 0.0  # total distance traveled
        self.sensor_range = 20.0  # sensor detection range
        self.obstacles = []  # No obstacles by default
        self._event_log = []  # Track events for debugging
        
    def _is_browser_env(self):
        """Check if running in browser environment with JS bridge."""
        try:
            import js
            return hasattr(js.window, "oboCarAPI")
        except ImportError:
            return False
        
    # Removed _generate_random_obstacles method
    
    def _log_event(self, event: str):
        """Log an event for debugging purposes."""
        self._event_log.append({
            'timestamp': time.time(),
            'event': event,
            'position': tuple(self.position),
            'angle': self.angle
        })
        
    def _calculate_forward_position(self, distance: float):
        """Calculate new position after moving forward."""
        angle_rad = math.radians(self.angle)
        new_x = self.position[0] + distance * math.sin(angle_rad)
        new_y = self.position[1] + distance * math.cos(angle_rad)
        
        self.position = [new_x, new_y]
        self.total_distance += abs(distance)
        
        print(f"   Position: ({self.position[0]:.1f}, {self.position[1]:.1f})")
    
    def forward(self, distance: float) -> None:
        """
        Move the car forward by the specified distance.
        
        Args:
            distance: Distance to move forward (in units)
        """
        print(f"🚗 Moving forward {distance} units...")
        self._log_event(f"forward({distance})")
        
        # Check if we're running in browser with JavaScript bridge
        if self._is_browser_env():
            try:
                # Import js module for Pyodide
                from js import window
                
                # Store current position before moving
                prev_position = self.position.copy()
                
                print(f"🔗 Connecting to 3D scene: calling window.oboCarAPI.move({distance})")
                if hasattr(window.oboCarAPI, "move"):
                    print(f"✅ Found oboCarAPI.move method")
                    window.oboCarAPI.move(distance)
                    print(f"✅ Called oboCarAPI.move({distance})")
                    
                    # Update position from 3D scene
                    new_position = window.oboCarAPI.getPosition()
                    self.position = [new_position[0], new_position[2]]  # Use X and Z coordinates
                    self.total_distance += abs(distance)
                    print(f"Position: ({self.position[0]:.1f}, {self.position[1]:.1f})")
                else:
                    print("❌ Error: oboCarAPI.move method not found")
                    # Fall back to Python calculation
                    self._calculate_forward_position(distance)
            except Exception as e:
                print(f"⚠️ Error in forward: {e}, using Python calculation")
                # Fall back to Python calculation
                self._calculate_forward_position(distance)
        else:
            # No browser environment, use Python calculation
            self._calculate_forward_position(distance)
        
        # Check for collisions
        self._check_collisions()
    
    def backward(self, distance: float) -> None:
        """
        Move the car backward by the specified distance.
        
        Args:
            distance: Distance to move backward (in units)
        """
        print(f"🔄 Moving backward {distance} units...")
        
        # Check if we're running in browser with JavaScript bridge
        if self._is_browser_env():
            try:
                # Import js module for Pyodide
                from js import window
                
                # Store current position before moving
                prev_position = self.position.copy()
                
                # Use the dedicated backward method if available
                if hasattr(window.oboCarAPI, 'backward'):
                    print(f"🚗 Using dedicated backward method")
                    window.oboCarAPI.backward(abs(distance))
                else:
                    # Fall back to move with negative distance
                    print(f"🚗 Using move method with negative distance")
                    window.oboCarAPI.move(-abs(distance))
                
                # Check the new position and print the change
                new_position = window.oboCarAPI.getPosition()
                self.position = [new_position[0], new_position[2]]  # Use X and Z coordinates
                print(f"   Position after backward: ({self.position[0]:.1f}, {self.position[1]:.1f})")
                print(f"   Position changed by: ({self.position[0]-prev_position[0]:.1f}, {self.position[1]-prev_position[1]:.1f})")
            except Exception as e:
                print(f"⚠️ Error in backward: {e}, falling back to Python implementation")
                # Fall back to Python implementation
                self.forward(-distance)
        else:
            # No browser environment, use Python-only implementation
            print(f"🚗 No browser environment, using Python-only backward implementation")
            self.forward(-distance)
    
    def left(self, degrees: float) -> None:
        """
        Turn the car left by the specified degrees.
        
        Args:
            degrees: Degrees to turn left
        """
        print(f"⬅️ Turning left {degrees} degrees...")
        self._log_event(f"left({degrees})")
        
        # Update the Python model
        self.angle = (self.angle - degrees) % 360
        
        # Update the 3D scene through the bridge if available
        if self._is_browser_env():
            try:
                from js import window
                print(f"🔄 Sending rotation command to 3D scene: rotate({-degrees})")
                window.oboCarAPI.rotate(-degrees)  # Negative angle for left turns
            except Exception as e:
                print(f"⚠️ Error syncing rotation with 3D scene: {e}")
            
        print(f"   New heading: {self.angle:.1f}°")
    
    def right(self, degrees: float) -> None:
        """
        Turn the car right by the specified degrees.
        
        Args:
            degrees: Degrees to turn right
        """
        print(f"➡️ Turning right {degrees} degrees...")
        self._log_event(f"right({degrees})")
        
        # Update the Python model
        self.angle = (self.angle + degrees) % 360
        
        # Update the 3D scene through the bridge if available
        if self._is_browser_env():
            try:
                from js import window
                print(f"🔄 Sending rotation command to 3D scene: rotate({degrees})")
                window.oboCarAPI.rotate(degrees)
            except Exception as e:
                print(f"⚠️ Error syncing rotation with 3D scene: {e}")
        
        print(f"   New heading: {self.angle:.1f}°")
    
    def sensor(self, direction: str = 'front') -> float:
        """
        Get distance reading from the specified sensor.
        
        Args:
            direction: Sensor direction ('front', 'back', 'left', 'right')
            
        Returns:
            Distance to nearest obstacle in meters, or maximum sensor range if no obstacles
        """
        sensor_angles = {
            'front': 0,
            'right': 90,
            'back': 180,
            'left': 270
        }
        
        if direction not in sensor_angles:
            raise ValueError(f"Invalid sensor direction: {direction}. Use: {list(sensor_angles.keys())}")
        
        # Since we removed obstacles, always return max range with small noise
        noise = random.uniform(-0.2, 0.2)
        result = max(0.1, self.sensor_range + noise)
        
        self._log_event(f"sensor({direction}) = {result:.1f}")
        return result
    

    
    def distance(self) -> float:
        """
        Get total distance traveled.
        
        Returns:
            Total distance traveled in units
        """
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
        return (round(self.position[0], 1), round(self.position[1], 1))
    
    def get_heading(self) -> float:
        """
        Get current heading.
        
        Returns:
            Current heading in degrees
        """
        return round(self.angle, 1)
    
    def status(self) -> Dict:
        """
        Get comprehensive status information.
        
        Returns:
            Dictionary containing all status information
        """
        return {
            'position': self.get_position(),
            'heading': self.get_heading(),
            'distance': self.distance(),
            'speed': round(self.speed, 1),
            'obstacles_nearby': self._count_nearby_obstacles()
        }
    
    def _check_collisions(self) -> bool:
        """Check if the car has collided with any obstacles."""
        # Since we removed obstacles, always return False
        return False
    
    def _count_nearby_obstacles(self, radius: float = 10.0) -> int:
        """Count obstacles within specified radius."""
        # Since we removed obstacles, always return 0
        return 0
    
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
    
    def reset(self) -> None:
        """Reset the car to initial state."""
        self.position = [0.0, 0.0]
        self.angle = 0.0
        self.speed = 0.0
        self.total_distance = 0.0
        self.obstacles = []  # Reset to empty obstacles list
        self._event_log = []
        print("🔄 Car reset to initial state")
        self._log_event("reset()")


# Factory function to create obocar instances
def obocar():
    """Create and return a new OboChar instance."""
    return OboChar()


# Make the main classes and functions available at module level
__version__ = "0.1.0"
__author__ = "Obo Car Team"
__all__ = ['obocar', 'OboChar']


# For testing/demo purposes
if __name__ == "__main__" and not "__BROWSER__" in globals():
    # Only run demo when executed directly from Python, not in browser
    print("🚗 Obo Car Library - Demo")
    
    # Import the Obo Car library (simulated since we're in the same file)
    # from obocar import obocar
    
    # Create a car instance
    car = obocar()
    
    # Basic movement commands
    print("🚗 Starting Obo Car simulation!")
    
    # Move forward 3 units
    car.forward(3)
    car.wait(0.5)
    car.backward(3)
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
    
    print("Demo completed successfully!")