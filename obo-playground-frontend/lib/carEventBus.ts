/**
 * Event Bus for Car Simulation
 * Implements pub/sub pattern for decoupled event communication
 */

import { CarEvent, CarEventType, CarEventHandler } from './carEvents';

interface EventSubscription {
  id: string;
  handler: CarEventHandler;
  once: boolean;
}

/**
 * Centralized event bus for all car-related events
 * Enables loose coupling between Python executor, 3D renderer, and UI
 */
class CarEventBus {
  private subscriptions = new Map<CarEventType, EventSubscription[]>();
  private eventHistory: CarEvent[] = [];
  private maxHistorySize = 100;
  private isEnabled = true;

  /**
   * Subscribe to events of a specific type
   * @param eventType - Type of event to listen for
   * @param handler - Callback function
   * @returns Unsubscribe function
   */
  on<T extends CarEventType>(
    eventType: T,
    handler: CarEventHandler
  ): () => void {
    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, []);
    }

    const subscriptionId = `${eventType}_${Date.now()}_${Math.random()}`;
    const subscription: EventSubscription = {
      id: subscriptionId,
      handler,
      once: false,
    };

    this.subscriptions.get(eventType)!.push(subscription);

    // Return unsubscribe function
    return () => {
      this.off(eventType, subscriptionId);
    };
  }

  /**
   * Subscribe to a single event occurrence
   * @param eventType - Type of event to listen for
   * @param handler - Callback function
   * @returns Unsubscribe function
   */
  once<T extends CarEventType>(
    eventType: T,
    handler: CarEventHandler
  ): () => void {
    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, []);
    }

    const subscriptionId = `${eventType}_${Date.now()}_${Math.random()}`;
    const subscription: EventSubscription = {
      id: subscriptionId,
      handler,
      once: true,
    };

    this.subscriptions.get(eventType)!.push(subscription);

    return () => {
      this.off(eventType, subscriptionId);
    };
  }

  /**
   * Unsubscribe from events
   * @param eventType - Type of event
   * @param subscriptionId - Subscription ID returned by on()
   */
  off(eventType: CarEventType, subscriptionId: string): void {
    const handlers = this.subscriptions.get(eventType);
    if (!handlers) return;

    const index = handlers.findIndex((sub) => sub.id === subscriptionId);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }

  /**
   * Emit an event to all subscribers
   * @param event - Event to emit
   */
  async emit(event: CarEvent): Promise<void> {
    if (!this.isEnabled) return;

    // Add to history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    const handlers = this.subscriptions.get(event.type);
    if (!handlers) return;

    // Filter out expired subscriptions
    const activeHandlers = handlers.filter((sub) => !sub.once);
    const onceHandlers = handlers.filter((sub) => sub.once);

    // Execute handlers
    const promises = [...activeHandlers, ...onceHandlers].map((sub) =>
      Promise.resolve(sub.handler(event)).catch((error) => {
        console.error(`[CarEventBus] Error in ${event.type} handler:`, error);
      })
    );

    await Promise.all(promises);

    // Remove once handlers
    onceHandlers.forEach((sub) => {
      const index = handlers.indexOf(sub);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    });
  }

  /**
   * Get event history (for debugging or replay)
   */
  getHistory(eventType?: CarEventType, limit: number = 50): CarEvent[] {
    let history = this.eventHistory;

    if (eventType) {
      history = history.filter((e) => e.type === eventType);
    }

    return history.slice(-limit);
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Get subscriber count for an event type
   */
  getSubscriberCount(eventType: CarEventType): number {
    return this.subscriptions.get(eventType)?.length ?? 0;
  }

  /**
   * Temporarily disable event emission
   */
  disable(): void {
    this.isEnabled = false;
  }

  /**
   * Re-enable event emission
   */
  enable(): void {
    this.isEnabled = true;
  }

  /**
   * Clear all subscriptions
   */
  reset(): void {
    this.subscriptions.clear();
    this.eventHistory = [];
  }
}

// Singleton instance
let eventBusInstance: CarEventBus | null = null;

/**
 * Get the singleton CarEventBus instance
 */
export function getCarEventBus(): CarEventBus {
  if (!eventBusInstance) {
    eventBusInstance = new CarEventBus();
  }
  return eventBusInstance;
}

/**
 * Reset the event bus (useful for testing)
 */
export function resetCarEventBus(): void {
  if (eventBusInstance) {
    eventBusInstance.reset();
  }
}

export default getCarEventBus;
