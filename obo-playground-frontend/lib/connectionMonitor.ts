/**
 * Connection Monitor Service
 * Monitors backend connectivity and manages sync operations
 */

type ConnectionStatus = 'online' | 'offline' | 'checking';
type ConnectionListener = (status: ConnectionStatus) => void;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ConnectionMonitor {
  private status: ConnectionStatus = 'checking';
  private listeners: Set<ConnectionListener> = new Set();
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 10000; // 10 seconds
  private isInitialized = false;

  /**
   * Initialize connection monitoring
   */
  init(): void {
    if (this.isInitialized) return;

    console.log('🔌 Initializing connection monitor...');
    
    // Check initial connection
    this.checkConnection();

    // Set up periodic checks
    this.checkInterval = setInterval(() => {
      this.checkConnection();
    }, this.CHECK_INTERVAL);

    // Listen to browser online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('🌐 Browser online event');
        this.checkConnection();
      });

      window.addEventListener('offline', () => {
        console.log('📵 Browser offline event');
        this.updateStatus('offline');
      });
    }

    this.isInitialized = true;
  }

  /**
   * Clean up connection monitor
   */
  destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.listeners.clear();
    this.isInitialized = false;
  }

  /**
   * Check connection to backend
   */
  private async checkConnection(): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${API_URL}/health/ping`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        this.updateStatus('online');
      } else {
        this.updateStatus('offline');
      }
    } catch (error) {
      console.warn('Connection check failed:', error);
      this.updateStatus('offline');
    }
  }

  /**
   * Update connection status and notify listeners
   */
  private updateStatus(newStatus: ConnectionStatus): void {
    const previousStatus = this.status;
    this.status = newStatus;

    if (previousStatus !== newStatus) {
      console.log(`🔌 Connection status changed: ${previousStatus} → ${newStatus}`);
      this.notifyListeners();
    }
  }

  /**
   * Notify all listeners of status change
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.status);
      } catch (error) {
        console.error('Error in connection listener:', error);
      }
    });
  }

  /**
   * Subscribe to connection status changes
   */
  subscribe(listener: ConnectionListener): () => void {
    this.listeners.add(listener);
    
    // Immediately notify with current status
    listener(this.status);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Check if currently online
   */
  isOnline(): boolean {
    return this.status === 'online';
  }

  /**
   * Force a connection check
   */
  async forceCheck(): Promise<void> {
    await this.checkConnection();
  }
}

// Export singleton instance
export const connectionMonitor = new ConnectionMonitor();
export type { ConnectionStatus };
