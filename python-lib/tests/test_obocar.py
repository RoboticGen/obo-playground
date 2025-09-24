"""
Tests for the obocar library.
Designed to work in both standard Python and Pyodide environments.
"""

import sys
import os

# Add the library to the path for testing
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from obocar import obocar, OboChar

def test_car_creation():
    """Test basic car creation."""
    car = obocar()
    assert isinstance(car, OboChar)
    assert car.get_position() == (0.0, 0.0)
    assert car.get_heading() == 0.0
    assert car.distance() == 0.0
    print("✅ Car creation test passed")

def test_movement():
    """Test basic movement functions."""
    car = obocar()
    
    # Test forward movement
    initial_pos = car.get_position()
    car.forward(5)
    new_pos = car.get_position()
    assert new_pos != initial_pos
    assert car.distance() == 5.0
    
    # Test turning
    car.right(90)
    assert car.get_heading() == 90.0
    
    car.left(45)
    assert car.get_heading() == 45.0
    
    print("✅ Movement test passed")

def test_sensors():
    """Test sensor functionality."""
    car = obocar()
    
    # Test all sensor directions
    directions = ['front', 'back', 'left', 'right']
    for direction in directions:
        reading = car.sensor(direction)
        assert isinstance(reading, (int, float))
        assert reading >= 0
    
    # Test invalid direction
    try:
        car.sensor('invalid')
        assert False, "Should have raised ValueError"
    except ValueError:
        pass
    
    print("✅ Sensor test passed")



def test_obstacle_interaction():
    """Test obstacle-related functions."""
    car = obocar()
    
    # Get initial obstacles
    initial_obstacles = car.get_obstacles()
    assert isinstance(initial_obstacles, list)
    
    # Add new obstacle
    car.add_obstacle(10, 10)
    new_obstacles = car.get_obstacles()
    assert len(new_obstacles) == len(initial_obstacles) + 1
    assert (10, 10) in new_obstacles
    
    print("✅ Obstacle interaction test passed")

def test_status_methods():
    """Test status and information methods."""
    car = obocar()
    
    # Test status method
    status = car.status()
    assert isinstance(status, dict)
    required_keys = ['position', 'heading', 'distance', 'speed']
    for key in required_keys:
        assert key in status
    
    # Test position and heading
    pos = car.get_position()
    heading = car.get_heading()
    assert isinstance(pos, tuple) and len(pos) == 2
    assert isinstance(heading, (int, float))
    
    print("✅ Status methods test passed")

def test_reset_functionality():
    """Test car reset functionality."""
    car = obocar()
    
    # Make some changes
    car.forward(5)
    car.right(90)
    car.add_obstacle(15, 15)
    
    # Verify changes
    assert car.get_position() != (0.0, 0.0)
    assert car.get_heading() != 0.0
    assert car.distance() > 0.0
    
    # Reset and verify
    car.reset()
    assert car.get_position() == (0.0, 0.0)
    assert car.get_heading() == 0.0
    assert car.distance() == 0.0
    
    print("✅ Reset functionality test passed")

def test_event_logging():
    """Test event logging functionality."""
    car = obocar()
    
    # Perform some actions
    car.forward(2)
    car.right(45)
    car.sensor('front')
    
    # Check event log
    events = car.get_event_log()
    assert isinstance(events, list)
    assert len(events) > 0
    
    # Check event structure
    for event in events:
        assert isinstance(event, dict)
        assert 'event' in event
        assert 'position' in event
    
    print("✅ Event logging test passed")

def run_all_tests():
    """Run all tests."""
    print("🧪 Running obocar library tests...")
    print("=" * 50)
    
    tests = [
        test_car_creation,
        test_movement,
        test_sensors,
        test_obstacle_interaction,
        test_status_methods,
        test_reset_functionality,
        test_event_logging
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            test()
            passed += 1
        except Exception as e:
            print(f"❌ {test.__name__} failed: {e}")
            failed += 1
    
    print("=" * 50)
    print(f"Tests completed: {passed} passed, {failed} failed")
    
    if failed == 0:
        print("🎉 All tests passed! Library is working correctly.")
    else:
        print("⚠️ Some tests failed. Please check the implementation.")
    
    return failed == 0

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)