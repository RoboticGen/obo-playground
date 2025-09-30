
import random
import math
import time
from typing import Dict, Tuple, List, Optional
from js import window

class OboCar:
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
        self.total_distance = 0.0  # total distance traveled
        self._event_log = []  # Track events for debugging
        
        # Register this instance globally for synchronization
        try:
            import builtins
            builtins._obocar_instance = self
        except:
            pass
        
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
        print(f"⬅️ Queuing left turn {degrees} degrees...")
        self._log_event(f"left({degrees})")
        
        # Queue the rotation command instead of applying immediately
        if self._is_browser_env():
            try:
                from js import window
                # For left turn: send negative angle to trigger turn_left command
                print(f"🔄 Sending rotation command to 3D scene: rotate({-degrees})")
                window.oboCarAPI.rotate(-degrees)
                
                # Update Python model only after the command is queued
                # Don't update immediately - let the animation system handle it
                print(f"   Left turn command queued")
            except Exception as e:
                print(f"⚠️ Error syncing rotation with 3D scene: {e}")
                # Don't update Python angle - let the 3D scene handle rotation
                print(f"   Rotation command failed, relying on 3D scene synchronization")
        else:
            # No browser environment, use Python calculation
            self.angle = (self.angle - degrees) % 360
            print(f"   New heading: {self.angle:.1f}°")
    
    def right(self, degrees: float) -> None:
        """
        Turn the car right by the specified degrees.
        
        Args:
            degrees: Degrees to turn right
        """
        print(f"➡️ Queuing right turn {degrees} degrees...")
        self._log_event(f"right({degrees})")
        
        # Queue the rotation command instead of applying immediately
        if self._is_browser_env():
            try:
                from js import window
                # For right turn: send positive angle to trigger turn_right command
                print(f"🔄 Sending rotation command to 3D scene: rotate({degrees})")
                window.oboCarAPI.rotate(degrees)
                
                # Update Python model only after the command is queued
                # Don't update immediately - let the animation system handle it
                print(f"   Right turn command queued")
            except Exception as e:
                print(f"⚠️ Error syncing rotation with 3D scene: {e}")
                # Don't update Python angle - let the 3D scene handle rotation
                print(f"   Rotation command failed, relying on 3D scene synchronization")
        else:
            # No browser environment, use Python calculation
            self.angle = (self.angle + degrees) % 360
            print(f"   New heading: {self.angle:.1f}°")
    
    
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
    
    def get_position(self):
        return self.position
    


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

    def _check_collisions(self) ->bool:
        return False

def obocar():
    """Create and return a new OboChar instance."""
    return OboCar()

# Make the main classes and functions available at module level
__version__ = "0.1.0"
__author__ = "Obo Car Team"
__all__ = ['obocar']

