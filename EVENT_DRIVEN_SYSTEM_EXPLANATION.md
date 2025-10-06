# Event-Driven System Architecture

## Overview

Your OBo Car Simulator uses an **event-driven architecture** that allows Python code to control a 3D car simulation running in the browser. This system enables asynchronous, non-blocking command execution with event loops, callbacks, and a command queue system.

---

## Core Components

### 1. **Event Bus** (`lib/event-bus.ts`)

The Event Bus is a simple publish-subscribe pattern implementation:

```typescript
class EventBus {
    private listeners: Record<string, EventHandler[]> = {};
    
    on(event, handler)     // Subscribe to events
    off(event, handler)    // Unsubscribe
    emit(event, ...args)   // Publish events (asynchronous)
}
```

**Key Features:**
- **Asynchronous emission**: Uses `setTimeout(() => {...}, 0)` to make events non-blocking
- **Error isolation**: Each handler runs in a try-catch to prevent one failure from affecting others
- **Global access**: Available to Python via `window.eventBus`

**Use Cases:**
- Currently set up for future event-driven features
- Can be used for sensor updates, collision detection, state changes, etc.

---

### 2. **Command Queue System** (`lib/simulation-store.ts`)

The core of the event-driven architecture is the **command queue system**:

```
┌─────────────────────────────────────────────────────────────┐
│                    Command Flow                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Python Code                                                 │
│     ↓                                                        │
│  car.forward(2)  ──→  Python Bridge                         │
│     ↓                      ↓                                 │
│  addCommand()         Creates Command Object                │
│     ↓                      ↓                                 │
│  Command Queue    ←─  { type: 'forward',                    │
│  (Array)                  value: 2,                          │
│     ↓                     duration: 2000 }                   │
│  executeNextCommand()                                        │
│     ↓                                                        │
│  Animation System  ──→  RigidBody Physics                   │
│     ↓                      ↓                                 │
│  Command Complete  ──→  Update Store State                  │
│     ↓                      ↓                                 │
│  Execute Next      ←─  commandQueue.shift()                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Command Object Structure

```typescript
interface MovementCommand {
  id: string              // Unique identifier
  type: 'forward' | 'backward' | 'turn_left' | 'turn_right' | 'stop' | 'wait'
  value?: number          // Distance/angle/duration
  duration?: number       // How long to execute (ms)
  timestamp: number       // When created
  executed: boolean       // Completion status
  startTime?: number      // When execution started
  endTime?: number        // When execution finished
}
```

#### Command Execution Flow

1. **Add Command** → Command is created and pushed to `commandQueue[]`
2. **Execute Next** → First command in queue is dequeued
3. **Set State** → `isExecuting = true`, `currentCommand = command`
4. **Animate** → Animation functions run (position/rotation interpolation)
5. **Complete** → Command moved to `commandHistory[]`
6. **Auto-Continue** → If queue has more commands, execute next automatically

---

### 3. **Python Bridge** (`lib/python-bridge.ts`)

The bridge connects Python (Pyodide) to the JavaScript simulation:

```typescript
(window as any).oboCarAPI = {
    // Event loop registration
    registerLoopCallback(callback): id
    clearLoopCallback(id): boolean
    
    // Single-step execution
    scheduleStep(callback): boolean
    
    // Movement commands
    move(distance): boolean
    backward(distance): boolean
    rotate(angle): boolean
    
    // Sensor readings
    getSensors(): object
    
    // Angle synchronization
    syncAngleWithPython(angle): void
}
```

#### How Python Loops Work

When you write Python code like:

```python
while car.distance() < 5:
    car.forward(1)
    time.sleep(1)
```

Here's what happens:

1. **Python calls `registerLoopCallback()`** with the loop body as a callback
2. **Bridge creates persistent proxy** to prevent garbage collection
3. **First iteration executes immediately** via `executeLoopIteration()`
4. **Commands are added to queue** (e.g., `car.forward(1)`)
5. **Animation system executes commands** asynchronously
6. **After 2-second delay**, next iteration is scheduled
7. **Loop continues** until callback returns `false` or max iterations reached

```
┌────────────────────────────────────────────────────────────┐
│              Event Loop Lifecycle                           │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Python: while car.distance() < 5:                         │
│             ↓                                               │
│  registerLoopCallback(callback_function)                   │
│             ↓                                               │
│  Create Persistent Proxy (prevents GC)                     │
│             ↓                                               │
│  executeLoopIteration() [iteration #1]                     │
│      │                                                      │
│      ├─→ callback_function()  ──→  car.forward(1)         │
│      │                                  ↓                   │
│      │                          Add to commandQueue        │
│      │                                  ↓                   │
│      │                          Execute command            │
│      │                                  ↓                   │
│      └─→ setTimeout(2000ms)                                │
│                   ↓                                         │
│          executeLoopIteration() [iteration #2]             │
│                   ↓                                         │
│          (repeat until condition false or max iterations)  │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

**Key Features:**
- **Persistent proxies**: Prevents Python objects from being garbage collected
- **Safety limits**: Max 10,000 iterations to prevent infinite loops
- **Error recovery**: Continues loop even if one iteration fails
- **State tracking**: Monitors `isActive`, `iterationCount`, `isExecuting`

---

### 4. **Animation State Machine** (`lib/simulation-store.ts`)

The system uses a finite state machine for car animations:

```
        IDLE
         │
         ├─→ MOVING_FORWARD ──→ STOPPING ──→ IDLE
         │
         ├─→ MOVING_BACKWARD ──→ STOPPING ──→ IDLE
         │
         ├─→ TURNING_LEFT ────→ IDLE
         │
         └─→ TURNING_RIGHT ───→ IDLE
```

#### State Definitions

```typescript
enum AnimationState {
  IDLE           // Car is stationary, ready for commands
  MOVING_FORWARD // Car moving forward
  MOVING_BACKWARD// Car moving backward
  TURNING_LEFT   // Car rotating counter-clockwise
  TURNING_RIGHT  // Car rotating clockwise
  STOPPING       // Car decelerating to stop
}
```

#### State Transitions

The state machine ensures smooth transitions:

```typescript
canTransitionTo(newState): boolean {
    // Defines valid transitions
    const validTransitions = {
        [AnimationState.IDLE]: [
            AnimationState.MOVING_FORWARD,
            AnimationState.MOVING_BACKWARD,
            AnimationState.TURNING_LEFT,
            AnimationState.TURNING_RIGHT
        ],
        [AnimationState.MOVING_FORWARD]: [
            AnimationState.STOPPING,
            AnimationState.IDLE
        ],
        // ... etc
    }
}
```

**Prevents:**
- Sudden state changes that cause jerky motion
- Conflicting animations (e.g., forward + backward simultaneously)
- Incomplete animations being interrupted

---

### 5. **Physics Integration** (`hooks/use-car-animation.ts`)

The animation system integrates with Rapier physics engine:

```typescript
useFrame((state, delta) => {
    // Every frame:
    1. Check current animation state
    2. Apply forces/impulses to RigidBody
    3. Update physics store from RigidBody
    4. Handle state transitions
    5. Check for command completion
})
```

#### Frame-by-Frame Updates

```
┌────────────────────────────────────────────────────────┐
│           Physics Frame Update (60 FPS)                │
├────────────────────────────────────────────────────────┤
│                                                         │
│  1. Read Animation State                               │
│     └─→ MOVING_FORWARD                                 │
│                                                         │
│  2. Apply Physics                                       │
│     ├─→ applyForwardMovement()                         │
│     │    └─→ rigidBody.applyImpulse(...)              │
│     └─→ Check velocity limits                          │
│                                                         │
│  3. Sync Store ←→ RigidBody                            │
│     ├─→ position = rigidBody.translation()            │
│     └─→ rotation = rigidBody.rotation()               │
│                                                         │
│  4. Check Command Duration                             │
│     └─→ if (elapsed >= duration) → STOPPING           │
│                                                         │
│  5. Force Constraints                                   │
│     ├─→ Zero angular velocity (no spinning)           │
│     └─→ Apply rotation from store                     │
│                                                         │
└────────────────────────────────────────────────────────┘
```

---

### 6. **Store Architecture** (Zustand)

The simulation state is managed by Zustand with selector subscriptions:

```typescript
const useSimulationStore = create<SimulationStore>()(
    subscribeWithSelector((set, get) => ({
        // State
        isRunning: false,
        commandQueue: [],
        currentCommand: null,
        carPhysics: {...},
        carAnimation: {...},
        
        // Actions
        addCommand: (cmd) => {...},
        executeNextCommand: async () => {...},
        updateCarPhysics: (physics) => {...}
    }))
)
```

**Benefits of `subscribeWithSelector`:**
- Fine-grained subscriptions (only re-render when specific state changes)
- Efficient updates (prevents unnecessary re-renders)
- Selector memoization

---

## Data Flow Example

Let's trace a complete command from Python to 3D rendering:

### Python Code
```python
car.forward(2)  # Move 2 units forward
```

### Step-by-Step Flow

```
1. Python Execution
   └─→ car.forward(2)
       └─→ calls window.oboCarAPI.move(2)

2. Bridge Layer (python-bridge.ts)
   └─→ oboCarAPI.move(2)
       └─→ store.addCommand({
             type: 'forward',
             value: 2,
             duration: 2000
           })

3. Command Queue (simulation-store.ts)
   └─→ commandQueue.push(command)
       └─→ executeNextCommand() auto-called
           └─→ executeCommand(command)
               └─→ executeForwardCommand(...)

4. Animation Calculation
   └─→ Calculate target position:
       startPos = (0, 1, 0)
       direction = Vector3(0, 0, 1) rotated by car.rotation
       targetPos = startPos + (direction × 2)
       
   └─→ animateToPosition(targetPos, 2000ms)

5. Frame Animation (requestAnimationFrame loop)
   └─→ For each frame (60 times per second):
       progress = elapsed / duration
       currentPos = lerp(startPos, targetPos, progress)
       set carPhysics.position = currentPos

6. Physics Sync (use-car-animation.ts)
   └─→ useFrame() hook:
       Read: carAnimation.currentState = MOVING_FORWARD
       Apply: rigidBody.applyImpulse({ z: -force })
       Limit: velocity < maxSpeed

7. 3D Rendering (enhanced-obo-car-scene.tsx)
   └─→ RigidBody position updated
       └─→ Three.js renders car mesh at new position
           └─→ WebGL draws to canvas
               └─→ User sees car moving forward

8. Command Completion
   └─→ progress === 1.0
       └─→ State: MOVING_FORWARD → STOPPING → IDLE
           └─→ velocity = (0, 0, 0)
               └─→ position = targetPos (exact)
                   └─→ commandHistory.push(command)
                       └─→ Check commandQueue for next command
```

---

## Event-Driven Features

### 1. **Non-Blocking Execution**

Commands don't block Python execution:

```python
# These all queue up instantly
car.forward(1)   # Added to queue
car.left(90)  # Added to queue
car.forward(2)   # Added to queue

# Python continues immediately
# Animation system executes commands sequentially
```

### 2. **Event Loops**

Python loops are converted to event-driven loops:

```python
# Traditional blocking loop (NOT used)
while True:
    car.forward(1)
    time.sleep(1)  # Blocks entire browser!

# Event-driven loop (USED instead)
# Each iteration runs asynchronously
# Uses registerLoopCallback() internally
```

### 3. **Command Chaining**

Commands execute in sequence automatically:

```python
car.forward(1)    # Command 1
car.left(90) # Command 2 waits for 1
car.forward(2)    # Command 3 waits for 2
```

The system ensures:
- ✅ Commands execute in order
- ✅ Each command completes before next starts
- ✅ No overlapping animations
- ✅ Smooth transitions between states

### 4. **State Synchronization**

Multiple systems stay in sync:

```
Python State  ←─┐
                │
Store State   ←─┼─→ Bidirectional sync
                │
RigidBody     ←─┘
                │
                └─→ 3D Rendering
```

**Sync Points:**
- Position: Python angle ↔ Store Euler ↔ RigidBody Quaternion
- Rotation: Cumulative angle tracked for Python consistency
- Sensors: Updated from 3D raycasts → Python

---

## Key Design Patterns

### 1. **Command Pattern**
Commands are objects that encapsulate actions:
- **Encapsulation**: All command data in one object
- **Queueing**: Commands stored before execution
- **History**: Executed commands tracked for debugging/undo

### 2. **Observer Pattern** (Event Bus)
Components subscribe to events without tight coupling:
- **Decoupling**: Publishers don't know subscribers
- **Flexibility**: Add/remove listeners dynamically
- **Async**: Events emitted asynchronously

### 3. **State Machine**
Animation states with defined transitions:
- **Predictability**: Clear state transitions
- **Safety**: Invalid transitions blocked
- **Debugging**: Easy to track state flow

### 4. **Bridge Pattern**
Python ↔ JavaScript communication:
- **Abstraction**: Python sees simple API
- **Implementation**: Complex 3D/physics hidden
- **Bidirectional**: Both sides can call each other

---

## Performance Considerations

### 1. **Frame Rate Management**
- **60 FPS target**: `useFrame()` called 60 times/second
- **Delta time**: Animations use elapsed time, not frame count
- **Throttling**: Heavy operations (drift correction) throttled to 1/second

### 2. **Memory Management**
- **Persistent proxies**: Prevent Python object GC
- **Cleanup**: Loops cleaned up when stopped
- **History limits**: Command history could be capped (currently unlimited)

### 3. **Animation Cancellation**
- **Global IDs**: `positionAnimationId`, `rotationAnimationId`
- **Prevents overlap**: Cancel previous before starting new
- **Resource cleanup**: `cancelAnimationFrame()` on stop

---

## Common Workflows

### Workflow 1: Simple Movement
```python
car.forward(5)
```
→ Command added → Queue executes → Animation runs → IDLE

### Workflow 2: Loop
```python
while car.distance() < 10:
    car.forward(1)
```
→ Register loop → Iteration 1 → Wait 2s → Iteration 2 → ...

### Workflow 3: Complex Sequence
```python
car.forward(2)
car.left(90)
car.forward(3)
car.right(45)
car.backward(1)
```
→ All commands queued → Execute sequentially → Each completes fully

---

## Debugging Tools

### Console Commands

```javascript
// Check loop state
debugLoops()

// View command queue
useSimulationStore.getState().commandQueue

// View command history
useSimulationStore.getState().commandHistory

// View current state
useSimulationStore.getState().carAnimation.currentState

// View active loops
useSimulationStore.getState().activeLoops.length
```

### Log Messages

The system has extensive logging:
- `🔄` = Loop/iteration events
- `🔗` = Bridge calls
- `⏩` = Command execution
- `🛑` = Stops/cleanup
- `🔍` = Debug info
- `❌` = Errors

---

## Summary

Your event-driven system is a **sophisticated architecture** that:

1. **Decouples** Python logic from 3D rendering
2. **Queues** commands for sequential execution
3. **Animates** smoothly using physics and interpolation
4. **Syncs** state across multiple systems
5. **Handles** async loops without blocking
6. **Prevents** race conditions and conflicts
7. **Provides** clean API for Python code

This architecture allows Python code to control a real-time 3D simulation running at 60 FPS without blocking, crashing, or creating race conditions—a non-trivial engineering achievement! 🚗💨
