from obocar import obocar

# Create a car instance
car = obocar()

# Print initial state
print(f"Initial position: {car.get_position()}, heading: {car.get_heading()}°")

# Drive in a square pattern
print("\n===== STARTING SQUARE PATTERN TEST =====")

# First side
print("\n----- First side -----")
print(f"Before forward: Position={car.get_position()}, Heading={car.get_heading()}°")
car.forward(3)
print(f"After forward: Position={car.get_position()}, Heading={car.get_heading()}°")

print("\n----- First turn -----")
print(f"Before turn: Position={car.get_position()}, Heading={car.get_heading()}°")
car.right(90)
print(f"After turn: Position={car.get_position()}, Heading={car.get_heading()}°")

# Second side
print("\n----- Second side -----")
print(f"Before forward: Position={car.get_position()}, Heading={car.get_heading()}°")
car.forward(3)
print(f"After forward: Position={car.get_position()}, Heading={car.get_heading()}°")

print("\n----- Second turn -----")
print(f"Before turn: Position={car.get_position()}, Heading={car.get_heading()}°")
car.right(90)
print(f"After turn: Position={car.get_position()}, Heading={car.get_heading()}°")

# Third side
print("\n----- Third side -----")
print(f"Before forward: Position={car.get_position()}, Heading={car.get_heading()}°")
car.forward(3)
print(f"After forward: Position={car.get_position()}, Heading={car.get_heading()}°")

print("\n----- Third turn -----")
print(f"Before turn: Position={car.get_position()}, Heading={car.get_heading()}°")
car.right(90)
print(f"After turn: Position={car.get_position()}, Heading={car.get_heading()}°")

# Fourth side
print("\n----- Fourth side -----")
print(f"Before forward: Position={car.get_position()}, Heading={car.get_heading()}°")
car.forward(3)
print(f"After forward: Position={car.get_position()}, Heading={car.get_heading()}°")

print("\n----- Fourth turn -----")
print(f"Before turn: Position={car.get_position()}, Heading={car.get_heading()}°")
car.right(90)
print(f"After turn: Position={car.get_position()}, Heading={car.get_heading()}°")

print("\n===== SQUARE PATTERN TEST COMPLETE =====")
print(f"Final position: {car.get_position()}, heading: {car.get_heading()}°")
print(f"Total distance traveled: {car.distance()} units")

# Check if we returned close to origin
x, y = car.get_position()
if abs(x) < 0.5 and abs(y) < 0.5:
    print("✅ SUCCESS: Returned to starting position!")
else:
    print(f"❌ ERROR: Did not return to starting position. Off by ({x}, {y})")

# Check if heading is back to 0 degrees
heading = car.get_heading()
if abs(heading % 360) < 5:
    print("✅ SUCCESS: Heading returned to original orientation!")
else:
    print(f"❌ ERROR: Heading did not return to original orientation. Current: {heading}°")