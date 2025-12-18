/**
 * Test Helper for Event-Driven Car Simulation
 * Quick test to verify state updates are working
 */

export async function testEventDrivenExecution() {
  const testCode = `
# Test: Simple while loop with movement
car = OBOCar()

# Move forward with delay
for i in range(5):
    car.move_forward(speed=100)
    time.sleep(0.2)

# Stop
car.stop()
print("Test completed")
  `;

  try {
    const { getPythonExecutor } = await import('@/lib/pythonExecutorEvent');
    const executor = await getPythonExecutor();

    console.log('[Test] Starting execution test...');

    // Track all events
    const events: any[] = [];
    const unsubscribeState = executor.onEvent('state:changed', (event) => {
      events.push(event);
      console.log('[Test] State event received:', event);
    });

    const unsubscribeOutput = executor.onEvent('execution:output', (event) => {
      console.log('[Test] Output:', event.message);
    });

    const unsubscribeError = executor.onEvent('error:occurred', (event) => {
      console.error('[Test] Error:', event.message);
    });

    // Execute
    await executor.executeCode(testCode);

    console.log(`[Test] Execution complete. Received ${events.length} state updates`);

    // Cleanup
    unsubscribeState();
    unsubscribeOutput();
    unsubscribeError();

    return {
      success: events.length > 0,
      eventCount: events.length,
      lastState: events[events.length - 1],
    };
  } catch (error: any) {
    console.error('[Test] Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Test state persistence during execution
 */
export async function testStatePersistence() {
  const testCode = `
car = OBOCar()

# Create a while loop that would freeze the browser if not in worker
iteration = 0
while iteration < 3:
    car.move_forward(speed=50 + iteration * 20)
    time.sleep(0.1)
    iteration += 1

car.stop()
print(f"Iterations completed: {iteration}")
  `;

  try {
    const { getPythonExecutor } = await import('@/lib/pythonExecutorEvent');
    const executor = await getPythonExecutor();

    console.log('[Test] Starting while loop test...');

    const stateChanges: any[] = [];
    const unsubscribe = executor.onEvent('state:changed', (event) => {
      stateChanges.push({
        speed: event.leftMotorSpeed,
        timestamp: event.timestamp,
      });
    });

    const startTime = Date.now();
    await executor.executeCode(testCode);
    const duration = Date.now() - startTime;

    console.log(`[Test] While loop completed in ${duration}ms`);
    console.log(`[Test] State changes recorded: ${stateChanges.length}`);
    console.log('[Test] Speed progression:', stateChanges.map((s) => s.speed));

    unsubscribe();

    return {
      success: duration < 30000 && stateChanges.length > 0,
      duration,
      stateChangeCount: stateChanges.length,
      speeds: stateChanges.map((s) => s.speed),
    };
  } catch (error: any) {
    console.error('[Test] Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Export for testing
export const EventDrivenTests = {
  testEventDrivenExecution,
  testStatePersistence,
};
