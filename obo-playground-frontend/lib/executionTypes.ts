/**
 * Execution Types
 * Shared type definitions for Python code execution
 */

/**
 * Current state of the robot car (motor speeds, sensor readings)
 */
export interface CarState {
  leftMotorSpeed: number;
  rightMotorSpeed: number;
  leftMotorDirection: number;
  rightMotorDirection: number;
  frontDistance: number;
  leftDistance: number;
  rightDistance: number;
}

/**
 * Event emitted during code execution
 */
export interface ExecutionEvent {
  type: 'line' | 'output' | 'error' | 'complete' | 'state_update';
  lineNumber?: number;
  message?: string;
  carState?: CarState;
}

/**
 * Type for event callback handler
 */
export type ExecutionEventHandler = (event: ExecutionEvent) => void;
