from obocar import obocar

# Create a car instance
car = obocar()

print("==== OBO CAR MOVEMENT AND ROTATION TEST ====")
print("This test verifies that position and rotation are correctly synchronized")

# Step 1: Move forward 3 units (should go north)
print("\n1. Moving forward 3 units (North)...")
car.forward(3)
pos = car.get_position()
heading = car.get_heading()
print(f"   Position: {pos}, Heading: {heading}°")

# Step 2: Turn right 90 degrees (should now face east)
print("\n2. Turning right 90° (East)...")
car.right(90)
pos = car.get_position()
heading = car.get_heading()
print(f"   Position: {pos}, Heading: {heading}°")

# Step 3: Move forward 3 units (should go east)
print("\n3. Moving forward 3 units (East)...")
car.forward(3)
pos = car.get_position()
heading = car.get_heading()
print(f"   Position: {pos}, Heading: {heading}°")

# Step 4: Turn right 90 degrees (should now face south)
print("\n4. Turning right 90° (South)...")
car.right(90)
pos = car.get_position()
heading = car.get_heading()
print(f"   Position: {pos}, Heading: {heading}°")

# Step 5: Move forward 3 units (should go south)
print("\n5. Moving forward 3 units (South)...")
car.forward(3)
pos = car.get_position()
heading = car.get_heading()
print(f"   Position: {pos}, Heading: {heading}°")

# Step 6: Turn right 90 degrees (should now face west)
print("\n6. Turning right 90° (West)...")
car.right(90)
pos = car.get_position()
heading = car.get_heading()
print(f"   Position: {pos}, Heading: {heading}°")

# Step 7: Move forward 3 units (should go west)
print("\n7. Moving forward 3 units (West)...")
car.forward(3)
pos = car.get_position()
heading = car.get_heading()
print(f"   Position: {pos}, Heading: {heading}°")

# Step 8: Turn right 90 degrees (should now face north again)
print("\n8. Turning right 90° (North again)...")
car.right(90)
pos = car.get_position()
heading = car.get_heading()
print(f"   Position: {pos}, Heading: {heading}°")

print("\n==== TEST COMPLETE ====")
print("The car should have traced a perfect square and returned to the starting angle (0°)")
print(f"Final position: {pos}, Final heading: {heading}°")