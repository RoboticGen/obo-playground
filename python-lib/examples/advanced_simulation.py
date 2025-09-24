"""
Advanced Obo Car simulation example with obstacle navigation.
Demonstrates more complex behaviors and sensor usage.
"""

from obocar import obocar
import random

def obstacle_navigation_demo():
    """Demonstrate advanced obstacle navigation."""
    car = obocar()
    print("🤖 Advanced Obstacle Navigation Demo")
    
    # Add some custom obstacles
    car.add_obstacle(5, 5)
    car.add_obstacle(10, 0)
    car.add_obstacle(-5, 8)
    
    moves_made = 0
    max_moves = 20
    
    while moves_made < max_moves and car.battery() > 10:
        # Check all sensors
        sensors = {
            'front': car.sensor('front'),
            'left': car.sensor('left'),
            'right': car.sensor('right'),
            'back': car.sensor('back')
        }
        
        print(f"\nMove {moves_made + 1}:")
        print(f"Position: {car.get_position()}, Heading: {car.get_heading()}°")
        print(f"Sensors - F:{sensors['front']:.1f} L:{sensors['left']:.1f} R:{sensors['right']:.1f} B:{sensors['back']:.1f}")
        
        # Decision making logic
        if sensors['front'] > 8:
            # Path is clear, move forward
            print("✅ Path clear, moving forward")
            car.forward(3)
        elif sensors['right'] > sensors['left']:
            # Turn right if there's more space
            print("➡️ More space on right, turning right")
            car.right(45)
        elif sensors['left'] > sensors['right']:
            # Turn left if there's more space
            print("⬅️ More space on left, turning left") 
            car.left(45)
        else:
            # Both sides blocked, turn around
            print("🔄 Both sides blocked, turning around")
            car.right(180)
        
        car.wait(0.3)
        moves_made += 1
        
        # Check battery level
        battery_level = car.battery()
        if battery_level < 20:
            print(f"⚠️ Low battery: {battery_level:.1f}%")
    
    # Final status
    final_status = car.status()
    print(f"\n🏁 Navigation complete!")
    print(f"Final status: {final_status}")

def patrol_pattern_demo():
    """Demonstrate a patrol pattern behavior."""
    car = obocar()
    print("\n🛡️ Patrol Pattern Demo")
    
    # Define patrol waypoints (relative movements)
    patrol_pattern = [
        ('forward', 5),
        ('right', 90),
        ('forward', 3),
        ('right', 90),
        ('forward', 5),
        ('right', 90),
        ('forward', 3),
        ('right', 90)
    ]
    
    for i, (action, value) in enumerate(patrol_pattern):
        print(f"Patrol step {i+1}: {action} {value}")
        
        if action == 'forward':
            # Check for obstacles before moving
            front_distance = car.sensor('front')
            if front_distance > value + 1:
                car.forward(value)
            else:
                print(f"⚠️ Obstacle detected at {front_distance:.1f}m, adjusting route")
                car.right(45)
                car.forward(value/2)
                car.left(45)
        elif action == 'right':
            car.right(value)
        elif action == 'left':
            car.left(value)
        
        car.wait(0.2)
        print(f"Position: {car.get_position()}, Battery: {car.battery():.1f}%")
    
    print("🔄 Patrol complete!")

if __name__ == "__main__":
    # Run obstacle navigation demo
    obstacle_navigation_demo()
    
    # Run patrol pattern demo  
    patrol_pattern_demo()
    
    print("\n🎯 All demos completed!")