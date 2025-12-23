/**
 * Pending Request Tracker
 * Tracks async operations between main thread and worker with timeouts
 */

export interface WorkerMessage<T = any> {
  id: string;
  type: string;
  payload: T;
  timestamp: number;
}

export interface MessageQueueOptions {
  timeout?: number;
  onError?: (error: Error) => void;
}

/**
 * Tracks pending async requests with timeout handling
 */
class MessageQueue {
  private timeout: number;
  private onError: (error: Error) => void;
  private pendingRequests = new Map<string, { resolve: Function; reject: Function; timeout: any }>();

  constructor(options: MessageQueueOptions = {}) {
    this.timeout = options.timeout ?? 30000; // 30 seconds
    this.onError = options.onError ?? ((error) => console.error('[MessageQueue]', error));
  }

  /**
   * Clear all pending requests
   */
  clear(): void {
    // Clear all timeouts
    this.pendingRequests.forEach((request) => clearTimeout(request.timeout));
    this.pendingRequests.clear();
  }

  /**
   * Register a pending request with timeout
   */
  registerRequest(
    messageId: string,
    resolve: Function,
    reject: Function
  ): () => void {
    const timeoutId = setTimeout(() => {
      this.pendingRequests.delete(messageId);
      reject(new Error(`Request timeout after ${this.timeout}ms: ${messageId}`));
    }, this.timeout);

    this.pendingRequests.set(messageId, { resolve, reject, timeout: timeoutId });

    // Return unregister function
    return () => {
      const request = this.pendingRequests.get(messageId);
      if (request) {
        clearTimeout(request.timeout);
        this.pendingRequests.delete(messageId);
      }
    };
  }

  /**
   * Resolve a pending request
   */
  resolveRequest(messageId: string, data: any): void {
    const request = this.pendingRequests.get(messageId);
    if (request) {
      clearTimeout(request.timeout);
      request.resolve(data);
      this.pendingRequests.delete(messageId);
    }
  }

  /**
   * Reject a pending request
   */
  rejectRequest(messageId: string, error: Error): void {
    const request = this.pendingRequests.get(messageId);
    if (request) {
      clearTimeout(request.timeout);
      request.reject(error);
      this.pendingRequests.delete(messageId);
    }
  }

  /**
   * Get number of pending requests
   */
  getPendingCount(): number {
    return this.pendingRequests.size;
  }
}

export default MessageQueue;
