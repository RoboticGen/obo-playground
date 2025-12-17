/**
 * Error Handler and Recovery
 * Provides graceful error handling and recovery mechanisms
 */

import { getCarEventBus } from './carEventBus';
import { ErrorOccurredEvent } from './carEvents';

export interface ErrorContext {
  source: 'python' | 'js' | 'worker' | 'event-bus';
  context?: Record<string, any>;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

/**
 * Handles errors gracefully and emits error events
 */
class ErrorHandler {
  private errorLog: Array<{ error: Error; context: ErrorContext; timestamp: Date }> = [];
  private maxLogSize = 100;

  /**
   * Handle an error with context
   */
  handle(error: Error, context: ErrorContext): void {
    // Log error
    this.errorLog.push({
      error,
      context,
      timestamp: new Date(),
    });

    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    // Log to console
    const logLevel = context.severity === 'critical' ? 'error' : 'warn';
    console[logLevel as 'warn' | 'error'](
      `[${context.source}] ${context.severity.toUpperCase()}: ${error.message}`,
      context.context
    );

    // Emit error event
    const eventBus = getCarEventBus();
    eventBus.emit({
      type: 'error:occurred',
      message: error.message,
      code: error.name,
      context: context.context,
      timestamp: Date.now(),
    });

    // Handle critical errors
    if (context.severity === 'critical') {
      this.handleCriticalError(error, context);
    }
  }

  /**
   * Handle critical errors with recovery attempts
   */
  private handleCriticalError(error: Error, context: ErrorContext): void {
    // Could implement auto-recovery or restart logic here
    console.error('[ErrorHandler] Critical error - recovery may be needed:', error);
  }

  /**
   * Get error log (for debugging)
   */
  getLog(limit: number = 20) {
    return this.errorLog.slice(-limit);
  }

  /**
   * Clear error log
   */
  clearLog(): void {
    this.errorLog = [];
  }

  /**
   * Check if there are recent critical errors
   */
  hasRecentCriticalError(timeWindowMs: number = 5000): boolean {
    const now = Date.now();
    return this.errorLog.some(
      (entry) =>
        entry.context.severity === 'critical' &&
        now - entry.timestamp.getTime() < timeWindowMs
    );
  }
}

// Singleton instance
let errorHandlerInstance: ErrorHandler | null = null;

/**
 * Get the singleton ErrorHandler instance
 */
export function getErrorHandler(): ErrorHandler {
  if (!errorHandlerInstance) {
    errorHandlerInstance = new ErrorHandler();
  }
  return errorHandlerInstance;
}

/**
 * Utility function to safely execute async code with error handling
 */
export async function safeAsyncExecute<T>(
  fn: () => Promise<T>,
  context: Omit<ErrorContext, 'severity'> & { severity?: ErrorContext['severity'] }
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    const errorHandler = getErrorHandler();
    errorHandler.handle(error as Error, {
      ...context,
      severity: context.severity ?? 'error',
    });
    return null;
  }
}

/**
 * Utility function to safely execute sync code with error handling
 */
export function safeExecute<T>(
  fn: () => T,
  context: Omit<ErrorContext, 'severity'> & { severity?: ErrorContext['severity'] }
): T | null {
  try {
    return fn();
  } catch (error) {
    const errorHandler = getErrorHandler();
    errorHandler.handle(error as Error, {
      ...context,
      severity: context.severity ?? 'error',
    });
    return null;
  }
}

export default getErrorHandler;
