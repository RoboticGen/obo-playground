/**
 * Event-Driven Architecture Integration Guide
 * 
 * This file documents how to integrate the event-driven Python-to-JS car system
 */

// ============================================================================
// FILE STRUCTURE
// ============================================================================

/*
lib/
  ├── carEvents.ts              // Event type definitions
  ├── carEventBus.ts            // Centralized event emitter
  ├── messageQueue.ts           // Message queue for worker communication
  ├── errorHandler.ts           // Error handling and recovery
  ├── pythonExecutorEvent.ts    // Main executor using events
  ├── useCodeExecutionEvent.ts  // React hook for event-driven execution
  ├── sensorSimulator.ts        // Real-time sensor simulation
  └── pythonExecutor.ts         // [OLD] Keep for backward compatibility

public/
  └── workers/
      ├── pyodide-event.worker.ts  // New event-driven worker
      └── pyodide.worker.ts        // [OLD] Keep for backward compatibility
*/

// ============================================================================
// MIGRATION GUIDE
// ============================================================================

/*

STEP 1: Update Component Imports
================================

OLD:
  import { useCodeExecution } from '@/lib/hooks';
  const { isRunning, output, carState, executeCode } = useCodeExecution();

NEW:
  import { useCodeExecutionEvent } from '@/lib/useCodeExecutionEvent';
  const { isRunning, output, carState, executeCode } = useCodeExecutionEvent();

The API is similar, but now uses events under the hood.


STEP 2: Subscribe to Specific Events (Optional)
================================================

If you need to react to specific events:

  import { getCarEventBus } from '@/lib/carEventBus';
  
  useEffect(() => {
    const eventBus = getCarEventBus();
    
    // Subscribe to state changes
    const unsubscribe = eventBus.on('state:changed', (event) => {
      console.log('Car state changed:', event);
    });
    
    return unsubscribe;
  }, []);


STEP 3: Enable Real-Time Sensor Simulation (Optional)
======================================================

To integrate actual 3D scene collision detection:

  import { getSensorSimulator } from '@/lib/sensorSimulator';
  
  const simulator = getSensorSimulator();
  
  // Set custom raycasting function from Babylon.js scene
  simulator.setSensorFunction(({ carPos, maxDist }) => {
    const rayResults = raycastFromScene(carPos);
    return {
      front: rayResults.front ?? maxDist,
      left: rayResults.left ?? maxDist,
      right: rayResults.right ?? maxDist,
    };
  });
  
  // Start continuous updates
  simulator.start();


STEP 4: Error Handling
======================

Errors are automatically emitted as events and can be caught:

  const eventBus = getCarEventBus();
  
  eventBus.on('error:occurred', (event) => {
    showErrorNotification(event.message);
  });

Or use the error handler directly:

  import { getErrorHandler } from '@/lib/errorHandler';
  
  const handler = getErrorHandler();
  const log = handler.getLog(); // Get recent errors


STEP 5: Event History and Debugging
====================================

Access event history for debugging:

  const eventBus = getCarEventBus();
  const history = eventBus.getHistory('state:changed', 10);
  console.log('Last 10 state changes:', history);

*/

// ============================================================================
// EVENT TYPES REFERENCE
// ============================================================================

/*

Motor Control Events:
  - 'motor:command'       // Emitted when motor speeds change
  - 'state:changed'       // Emitted after any car state change
  
Sensor Events:
  - 'sensor:update'       // Real-time sensor distance updates
  - 'collision:detected'  // Collision detected by sensors
  
Execution Events:
  - 'execution:started'   // Code execution started
  - 'execution:line'      // Each line executed
  - 'execution:output'    // Print output from Python
  - 'execution:completed' // Code execution finished
  
Error Events:
  - 'error:occurred'      // Any error during execution

*/

// ============================================================================
// BEST PRACTICES
// ============================================================================

/*

1. Always unsubscribe from events when component unmounts
   ✅ Good:
      useEffect(() => {
        const unsub = eventBus.on('state:changed', handler);
        return unsub;  // Cleanup
      }, []);
   
   ❌ Bad:
      eventBus.on('state:changed', handler);  // Memory leak

2. Use event bus for decoupled communication
   ✅ Good:
      // BabylonScene.tsx
      const unsub = eventBus.on('state:changed', updateVisualization);
      // CodeEditor.tsx
      const unsub = eventBus.on('error:occurred', showError);
   
   ❌ Bad:
      // Direct prop passing for every state change

3. Batch sensor updates if performance is an issue
   ✅ Good:
      getSensorSimulator().setConfig({ updateFrequency: 200 }); // 5Hz
   
   ❌ Bad:
      // Too frequent updates on large scenes

4. Always handle errors
   ✅ Good:
      try {
        await executor.executeCode(code);
      } catch (error) {
        errorHandler.handle(error, { source: 'js' });
      }
   
   ❌ Bad:
      await executor.executeCode(code);  // Silent failures

*/

// ============================================================================
// PERFORMANCE TUNING
// ============================================================================

/*

If experiencing performance issues:

1. Reduce sensor update frequency
   getSensorSimulator().setConfig({ updateFrequency: 200 });

2. Disable collision detection
   getSensorSimulator().setConfig({ enableCollisionDetection: false });

3. Batch multiple state changes
   // Instead of emitting for every micro-change
   // Batch them in the Python code

4. Clear event history periodically
   eventBus.clearHistory();

*/

// ============================================================================
// TESTING
// ============================================================================

/*

Mock the event bus for testing:

  import { getCarEventBus, resetCarEventBus } from '@/lib/carEventBus';
  
  beforeEach(() => {
    resetCarEventBus();
  });
  
  test('handles state changes', async () => {
    const eventBus = getCarEventBus();
    const handler = jest.fn();
    
    eventBus.on('state:changed', handler);
    await eventBus.emit({
      type: 'state:changed',
      leftMotorSpeed: 100,
      // ... rest of state
    });
    
    expect(handler).toHaveBeenCalled();
  });

*/

export {};
