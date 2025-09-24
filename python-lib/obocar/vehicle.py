"""
Vehicle class for the Obo Car simulation.
Compatible with Pyodide - uses only standard library modules.
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
        self.battery_level = 100.0  # battery percentage
        self.total_distance = 0.0  # total distance traveled
        self.sensor_range = 20.0  # sensor detection range
        self.obstacles = self._generate_random_obstacles()
        self._event_log = []  # Track events for debugging
        
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
    
    def _log_event(self, event: str):
        """Log an event for debugging purposes."""
        self._event_log.append({
            'timestamp': time.time(),
            'event': event,
            'position': tuple(self.position),
            'angle': self.angle,
            'battery': self.battery_level
        })
    
    def forward(self, distance: float) -> None:
        """
        Move the car forward by the specified distance.
        
        Args:
            distance: Distance to move forward (in units)
        """
        print(f"🚗 Moving forward {distance} units...")
        self._log_event(f"forward({distance})")
        
        # Calculate new position
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
    
    def backward(self, distance: float) -> None:
        """
        Move the car backward by the specified distance.
        
        Args:
            distance: Distance to move backward (in units)
        """
        print(f"🔄 Moving backward {distance} units...")
        self.forward(-distance)
    
    def left(self, degrees: float) -> None:
        """
        Turn the car left by the specified degrees.
        
        Args:
            degrees: Degrees to turn left
        """
        print(f"⬅️ Turning left {degrees} degrees...")
        self._log_event(f"left({degrees})")
        self.angle = (self.angle - degrees) % 360
        
        # Small battery consumption for turning
        self.battery_level = max(0, self.battery_level - 0.5)
        print(f"   New heading: {self.angle:.1f}°")
    
    def right(self, degrees: float) -> None:
        """
        Turn the car right by the specified degrees.
        
        Args:
            degrees: Degrees to turn right
        """
        print(f"➡️ Turning right {degrees} degrees...")
        self._log_event(f"right({degrees})")
        self.angle = (self.angle + degrees) % 360
        
        # Small battery consumption for turning
        self.battery_level = max(0, self.battery_level - 0.5)
        print(f"   New heading: {self.angle:.1f}°")
    
    def sensor(self, direction: str = 'front') -> float:
        """
        Get distance reading from the specified sensor.
        
        Args:
            direction: Sensor direction ('front', 'back', 'left', 'right')
            
        Returns:
            Distance to nearest obstacle in meters
        """
        sensor_angles = {
            'front': 0,
            'right': 90,
            'back': 180,
            'left': 270
        }
        
        if direction not in sensor_angles:
            raise ValueError(f"Invalid sensor direction: {direction}. Use: {list(sensor_angles.keys())}")
        
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
        return round(self.battery_level, 1)
    
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
        # Real implementation would use setTimeout in JavaScript
        
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
    
    def reset(self) -> None:
        """Reset the car to initial state."""
        self.position = [0.0, 0.0]
        self.angle = 0.0
        self.speed = 0.0
        self.battery_level = 100.0
        self.total_distance = 0.0
        self.obstacles = self._generate_random_obstacles()
        self._event_log = []
        print("🔄 Car reset to initial state")
        self._log_event("reset()")