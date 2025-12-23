/**
 * Pyodide Worker with Event-Driven Architecture
 * Runs Python code in a separate thread and emits events for state changes
 */

import { handleMessage } from './message-handler';

// Set up message listener
self.onmessage = handleMessage;

console.log('[PyodideWorker] Script loaded');
