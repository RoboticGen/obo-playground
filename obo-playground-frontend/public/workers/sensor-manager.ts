/**
 * Sensor management
 */

import { getPyodide } from './pyodide-init';
import { emitSensorUpdate } from './events';
import { CarState, DEFAULT_CAR_STATE } from './types';

let carState: CarState = { ...DEFAULT_CAR_STATE };

/**
 * Update sensor values from JS
 */
export function updateSensorValues(front: number, left: number, right: number): void {
  const pyodide = getPyodide();
  if (!pyodide) return;

  carState.frontDistance = front;
  carState.leftDistance = left;
  carState.rightDistance = right;

  pyodide.runPython(`
if 'car' in dir():
    car.set_front_distance(${front})
    car.set_left_distance(${left})
    car.set_right_distance(${right})
  `);

  emitSensorUpdate(front, left, right);
}

/**
 * Get current car state
 */
export function getCarState(): CarState {
  return { ...carState };
}
