/**
 * Event-Driven System - Quick Debug Checklist
 * Use this to verify your setup is working correctly
 */

/*

SYMPTOMS & FIXES
================

PROBLEM: Car doesn't move when running code, but 3D display is visible
CAUSE:   State updates not being sent from Python to JS
FIX:     ✅ Added sendStateChangeEvent callback bridge in worker
         ✅ Python now properly emits state:changed events
         ✅ Hook now subscribes to state:changed events

PROBLEM: Page shows old useCodeExecution hook imports
CAUSE:   Not switched to new event-driven hook
FIX:     ✅ Updated playground/[id]/page.tsx to use useCodeExecutionEvent
         ✅ Updated Pyodide initialization to use pythonExecutorEvent

PROBLEM: While loops still freeze browser
CAUSE:   If old pythonExecutor is still being used
FIX:     ✅ Worker runs in separate thread (event-driven)
         ✅ All code executes in worker, not main thread
         ✅ Main thread stays responsive

PROBLEM: State updates are sporadic or missing
CAUSE:   Event listeners not properly set up
FIX:     ✅ Hook now adds addOutput to dependency array
         ✅ Event subscriptions properly cleaned up on unmount
         ✅ Debug logging added to track state changes


VERIFICATION STEPS
==================

1. Browser Console Check:
   - Open DevTools (F12)
   - Look for console messages with [pythonExecutorEvent] or [useCodeExecutionEvent]
   - You should see "State changed:" logs during execution

2. 3D Display Check:
   - Run simple movement code:
     
     car = OBOCar()
     car.move_forward(100)
     
   - Check:
     ✓ Car visually moves in 3D scene
     ✓ Console shows "State changed:" event
     ✓ currentLine counter advances

3. While Loop Test:
   - Run test code:
     
     car = OBOCar()
     i = 0
     while i < 5:
         car.move_forward(100)
         time.sleep(0.1)
         i += 1
     car.stop()
     
   - Check:
     ✓ Browser doesn't freeze
     ✓ 3D car moves smoothly
     ✓ Code execution shows output

4. Event Bus Check:
   - In DevTools console, run:
     
     const { getCarEventBus } = await import('/lib/carEventBus.ts');
     const bus = getCarEventBus();
     bus.getHistory('state:changed', 10)
     
   - Should show recent state updates


KEY FILES INVOLVED
==================

1. /public/workers/pyodide-event.worker.ts
   - Runs Python code in separate thread
   - Emits events via sendStateChangeEvent callback
   - Key: sendStateChangeEvent callback connects Python → JS

2. /lib/pythonExecutorEvent.ts
   - Main executor that manages worker
   - Routes events to event bus
   - Key: handleWorkerMessage maps events to bus

3. /lib/useCodeExecutionEvent.ts
   - React hook for components
   - Subscribes to state:changed events
   - Updates React state via setCarState
   - Key: Listens for 'state:changed' event type

4. /app/playground/[id]/page.tsx
   - Main page component
   - Uses useCodeExecutionEvent hook
   - Passes carState to ScenePanel → BabylonScene
   - Key: Switched from useCodeExecution to useCodeExecutionEvent

5. /components/BabylonScene.tsx
   - Reads carState via props
   - Updates carStateRef.current
   - Render loop reads ref for animation
   - Key: carStateRef is updated when carState prop changes


TESTING IN BROWSER
==================

Copy this into DevTools console to test:

```javascript
// Test 1: Check event bus is working
(async () => {
  const { getCarEventBus } = await import('@/lib/carEventBus.ts');
  const bus = getCarEventBus();
  console.log('Event bus initialized:', bus !== null);
})();

// Test 2: Check executor is initialized
(async () => {
  const { getPythonExecutor } = await import('@/lib/pythonExecutorEvent.ts');
  const executor = await getPythonExecutor();
  console.log('Executor ready:', executor.isReady());
})();

// Test 3: Run simple movement and watch events
(async () => {
  const { getPythonExecutor } = await import('@/lib/pythonExecutorEvent.ts');
  const { getCarEventBus } = await import('@/lib/carEventBus.ts');
  
  const executor = await getPythonExecutor();
  const bus = getCarEventBus();
  
  bus.on('state:changed', (event) => {
    console.log('🔄 State update:', {
      leftSpeed: event.leftMotorSpeed,
      rightSpeed: event.rightMotorSpeed
    });
  });
  
  await executor.executeCode(`
car = OBOCar()
car.move_forward(100)
time.sleep(0.5)
car.stop()
  `);
})();
```


COMMON ISSUES
=============

❌ "Executor not initialized" error
   → useCodeExecutionEvent hook not properly awaiting getPythonExecutor()
   → Fix: Check that setupSubscriptions runs after mount

❌ No state updates in console
   → sendStateChangeEvent callback not registered in worker
   → Fix: Verify pyodide.globals.set('sendStateChangeEvent', ...) is called

❌ Old hook still being used
   → Component imports useCodeExecution instead of useCodeExecutionEvent
   → Fix: Update all imports in playground page

❌ Browser still freezes on while loops
   → Code is running on main thread, not worker
   → Fix: Ensure event-driven worker is being used, not old pythonExecutor


PERFORMANCE NOTES
=================

- Each state update creates an event (can be frequent)
- Event bus maintains history (max 100 events by default)
- Worker message queue buffers rapid updates
- Subscribe count tracked: check with bus.getSubscriberCount('state:changed')


NEXT STEPS IF STILL NOT WORKING
=================================

1. Check browser console for errors
2. Verify no TypeScript build errors
3. Check Network tab to ensure worker loads
4. Use the test code above to isolate the issue
5. Check if old pythonExecutor is somehow still being imported

*/

export {};
