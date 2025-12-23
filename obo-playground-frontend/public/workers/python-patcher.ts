/**
 * Python environment patcher
 * Patches OBOCar class to emit state change events
 */

import { emitStateChange } from './events';

/**
 * Patch Python environment to emit events on state changes
 */
export async function patchPythonEnvironment(pyodide: any): Promise<void> {
  // Register callback in Pyodide
  pyodide.globals.set('sendStateChangeEvent', emitStateChange);

  await pyodide.runPythonAsync(getPatchCode());
}

/**
 * Get Python code for patching OBOCar
 */
function getPatchCode(): string {
  return `
import sys
import json
import asyncio
import time as _time

from obocar import OBOCar as _OBOCar

# Store reference to event emitter - this is now properly connected to JS
sendStateChange = sendStateChangeEvent

# Wrap OBOCar to emit state change events
class OBOCar(_OBOCar):
    def __init__(self):
        super().__init__()
    
    def _emit_state_change(self):
        '''Emit state changed event'''
        state = {
            'leftMotorSpeed': self.left_motor_speed,
            'rightMotorSpeed': self.right_motor_speed,
            'leftMotorDirection': self.left_motor_direction,
            'rightMotorDirection': self.right_motor_direction,
            'frontDistance': self.front_distance,
            'leftDistance': self.left_distance,
            'rightDistance': self.right_distance,
        }
        sendStateChange(json.dumps(state))
    
    def stop(self):
        super().stop()
        self._emit_state_change()
    
    def move_forward(self, speed=None, speed_left=None, speed_right=None):
        super().move_forward(speed, speed_left, speed_right)
        self._emit_state_change()
    
    def move_backward(self, speed=None, speed_left=None, speed_right=None):
        super().move_backward(speed, speed_left, speed_right)
        self._emit_state_change()
    
    def turn_left(self, speed=None, speed_left=None, speed_right=None):
        super().turn_left(speed, speed_left, speed_right)
        self._emit_state_change()
    
    def turn_right(self, speed=None, speed_left=None, speed_right=None):
        super().turn_right(speed, speed_left, speed_right)
        self._emit_state_change()
    
    def left_motor_forward(self, speed=None):
        super().left_motor_forward(speed)
        self._emit_state_change()
    
    def left_motor_backward(self, speed=None):
        super().left_motor_backward(speed)
        self._emit_state_change()
    
    def right_motor_forward(self, speed=None):
        super().right_motor_forward(speed)
        self._emit_state_change()
    
    def right_motor_backward(self, speed=None):
        super().right_motor_backward(speed)
        self._emit_state_change()

# Replace with patched version
import obocar
obocar.OBOCar = OBOCar

# Add sleep function from time module
from time import sleep

# Setup console redirection
class ConsoleWriter:
    def write(self, text):
        if text.strip():
            print(text.rstrip())
    def flush(self):
        pass

sys.stdout = ConsoleWriter()
sys.stderr = ConsoleWriter()
  `;
}
