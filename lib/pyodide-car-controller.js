/**
 * Pyodide Integration for Obo Car Library
 * 
 * This file shows how to integrate the obocar Python library
 * with your Next.js project using Pyodide.
 */

// Add this to your Next.js project to use the obocar library

export class PyodideCarController {
  constructor() {
    this.pyodide = null;
    this.isInitialized = false;
  }

  /**
   * Initialize Pyodide and load the obocar library
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Load Pyodide
      const { loadPyodide } = await import('pyodide');
      this.pyodide = await loadPyodide();

      // Load the obocar module from the public directory
      const response = await fetch('/python/obocar.py');
      const obocarCode = await response.text();
      
      // Execute the obocar module code to define the classes and functions
      this.pyodide.runPython(obocarCode);

      // Now set up the integration functions
      this.pyodide.runPython(`
        # Create a global car instance
        car = obocar()
        
        # Helper functions for JavaScript integration
        def get_car_status():
            return car.status()
        
        def move_forward(distance=1):
            car.forward(distance)
            return get_car_status()
        
        def move_backward(distance=1):
            car.backward(distance)
            return get_car_status()
        
        def turn_left(degrees=90):
            car.left(degrees)
            return get_car_status()
        
        def turn_right(degrees=90):
            car.right(degrees)
            return get_car_status()
        
        def get_sensor(direction='front'):
            return car.sensor(direction)
        
        def get_all_sensors():
            return {
                'front': car.sensor('front'),
                'back': car.sensor('back'),
                'left': car.sensor('left'),
                'right': car.sensor('right')
            }
        
        def reset_car():
            car.reset()
            return get_car_status()
        
        def run_user_code(code):
            """Execute user-provided Python code with access to car."""
            # Create a safe execution environment with obocar available
            exec_globals = {
                'obocar': obocar,
                'car': car,
                'OboChar': OboChar,
                'print': print,
                'range': range,
                'len': len,
                'abs': abs,
                'min': min,
                'max': max,
                'round': round
            }
            exec(code, exec_globals)
            return get_car_status()
      `);

      this.isInitialized = true;
      console.log('Obo Car library initialized successfully!');
    } catch (error) {
      console.error('Failed to initialize Pyodide:', error);
      throw error;
    }
  }

  /**
   * Execute the basic simulation code (matches user's example)
   */
  async runBasicSimulation() {
    if (!this.isInitialized) await this.initialize();

    const code = `
# Import the Obo Car library
from obocar import obocar

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

distance = car.distance()
print(f"Mission complete! Distance: {distance:.1f}m")
`;

    return this.pyodide.runPython(`run_user_code("""${code}""")`);
  }

  /**
   * Move the car forward
   */
  async moveForward(distance = 1) {
    if (!this.isInitialized) await this.initialize();
    return this.pyodide.runPython(`move_forward(${distance})`);
  }

  /**
   * Move the car backward
   */
  async moveBackward(distance = 1) {
    if (!this.isInitialized) await this.initialize();
    return this.pyodide.runPython(`move_backward(${distance})`);
  }

  /**
   * Turn the car left
   */
  async turnLeft(degrees = 90) {
    if (!this.isInitialized) await this.initialize();
    return this.pyodide.runPython(`turn_left(${degrees})`);
  }

  /**
   * Turn the car right
   */
  async turnRight(degrees = 90) {
    if (!this.isInitialized) await this.initialize();
    return this.pyodide.runPython(`turn_right(${degrees})`);
  }

  /**
   * Get sensor reading
   */
  async getSensor(direction = 'front') {
    if (!this.isInitialized) await this.initialize();
    return this.pyodide.runPython(`get_sensor('${direction}')`);
  }

  /**
   * Get all sensor readings
   */
  async getAllSensors() {
    if (!this.isInitialized) await this.initialize();
    return this.pyodide.runPython(`get_all_sensors()`);
  }

  /**
   * Get current car status
   */
  async getStatus() {
    if (!this.isInitialized) await this.initialize();
    return this.pyodide.runPython(`get_car_status()`);
  }

  /**
   * Reset the car to initial state
   */
  async reset() {
    if (!this.isInitialized) await this.initialize();
    return this.pyodide.runPython(`reset_car()`);
  }

  /**
   * Execute custom Python code
   */
  async executeCode(code) {
    if (!this.isInitialized) await this.initialize();
    return this.pyodide.runPython(`run_user_code("""${code}""")`);
  }
}

// React Hook for using the car controller
export function useOboCar() {
  const [controller] = useState(() => new PyodideCarController());
  const [isInitialized, setIsInitialized] = useState(false);
  const [carStatus, setCarStatus] = useState(null);

  useEffect(() => {
    controller.initialize().then(() => {
      setIsInitialized(true);
      updateStatus();
    });
  }, []);

  const updateStatus = async () => {
    if (isInitialized) {
      const status = await controller.getStatus();
      setCarStatus(status);
    }
  };

  const moveForward = async (distance) => {
    await controller.moveForward(distance);
    await updateStatus();
  };

  const turnLeft = async (degrees) => {
    await controller.turnLeft(degrees);
    await updateStatus();
  };

  const turnRight = async (degrees) => {
    await controller.turnRight(degrees);
    await updateStatus();
  };

  const reset = async () => {
    await controller.reset();
    await updateStatus();
  };

  return {
    controller,
    isInitialized,
    carStatus,
    moveForward,
    turnLeft,
    turnRight,
    reset,
    updateStatus
  };
}