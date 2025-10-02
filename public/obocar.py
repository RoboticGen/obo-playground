
import random
import math
import time
from typing import Dict, Tuple, List, Optional, Callable
from js import window

# Flag to check if we're in a browser environment
IN_BROWSER = False
try:
    from js import window
    IN_BROWSER = hasattr(window, "oboCarAPI")
except:
    pass

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
        return IN_BROWSER
        
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
        
    # Event-driven methods for non-blocking execution
    def run_loop(self, loop_func: Callable, max_iterations: int = 1000):
        """
        Run a function in an event loop without blocking the UI
        
        Args:
            loop_func: The function to call on each iteration
            max_iterations: Safety limit for max iterations
            
        Returns:
            Loop ID that can be used to cancel the loop
        """
        if not self._is_browser_env():
            # In non-browser environments, run synchronously with safety limit
            iteration = 0
            while iteration < max_iterations:
                try:
                    should_continue = loop_func()
                    if should_continue is False:
                        break
                except Exception as e:
                    print(f"Error in loop: {e}")
                    break
                iteration += 1
            return None
        
        # In browser environment, use the event system
        remaining_iterations = [max_iterations]  # Use list for mutable reference
        iteration_count = [0]  # Track the current iteration
        
        def step_function():
            if remaining_iterations[0] <= 0:
                print(f"⚠️ Maximum iterations ({max_iterations}) reached, stopping loop")
                return False
            
            try:
                # Print iteration information
                iteration_count[0] += 1
                print(f"🔄 Executing loop iteration #{iteration_count[0]}")
                
                # Execute the loop body - capture the result
                should_continue = loop_func()
                remaining_iterations[0] -= 1
                
                # If the loop function returns False explicitly, stop the loop
                if should_continue is False:
                    print("🛑 Loop function returned False, stopping loop")
                    return False
                
                # Continue the loop after a delay
                print("⏱️ Waiting for commands to complete before next iteration...")
                return True
                
            except StopIteration:
                print("🛑 StopIteration raised, stopping loop")
                return False
            except Exception as e:
                print(f"❌ Error in event loop: {e}")
                import traceback
                traceback.print_exc()
                return False
        
        # Register with JavaScript event system
        try:
            from js import window
            # Make sure car is ready for movement
            if hasattr(window, 'eventBus'):
                window.eventBus.emit('simulation:state:change', True)
                
            loop_id = window.oboCarAPI.registerLoopCallback(step_function)
            print(f"✅ Event loop started with ID: {loop_id}")
            return loop_id
        except Exception as e:
            print(f"Error registering event loop: {e}")
            return None
        
    def cancel_loop(self, loop_id):
        """Cancel a running event loop"""
        if not self._is_browser_env() or not loop_id:
            return False
            
        try:
            from js import window
            window.oboCarAPI.clearLoopCallback(loop_id)
            print(f"Cancelled event loop with ID: {loop_id}")
            return True
        except Exception as e:
            print(f"Error cancelling loop: {e}")
            return False
    
    def schedule_next(self, callback: Callable):
        """Schedule a function to run on the next animation frame"""
        if not self._is_browser_env():
            callback()
            return True
            
        try:
            from js import window
            return window.oboCarAPI.scheduleStep(callback)
        except Exception as e:
            print(f"Error scheduling step: {e}")
            return False
    
    def sleep(self, seconds: float):
        """
        Non-blocking sleep function
        
        In browser mode, this returns immediately but schedules continuation
        In non-browser mode, this blocks for the specified duration
        """
        if not self._is_browser_env():
            time.sleep(seconds)
            return
            
        # In browser mode, sleep is a no-op
        # Actual timing should be handled by the event loop
        pass
        
    def repeat(self, times: int, actions: Callable):
        """
        Repeat a set of actions a specific number of times
        
        Args:
            times: Number of repetitions (use -1 for infinite)
            actions: Function containing the actions to repeat
            
        Example:
            car.repeat(4, lambda: car.forward(1) or car.turn_right(90))
        """
        # Create a wrapper function that counts repetitions
        counter = [0]
        
        def repeat_wrapper():
            if times > 0 and counter[0] >= times:
                print(f"✅ Completed {times} repetitions")
                return False
                
            if times >= 0:  # Finite loop
                counter[0] += 1
                print(f"🔄 Repetition {counter[0]} of {times}")
            else:  # Infinite loop
                counter[0] += 1
                print(f"🔄 Repetition {counter[0]} (infinite)")
                
            try:
                result = actions()
                return result if result is not None else True
            except Exception as e:
                print(f"❌ Error in repetition {counter[0]}: {e}")
                return False
                
        # Start the event loop with our wrapper
        print(f"🔄 Starting repeat loop for {times if times >= 0 else 'infinite'} iterations")
        return self.run_loop(repeat_wrapper)

def obocar():
    """Create and return a new OboChar instance."""
    return OboCar()

# Event loop decorator for cleaner syntax
def event_loop(func):
    """
    Decorator to run a function in an event-driven loop.
    
    Example:
        @event_loop
        def my_loop():
            car.forward(1)
            car.turn_right(90)
    
    The decorated function will run in an event-driven way without blocking the UI.
    """
    # Get or create a car instance
    try:
        car_instance = None
        # Check if there's a global car instance already
        import builtins
        if hasattr(builtins, '_obocar_instance'):
            car_instance = builtins._obocar_instance
        
        # If no car instance found, create one
        if car_instance is None:
            car_instance = obocar()
            
        # Start the event loop
        print(f"🔄 Starting event loop for function: {func.__name__}")
        loop_id = car_instance.run_loop(func)
        return loop_id
    except Exception as e:
        print(f"❌ Error setting up event loop: {e}")
        # If we're not in browser, just run the function once
        return func()

# Simple repeat function for common patterns
def repeat(times, actions):
    """
    Repeat a set of actions a specific number of times
    
    Args:
        times: Number of repetitions (use -1 for infinite loop)
        actions: Function containing the actions to repeat
    
    Example:
        repeat(4, lambda: [car.forward(1), car.turn_right(90)])
    """
    car_instance = None
    # Check if there's a global car instance already
    try:
        import builtins
        if hasattr(builtins, '_obocar_instance'):
            car_instance = builtins._obocar_instance
        
        # If no car instance found, create one
        if car_instance is None:
            car_instance = obocar()
            
        # Create a wrapper function to handle repetition
        def repeat_wrapper():
            nonlocal times
            if times > 0:
                times -= 1
                actions()
                return times > 0
            elif times < 0:  # Infinite loop case
                actions()
                return True
            else:
                return False
                
        # Start the event loop
        loop_id = car_instance.run_loop(repeat_wrapper)
        return loop_id
    except Exception as e:
        print(f"❌ Error in repeat function: {e}")
        return None

# Make the main classes and functions available at module level
__version__ = "0.1.0"
__author__ = "Obo Car Team"
__all__ = ['obocar', 'event_loop', 'repeat']

