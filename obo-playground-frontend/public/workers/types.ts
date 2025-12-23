/**
 * Type definitions for the Pyodide worker
 */

export interface WorkerRequest<T = any> {
  id: string;
  type: 'init' | 'execute' | 'sensor-update' | 'ping' | 'terminate' | 'load-module';
  payload?: T;
}

export interface ExecutePayload {
  code: string;
}

export interface SensorPayload {
  front: number;
  left: number;
  right: number;
}

export interface ModulePayload {
  code: string;
}

export interface CarState {
  leftMotorSpeed: number;
  rightMotorSpeed: number;
  leftMotorDirection: number;
  rightMotorDirection: number;
  frontDistance: number;
  leftDistance: number;
  rightDistance: number;
}

export const DEFAULT_CAR_STATE: CarState = {
  leftMotorSpeed: 0,
  rightMotorSpeed: 0,
  leftMotorDirection: 0,
  rightMotorDirection: 0,
  frontDistance: 100,
  leftDistance: 100,
  rightDistance: 100,
};
