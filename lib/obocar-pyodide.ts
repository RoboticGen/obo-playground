/**
 * Pyodide Integration for Obo Car Library
 * 
 * This file integrates your existing Python obocar library with Pyodide
 * for running Python in the browser.
 */

// Define the interface for Pyodide
interface PyodideInterface {
  runPython: (code: string) => any;
  FS: {
    writeFile: (path: string, data: string) => void;
    readFile: (path: string, options: { encoding: string }) => string;
  };
  loadPackagesFromImports: (code: string) => Promise<void>;
}

let pyodideInstance: PyodideInterface | null = null;
let pyodideReady = false;

/**
 * Initialize Pyodide and load the obocar library
 */
export async function initializeOboCarPyodide(): Promise<void> {
  try {
    // Check if Pyodide is already loaded
    if (pyodideReady && pyodideInstance) {
      return;
    }

    // Load runtime fixes first to ensure they're ready before Pyodide
    await loadRuntimeFixes();

    // Load Pyodide script if not already loaded
    if (!(window as any).loadPyodide) {
      await loadPyodideScript();
    }

    // Initialize Pyodide
    console.log("Loading Pyodide...");
    pyodideInstance = await (window as any).loadPyodide();
    console.log("Pyodide loaded successfully");

    // Load the obocar module
    await loadOboCarModule();

    pyodideReady = true;
    console.log("Obo Car module loaded successfully!");
  } catch (error) {
    console.error("Failed to initialize Pyodide:", error);
    throw error;
  }
}

/**
 * Load the Pyodide script
 */
/**
 * Load runtime fixes script for better loop handling
 */
async function loadRuntimeFixes(): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/runtime-fixes.js';
    script.async = true;
    script.onload = () => {
      console.log('✅ Runtime fixes loaded successfully');
      resolve();
    };
    script.onerror = () => {
      console.warn('⚠️ Failed to load runtime fixes, proceeding without them');
      resolve(); // Resolve anyway to not block execution
    };
    document.body.appendChild(script);
  });
}

/**
 * Load the Pyodide script
 */
async function loadPyodideScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Pyodide script"));
    document.body.appendChild(script);
  });
}

/**
 * Load the obocar module
 */
async function loadOboCarModule(): Promise<void> {
  if (!pyodideInstance) {
    throw new Error("Pyodide not initialized");
  }

  try {
    // Fetch the obocar.py file
    const response = await fetch('/python/obocar.py');
    if (!response.ok) {
      throw new Error(`Failed to fetch obocar.py: ${response.status} ${response.statusText}`);
    }

    const code = await response.text();
    
    // Write the module to the virtual filesystem
    pyodideInstance.FS.writeFile('obocar.py', code);
    
    // Try to load the loop fixes module
    try {
      const loopFixesResponse = await fetch('/python/loop_fixes.py');
      if (loopFixesResponse.ok) {
        const loopFixesCode = await loopFixesResponse.text();
        pyodideInstance.FS.writeFile('loop_fixes.py', loopFixesCode);
        console.log('✅ Loop fixes module loaded successfully');
      }
    } catch (loopError) {
      console.warn('⚠️ Could not load loop fixes module:', loopError);
    }

    // Test import to ensure it works
    const testResult = pyodideInstance.runPython(`
      try:
        # Try to import loop fixes first
        try:
            import loop_fixes
            print("✅ Loop fixes imported successfully")
        except Exception as e:
            print(f"⚠️ Loop fixes import error: {str(e)}")
            
        # Now import the main module
        from obocar import obocar
        car = obocar()
        "success"
      except Exception as e:
        import sys
        f"error: {str(e)}"
    `);

    if (testResult !== "success") {
      throw new Error(`Failed to import obocar module: ${testResult}`);
    }
  } catch (error) {
    console.error("Failed to load obocar module:", error);
    throw error;
  }
}

/**
 * Execute Python code
 */
export async function executePythonCode(code: string): Promise<{ output: string; result?: any; success: boolean }> {
  if (!pyodideReady || !pyodideInstance) {
    await initializeOboCarPyodide();
  }

  try {
    if (!pyodideInstance) {
      throw new Error("Pyodide not initialized");
    }

    // Execute the code with output capture
    const result = pyodideInstance.runPython(`
      import sys
      from io import StringIO
      
      # Capture stdout
      old_stdout = sys.stdout
      sys.stdout = mystdout = StringIO()
      
      try:
          ${code}
          result = None
          success = True
      except Exception as e:
          print(f"❌ Error: {type(e).__name__}: {e}")
          result = str(e)
          success = False
      
      # Restore stdout and get output
      sys.stdout = old_stdout
      
      # Return results
      {
          "output": mystdout.getvalue(),
          "result": result,
          "success": success
      }
    `);

    return {
      output: result.output || "",
      result: result.result,
      success: result.success
    };
  } catch (error) {
    console.error("Error executing Python code:", error);
    return {
      output: `Error executing code: ${error instanceof Error ? error.message : String(error)}`,
      success: false
    };
  }
}

/**
 * Run the original test code from the code example
 */
export async function runOriginalCode(): Promise<{ output: string; result?: any; success: boolean }> {
  const originalCode = `
from obocar import obocar

car = obocar()
initial_pos = car.get_position()
car.forward(5)
new_pos = car.get_position()

assert new_pos != initial_pos
assert car.distance() == 5.0

car.right(90)
assert car.get_heading() == 90.0

car.left(45)
assert car.get_heading() == 45.0

print("✅ Movement test passed")
  `;

  return executePythonCode(originalCode);
}

/**
 * Run a comprehensive test suite
 */
export async function runTestSuite(): Promise<{ output: string; result?: any; success: boolean }> {
  const testCode = `
from obocar import obocar
import math

print("🧪 Running comprehensive test suite...")

# Create car instance
car = obocar()
print("✅ Created car instance")

# Test position tracking
initial_pos = car.get_position()
print(f"Initial position: {initial_pos}")
assert initial_pos == (0.0, 0.0), f"Initial position should be (0.0, 0.0), got {initial_pos}"

# Test forward movement
car.forward(5)
pos_after_forward = car.get_position()
print(f"Position after forward: {pos_after_forward}")
assert pos_after_forward != initial_pos, "Position should change after forward movement"
assert car.distance() == 5.0, f"Distance should be 5.0, got {car.distance()}"

# Test backward movement
car.backward(2)
pos_after_backward = car.get_position()
print(f"Position after backward: {pos_after_backward}")
assert pos_after_backward != pos_after_forward, "Position should change after backward movement"
assert car.distance() == 7.0, f"Distance should be 7.0, got {car.distance()}"

# Test turning
initial_heading = car.get_heading()
print(f"Initial heading: {initial_heading}°")
assert initial_heading == 0.0, f"Initial heading should be 0.0, got {initial_heading}"

car.right(90)
heading_after_right = car.get_heading()
print(f"Heading after right turn: {heading_after_right}°")
assert heading_after_right == 90.0, f"Heading after right turn should be 90.0, got {heading_after_right}"

car.left(45)
heading_after_left = car.get_heading()
print(f"Heading after left turn: {heading_after_left}°")
assert heading_after_left == 45.0, f"Heading after left turn should be 45.0, got {heading_after_left}"

# Test sensors
front_sensor = car.sensor('front')
print(f"Front sensor reading: {front_sensor:.1f}")
assert front_sensor > 0, "Sensor reading should be positive"

# Test that movement works
print("Movement test completed successfully")

# Test status
status = car.status()
print(f"Status: {status}")
assert 'position' in status, "Status should include position"
assert 'heading' in status, "Status should include heading"
assert 'distance' in status, "Status should include distance"

# Test reset
car.reset()
reset_pos = car.get_position()
reset_heading = car.get_heading()
print(f"After reset: position={reset_pos}, heading={reset_heading}°")
assert reset_pos == (0.0, 0.0), f"Position after reset should be (0.0, 0.0), got {reset_pos}"
assert reset_heading == 0.0, f"Heading after reset should be 0.0, got {reset_heading}"

print("🎉 All tests passed!")
  `;

  return executePythonCode(testCode);
}

/**
 * Check if Pyodide is ready
 */
export function isPyodideReady(): boolean {
  return pyodideReady;
}