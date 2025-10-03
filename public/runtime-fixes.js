/**
 * Runtime fixes for Pyodide/Python execution
 * 
 * This script patches certain behaviors in the runtime to fix loop execution
 */

(function() {
  console.log('🔧 Installing runtime fixes for Python loop execution');
  
  // Create a global registry of pending commands
  window.oboPendingCommands = {
    count: 0,
    increment: function() {
      this.count++;
      console.log(`⬆️ Pending commands: ${this.count}`);
    },
    decrement: function() {
      this.count = Math.max(0, this.count - 1);
      console.log(`⬇️ Pending commands: ${this.count}`);
    },
    isExecuting: function() {
      return this.count > 0;
    }
  };

  // Store original methods to patch
  if (window.oboCarAPI) {
    const originalMove = window.oboCarAPI.move;
    const originalRotate = window.oboCarAPI.rotate;
    const originalBackward = window.oboCarAPI.backward;

    // Patch the move method
    window.oboCarAPI.move = function(distance) {
      console.log(`📝 [Patched] Moving ${distance} units`);
      window.oboPendingCommands.increment();
      const result = originalMove.call(window.oboCarAPI, distance);
      
      // Force immediate execution if possible
      setTimeout(() => {
        const store = window.oboSimStore ? window.oboSimStore.getState() : null;
        if (store && !store.isExecuting && !store.currentCommand && store.commandQueue.length > 0) {
          console.log('🔄 [Patched] Forcing command execution');
          store.executeNextCommand();
        }
      }, 10);
      
      return result;
    };

    // Patch the rotate method
    window.oboCarAPI.rotate = function(angle) {
      console.log(`📝 [Patched] Rotating ${angle} degrees`);
      window.oboPendingCommands.increment();
      const result = originalRotate.call(window.oboCarAPI, angle);
      
      // Force immediate execution if possible
      setTimeout(() => {
        const store = window.oboSimStore ? window.oboSimStore.getState() : null;
        if (store && !store.isExecuting && !store.currentCommand && store.commandQueue.length > 0) {
          console.log('🔄 [Patched] Forcing command execution');
          store.executeNextCommand();
        }
      }, 10);
      
      return result;
    };

    // Patch the backward method
    window.oboCarAPI.backward = function(distance) {
      console.log(`📝 [Patched] Moving backward ${distance} units`);
      window.oboPendingCommands.increment();
      const result = originalBackward.call(window.oboCarAPI, distance);
      
      // Force immediate execution if possible
      setTimeout(() => {
        const store = window.oboSimStore ? window.oboSimStore.getState() : null;
        if (store && !store.isExecuting && !store.currentCommand && store.commandQueue.length > 0) {
          console.log('🔄 [Patched] Forcing command execution');
          store.executeNextCommand();
        }
      }, 10);
      
      return result;
    };

    console.log('✅ Successfully patched oboCarAPI methods for better loop handling');
  } else {
    console.warn('⚠️ oboCarAPI not found, patches not applied');
  }

  // Expose the simulation store to the global scope for patched functions
  if (typeof window.useSimulationStore !== 'undefined') {
    window.oboSimStore = window.useSimulationStore;
    console.log('✅ Exposed simulation store to global scope');
  }
})();