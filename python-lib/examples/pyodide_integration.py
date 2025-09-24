"""
Pyodide integration example for browser usage.
Shows how to use the obocar library in a web environment.
"""

# This would be used in a Pyodide context like this:

PYODIDE_INTEGRATION_CODE = '''
// JavaScript side - loading and running the Python library

async function setupOboCar() {
    // Load Pyodide
    const pyodide = await loadPyodide();
    
    // Install the obocar package (simulate by adding to sys.path)
    pyodide.runPython(`
        import sys
        # Add the library path (adjust as needed for your setup)
        sys.path.append('/python-lib')
        
        # Now we can import and use obocar
        from obocar import obocar
        
        # Create global car instance
        car = obocar()
        
        def run_basic_demo():
            """Run the basic demo and return results."""
            print("🚗 Starting Obo Car simulation in browser!")
            
            car.forward(3)
            car.wait(0.5)
            
            front_distance = car.sensor('front')
            print(f"Front sensor: {front_distance:.1f}m")
            
            if front_distance > 5:
                print("Path clear, moving forward")
                car.forward(2)
            else:
                print("Obstacle detected, turning right")
                car.right(90)
                car.forward(2)
            
            battery = car.battery()
            distance = car.distance()
            print(f"Mission complete! Battery: {battery:.1f}%, Distance: {distance:.1f}m")
            
            return {
                'position': car.get_position(),
                'heading': car.get_heading(),
                'battery': battery,
                'distance': distance,
                'obstacles': car.get_obstacles()
            }
    `);
    
    return pyodide;
}

// Usage in a web page
async function runSimulation() {
    const pyodide = await setupOboCar();
    
    // Run the demo and get results
    const results = pyodide.runPython('run_basic_demo()');
    
    // Use results in JavaScript
    console.log('Simulation results:', results);
    
    // You can also call individual methods
    pyodide.runPython('car.sensor("front")');
    pyodide.runPython('car.forward(1)');
    
    return results;
}

// For React components
function OboCarSimulation() {
    const [carStatus, setCarStatus] = useState(null);
    const [pyodide, setPyodide] = useState(null);
    
    useEffect(() => {
        setupOboCar().then(setPyodide);
    }, []);
    
    const moveForward = (distance = 1) => {
        if (pyodide) {
            pyodide.runPython(`car.forward(${distance})`);
            updateCarStatus();
        }
    };
    
    const updateCarStatus = () => {
        if (pyodide) {
            const status = pyodide.runPython('car.status()');
            setCarStatus(status);
        }
    };
    
    return (
        <div>
            <button onClick={() => moveForward(1)}>Move Forward</button>
            <button onClick={() => pyodide.runPython('car.left(90)')}>Turn Left</button>
            <button onClick={() => pyodide.runPython('car.right(90)')}>Turn Right</button>
            <div>Status: {JSON.stringify(carStatus)}</div>
        </div>
    );
}
'''

def demo_pyodide_functions():
    """
    Functions specifically designed for Pyodide integration.
    These can be called directly from JavaScript.
    """
    from obocar import obocar
    
    # Create a global car instance for browser use
    global browser_car
    browser_car = obocar()
    
    def get_car_status_json():
        """Return car status as JSON string for JavaScript."""
        import json
        return json.dumps(browser_car.status())
    
    def move_car(direction, amount):
        """Generic move function callable from JavaScript."""
        if direction == 'forward':
            browser_car.forward(amount)
        elif direction == 'backward': 
            browser_car.backward(amount)
        elif direction == 'left':
            browser_car.left(amount)
        elif direction == 'right':
            browser_car.right(amount)
        
        return get_car_status_json()
    
    def get_sensor_reading(direction='front'):
        """Get sensor reading callable from JavaScript."""
        return browser_car.sensor(direction)
    
    def reset_car():
        """Reset car to initial state."""
        browser_car.reset()
        return get_car_status_json()
    
    # Make functions available globally for JavaScript access
    globals()['get_car_status_json'] = get_car_status_json
    globals()['move_car'] = move_car 
    globals()['get_sensor_reading'] = get_sensor_reading
    globals()['reset_car'] = reset_car
    
    return {
        'get_status': get_car_status_json,
        'move': move_car,
        'sensor': get_sensor_reading,
        'reset': reset_car
    }

if __name__ == "__main__":
    print("Pyodide Integration Functions Available:")
    functions = demo_pyodide_functions()
    for name, func in functions.items():
        print(f"- {name}: {func}")
    
    print("\nExample usage in browser console:")
    print("pyodide.runPython('move_car(\"forward\", 3)')")
    print("pyodide.runPython('get_sensor_reading(\"front\")')")
    print("pyodide.runPython('get_car_status_json()')")