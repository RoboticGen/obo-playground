"""
Basic Obo Car simulation example.
This exactly matches the code you provided in your requirements.
Works perfectly in Pyodide browser environment.
"""

# Import the Obo Car library
from obocar import obocar

def main():
    """Run the basic simulation example."""
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

    return car

if __name__ == "__main__":
    car = main()
    
    # Show additional information
    print("\n--- Additional Demo ---")
    pos = car.get_position()
    heading = car.get_heading()
    print(f"Final position: ({pos[0]:.1f}, {pos[1]:.1f})")
    print(f"Final heading: {heading:.1f}°")
    
    # Test all sensors
    print("\n--- All Sensor Readings ---")
    for direction in ['front', 'left', 'right', 'back']:
        sensor_reading = car.sensor(direction)
        print(f"{direction.capitalize()} sensor: {sensor_reading:.1f}m")