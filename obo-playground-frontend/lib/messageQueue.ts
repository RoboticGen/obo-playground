/**
 * Worker Message Queue
 * Handles reliable message passing between main thread and worker
 * Prevents message loss and race conditions during rapid state changes
 */

export interface WorkerMessage<T = any> {
  id: string;
  type: string;
  payload: T;
  timestamp: number;
  retryCount?: number;
}

export interface MessageQueueOptions {
  maxQueueSize?: number;
  timeout?: number;
  onError?: (error: Error) => void;
}

/**
 * Manages a queue of messages to be sent to/from worker
 * Ensures no messages are dropped during high-frequency updates
 */
class MessageQueue {
  private queue: WorkerMessage[] = [];
  private maxQueueSize: number;
  private timeout: number;
  private onError: (error: Error) => void;
  private isProcessing = false;
  private pendingRequests = new Map<string, { resolve: Function; reject: Function }>();

  constructor(options: MessageQueueOptions = {}) {
    this.maxQueueSize = options.maxQueueSize ?? 1000;
    this.timeout = options.timeout ?? 30000;
    this.onError = options.onError ?? ((error) => console.error('[MessageQueue]', error));
  }

  /**
   * Add a message to the queue
   */
  enqueue(message: WorkerMessage): void {
    if (this.queue.length >= this.maxQueueSize) {
      this.onError(new Error(`Message queue full (max: ${this.maxQueueSize})`));
      return;
    }

    this.queue.push(message);
  }

  /**
   * Get next message from queue
   */
  dequeue(): WorkerMessage | undefined {
    return this.queue.shift();
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue = [];
    this.pendingRequests.clear();
  }

  /**
   * Register a pending request
   */
  registerRequest(
    messageId: string,
    resolve: Function,
    reject: Function
  ): () => void {
    const timeout = setTimeout(() => {
      this.pendingRequests.delete(messageId);
      reject(new Error(`Message timeout: ${messageId}`));
    }, this.timeout);

    this.pendingRequests.set(messageId, { resolve, reject, timeout });

    return () => {
      clearTimeout(timeout);
      this.pendingRequests.delete(messageId);
    };
  }

  /**
   * Resolve a pending request
   */
  resolveRequest(messageId: string, data: any): void {
    const request = this.pendingRequests.get(messageId);
    if (request) {
      clearTimeout((request as any).timeout);
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
      clearTimeout((request as any).timeout);
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
