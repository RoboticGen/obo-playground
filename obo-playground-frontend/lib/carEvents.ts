/**
 * Car Event Types and Interfaces
 * Defines all event types for bidirectional Python-JS communication
 */

export type CarEventType =
  | 'motor:command'
  | 'sensor:update'
  | 'collision:detected'
  | 'state:changed'
  | 'error:occurred'
  | 'execution:started'
  | 'execution:completed'
  | 'execution:line'
  | 'execution:output';

// ============================================================================
// Motor Events (Python → JS, JS → Python)
// ============================================================================

export interface MotorCommandEvent {
  type: 'motor:command';
  leftSpeed: number;
  rightSpeed: number;
  leftDirection: number;
  rightDirection: number;
  timestamp: number;
}

// ============================================================================
// Sensor Events (JS → Python)
// ============================================================================

export interface SensorUpdateEvent {
  type: 'sensor:update';
  frontDistance: number;
  leftDistance: number;
  rightDistance: number;
  timestamp: number;
}

// ============================================================================
// Collision Events (JS → Python)
// ============================================================================

export interface CollisionDetectedEvent {
  type: 'collision:detected';
  side: 'front' | 'left' | 'right' | 'back';
  distance: number;
  objectName?: string;
  timestamp: number;
}

// ============================================================================
// State Events (Python → JS)
// ============================================================================

export interface StateChangedEvent {
  type: 'state:changed';
  leftMotorSpeed: number;
  rightMotorSpeed: number;
  leftMotorDirection: number;
  rightMotorDirection: number;
  frontDistance: number;
  leftDistance: number;
  rightDistance: number;
  timestamp: number;
}

// ============================================================================
// Execution Events (Python → JS)
// ============================================================================

export interface ExecutionLineEvent {
  type: 'execution:line';
  lineNumber: number;
  timestamp: number;
}

export interface ExecutionOutputEvent {
  type: 'execution:output';
  message: string;
  timestamp: number;
}

export interface ExecutionStartedEvent {
  type: 'execution:started';
  timestamp: number;
}

export interface ExecutionCompletedEvent {
  type: 'execution:completed';
  timestamp: number;
}

// ============================================================================
// Error Events
// ============================================================================

export interface ErrorOccurredEvent {
  type: 'error:occurred';
  message: string;
  code?: string;
  context?: Record<string, any>;
  timestamp: number;
}

// ============================================================================
// Union Types
// ============================================================================

export type CarEvent =
  | MotorCommandEvent
  | SensorUpdateEvent
  | CollisionDetectedEvent
  | StateChangedEvent
  | ExecutionLineEvent
  | ExecutionOutputEvent
  | ExecutionStartedEvent
  | ExecutionCompletedEvent
  | ErrorOccurredEvent;

export type CarEventHandler<T extends CarEvent = CarEvent> = (event: T) => void | Promise<void>;
