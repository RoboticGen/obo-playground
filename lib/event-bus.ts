type EventHandler = (...args: any[]) => void;

class EventBus {
    private listeners: Record<string, EventHandler[]> = {};

    on(event: string, handler: EventHandler) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(handler);
    }

    off(event: string, handler: EventHandler) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(h => h !== handler);
    }

    emit(event: string, ...args: any[]) {
        if (!this.listeners[event]) return;
        // Use setTimeout to make event handling asynchronous and prevent blocking
        setTimeout(() => {
            this.listeners[event].forEach(handler => {
                try {
                    handler(...args);
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            });
        }, 0);
    }

    // Add method to get all registered events (useful for debugging)
    getRegisteredEvents(): string[] {
        return Object.keys(this.listeners);
    }

    // Add method to check if an event has listeners
    hasListeners(event: string): boolean {
        return !!this.listeners[event] && this.listeners[event].length > 0;
    }

    // Add method to remove all listeners for an event
    removeAllListeners(event: string) {
        if (this.listeners[event]) {
            delete this.listeners[event];
        }
    }
}

export const eventBus = new EventBus();

// Make eventBus available globally for Python code to access
if (typeof window !== 'undefined') {
    (window as any).eventBus = eventBus;
}