/**
 * Pyodide Integration for Obo Car Simulation
 * 
 * This file provides functions to load the obocar module in Pyodide
 * and run simulations in the browser.
 */

// Load Pyodide and initialize the obocar module
async function initPyodide() {
  // Load Pyodide
  let pyodide = await loadPyodide();
  console.log("Pyodide loaded successfully");
  
  try {
    // Option 1: Load from public/python/obocar.py (direct fetch)
    const response = await fetch("/python/obocar.py");
    const obocarCode = await response.text();
    
    // Write the obocar module to the virtual filesystem
    pyodide.FS.writeFile("obocar.py", obocarCode);
    console.log("obocar.py written to virtual filesystem");
    
    // Test import to verify it works
    const testResult = pyodide.runPython(`
      try:
        from obocar import obocar
        print("✅ obocar module imported successfully!")
        True
      except Exception as e:
        print(f"Error importing obocar: {e}")
        False
    `);
    
    if (!testResult) {
      throw new Error("Failed to import obocar module");
    }
    
    return pyodide;
  } catch (error) {
    console.error("Error initializing obocar module:", error);
    throw error;
  }
}

// Execute a Python code snippet using the obocar module
async function runPythonCode(pyodide, code) {
  try {
    // Ensure the obocar module is available
    const output = pyodide.runPython(`
      import sys
      from io import StringIO
      
      # Capture stdout for return value
      old_stdout = sys.stdout
      sys.stdout = mystdout = StringIO()
      
      try:
          ${code}
      except Exception as e:
          print(f"Error: {type(e).__name__}: {e}")
      
      # Restore stdout and get output
      sys.stdout = old_stdout
      output = mystdout.getvalue()
      output
    `);
    
    return {
      success: true,
      output: output
    };
  } catch (error) {
    console.error("Error executing Python code:", error);
    return {
      success: false,
      output: `Error: ${error.message}`
    };
  }
}

// Run the movement test example
async function runMovementTest(pyodide) {
  const testCode = `
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
  
  return await runPythonCode(pyodide, testCode);
}

// Export the functions
export { initPyodide, runPythonCode, runMovementTest };