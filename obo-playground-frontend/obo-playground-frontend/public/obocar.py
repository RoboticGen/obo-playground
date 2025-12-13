"""
OBOCar 3D Simulation Library - Version 1.0.0
=============================================

This is a lightweight simulation library for controlling a virtual OBOCar in 3D environments.
Provides essential motor control and distance sensors for autonomous car simulation.

Based on the OBOCar SDK by Sanjula Gathsara - RoboticGen (Pvt) Ltd

Features:
---------
- Motor control simulation for forward, backward, and turning motions
- Distance sensor readings (front, left, right)
- State tracking for 3D visualization

Usage Example:
--------------
    from obocar import OBOCar
    import time
    
    car = OBOCar()
    
    while True:
        front_distance = car.get_front_distance()
        if front_distance < 20:
            car.move_backward(512)
            time.sleep(0.3)
            car.turn_left(512)
            time.sleep(0.5)
        else:
            car.move_forward(speed=512)
        time.sleep(0.1)
"""

import time
from typing import Optional, Dict, Any


class OBOCar:
    """
    Simulation version of OBOCar - Main class for controlling a virtual OBO car
    Provides the same API as the hardware version for 3D software simulation
    """
    
    # Maximum speed value for motors
    MAX_SPEED = 512
    
    def __init__(self):
        """Initialize the virtual OBO car for 3D simulation."""
        # Motor state
        self.left_motor_speed = 0
        self.right_motor_speed = 0
        self.left_motor_direction = 0  # 0: stop, 1: forward, -1: backward
        self.right_motor_direction = 0
        
        # Distance sensor state
        self.front_distance = 100.0
        self.left_distance = 100.0
        self.right_distance = 100.0
        
        # Position and orientation (for 3D simulation)
        self.position = {'x': 0.0, 'y': 0.0, 'z': 0.0}
        self.rotation = {'yaw': 0.0, 'pitch': 0.0, 'roll': 0.0}
        
        # Movement history for debugging/visualization
        self.movement_history = []
    
    # ============================
    # Motor Control Methods
    # ============================
    
    def stop(self):
        """Stop all car movement immediately."""
        self.left_motor_speed = 0
        self.right_motor_speed = 0
        self.left_motor_direction = 0
        self.right_motor_direction = 0
        self._log_movement("stop")
    
    def move_forward(self, speed: Optional[int] = None, 
                     speed_left: Optional[int] = None, 
                     speed_right: Optional[int] = None):
        """
        Move the car forward at specified speed.
        
        Args:
            speed: Speed for both motors (0-512)
            speed_left: Speed for left motor (0-512)
            speed_right: Speed for right motor (0-512)
        """
        if speed is not None:
            speed_left = speed
            speed_right = speed
        else:
            if speed_left is None:
                speed_left = self.MAX_SPEED
            if speed_right is None:
                speed_right = self.MAX_SPEED
        
        # Limit speeds
        speed_left = max(0, min(self.MAX_SPEED, speed_left))
        speed_right = max(0, min(self.MAX_SPEED, speed_right))
        
        self.left_motor_speed = speed_left
        self.right_motor_speed = speed_right
        self.left_motor_direction = 1
        self.right_motor_direction = 1
        self._log_movement("forward", speed_left, speed_right)
    
    def move_backward(self, speed: Optional[int] = None,
                      speed_left: Optional[int] = None,
                      speed_right: Optional[int] = None):
        """
        Move the car backward at specified speed.
        
        Args:
            speed: Speed for both motors (0-512)
            speed_left: Speed for left motor (0-512)
            speed_right: Speed for right motor (0-512)
        """
        if speed is not None:
            speed_left = speed
            speed_right = speed
        else:
            if speed_left is None:
                speed_left = self.MAX_SPEED
            if speed_right is None:
                speed_right = self.MAX_SPEED
        
        # Limit speeds
        speed_left = max(0, min(self.MAX_SPEED, speed_left))
        speed_right = max(0, min(self.MAX_SPEED, speed_right))
        
        self.left_motor_speed = speed_left
        self.right_motor_speed = speed_right
        self.left_motor_direction = -1
        self.right_motor_direction = -1
        self._log_movement("backward", speed_left, speed_right)
    
    def turn_left(self, speed: Optional[int] = None,
                  speed_left: Optional[int] = None,
                  speed_right: Optional[int] = None):
        """
        Turn the car left.
        
        Args:
            speed: Speed for both motors (0-512)
            speed_left: Speed for left motor (0-512)
            speed_right: Speed for right motor (0-512)
        """
        if speed is not None:
            speed_left = speed
            speed_right = speed
        else:
            if speed_left is None:
                speed_left = self.MAX_SPEED
            if speed_right is None:
                speed_right = self.MAX_SPEED
        
        # Limit speeds
        speed_left = max(0, min(self.MAX_SPEED, speed_left))
        speed_right = max(0, min(self.MAX_SPEED, speed_right))
        
        self.left_motor_speed = speed_left
        self.right_motor_speed = speed_right
        self.left_motor_direction = -1  # Left backward
        self.right_motor_direction = 1   # Right forward
        self._log_movement("turn_left", speed_left, speed_right)
    
    def turn_right(self, speed: Optional[int] = None,
                   speed_left: Optional[int] = None,
                   speed_right: Optional[int] = None):
        """
        Turn the car right.
        
        Args:
            speed: Speed for both motors (0-512)
            speed_left: Speed for left motor (0-512)
            speed_right: Speed for right motor (0-512)
        """
        if speed is not None:
            speed_left = speed
            speed_right = speed
        else:
            if speed_left is None:
                speed_left = self.MAX_SPEED
            if speed_right is None:
                speed_right = self.MAX_SPEED
        
        # Limit speeds
        speed_left = max(0, min(self.MAX_SPEED, speed_left))
        speed_right = max(0, min(self.MAX_SPEED, speed_right))
        
        self.left_motor_speed = speed_left
        self.right_motor_speed = speed_right
        self.left_motor_direction = 1    # Left forward
        self.right_motor_direction = -1  # Right backward
        self._log_movement("turn_right", speed_left, speed_right)
    
    def left_motor_forward(self, speed: Optional[int] = None):
        """Move left motor forward at specified speed."""
        if speed is None:
            speed = self.MAX_SPEED
        speed = max(0, min(self.MAX_SPEED, speed))
        
        self.left_motor_speed = speed
        self.left_motor_direction = 1
        self._log_movement("left_motor_forward", speed)
    
    def left_motor_backward(self, speed: Optional[int] = None):
        """Move left motor backward at specified speed."""
        if speed is None:
            speed = self.MAX_SPEED
        speed = max(0, min(self.MAX_SPEED, speed))
        
        self.left_motor_speed = speed
        self.left_motor_direction = -1
        self._log_movement("left_motor_backward", speed)
    
    def right_motor_forward(self, speed: Optional[int] = None):
        """Move right motor forward at specified speed."""
        if speed is None:
            speed = self.MAX_SPEED
        speed = max(0, min(self.MAX_SPEED, speed))
        
        self.right_motor_speed = speed
        self.right_motor_direction = 1
        self._log_movement("right_motor_forward", speed)
    
    def right_motor_backward(self, speed: Optional[int] = None):
        """Move right motor backward at specified speed."""
        if speed is None:
            speed = self.MAX_SPEED
        speed = max(0, min(self.MAX_SPEED, speed))
        
        self.right_motor_speed = speed
        self.right_motor_direction = -1
        self._log_movement("right_motor_backward", speed)
    
    # ============================
    # Sensor Methods
    # ============================
    
    def get_front_distance(self) -> float:
        """
        Get the distance to the nearest obstacle in front of the car.
        
        Returns:
            float: Distance in centimeters
        """
        # In simulation, return stored value or generate random value
        return self.front_distance
    
    def get_left_distance(self) -> float:
        """
        Get the distance to the nearest obstacle on the left.
        
        Returns:
            float: Distance in centimeters
        """
        return self.left_distance
    
    def get_right_distance(self) -> float:
        """
        Get the distance to the nearest obstacle on the right.
        
        Returns:
            float: Distance in centimeters
        """
        return self.right_distance
    
    def set_front_distance(self, distance: float):
        """Set the front distance sensor value (for simulation control)."""
        self.front_distance = distance
    
    def set_left_distance(self, distance: float):
        """Set the left distance sensor value (for simulation control)."""
        self.left_distance = distance
    
    def set_right_distance(self, distance: float):
        """Set the right distance sensor value (for simulation control)."""
        self.right_distance = distance
    
    # ============================
    # Simulation-specific Methods
    # ============================
    
    def get_motor_state(self) -> Dict[str, Any]:
        """
        Get current motor state for 3D visualization.
        
        Returns:
            dict: Motor state information
        """
        return {
            'left': {
                'speed': self.left_motor_speed,
                'direction': self.left_motor_direction
            },
            'right': {
                'speed': self.right_motor_speed,
                'direction': self.right_motor_direction
            }
        }
    
    def get_state(self) -> Dict[str, Any]:
        """
        Get complete car state for 3D visualization.
        
        Returns:
            dict: Complete car state
        """
        return {
            'motors': self.get_motor_state(),
            'sensors': {
                'front': self.front_distance,
                'left': self.left_distance,
                'right': self.right_distance
            },
            'position': self.position.copy(),
            'rotation': self.rotation.copy()
        }
    
    def update_position(self, x: float, y: float, z: float):
        """Update car position in 3D space."""
        self.position = {'x': x, 'y': y, 'z': z}
    
    def update_rotation(self, yaw: float, pitch: float = 0.0, roll: float = 0.0):
        """Update car rotation in 3D space."""
        self.rotation = {'yaw': yaw, 'pitch': pitch, 'roll': roll}
    
    def _log_movement(self, action: str, *args):
        """Log movement for debugging/history."""
        entry = {
            'timestamp': time.time(),
            'action': action,
            'args': args,
            'motor_state': self.get_motor_state()
        }
        self.movement_history.append(entry)
        # Keep only last 100 movements
        if len(self.movement_history) > 100:
            self.movement_history.pop(0)


