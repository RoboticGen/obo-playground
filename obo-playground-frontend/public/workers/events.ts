/**
 * Event emission utilities for the Pyodide worker
 */

import type { CarEvent } from '../../lib/carEvents';

/**
 * Send event to main thread
 */
export function emitEvent(event: CarEvent): void {
  console.log('[PyodideWorker] EMIT EVENT:', event.type, event);
  self.postMessage({
    type: 'event',
    payload: event,
    timestamp: Date.now(),
  });
}

/**
 * Emit execution started event
 */
export function emitExecutionStarted(): void {
  emitEvent({
    type: 'execution:started',
    timestamp: Date.now(),
  });
}

/**
 * Emit execution completed event
 */
export function emitExecutionCompleted(): void {
  emitEvent({
    type: 'execution:completed',
    timestamp: Date.now(),
  });
}

/**
 * Emit execution output event
 */
export function emitExecutionOutput(message: string): void {
  emitEvent({
    type: 'execution:output',
    message,
    timestamp: Date.now(),
  });
}

/**
 * Emit error event
 */
export function emitError(message: string): void {
  emitEvent({
    type: 'error:occurred',
    message,
    timestamp: Date.now(),
  });
}

/**
 * Emit sensor update event
 */
export function emitSensorUpdate(front: number, left: number, right: number): void {
  emitEvent({
    type: 'sensor:update',
    frontDistance: front,
    leftDistance: left,
    rightDistance: right,
    timestamp: Date.now(),
  });
}

/**
 * Emit state changed event
 */
export function emitStateChange(stateJson: string): void {
  try {
    const state = JSON.parse(stateJson);
    emitEvent({
      type: 'state:changed',
      leftMotorSpeed: state.leftMotorSpeed,
      rightMotorSpeed: state.rightMotorSpeed,
      leftMotorDirection: state.leftMotorDirection,
      rightMotorDirection: state.rightMotorDirection,
      frontDistance: state.frontDistance,
      leftDistance: state.leftDistance,
      rightDistance: state.rightDistance,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[PyodideWorker] Failed to parse state:', error);
  }
}
