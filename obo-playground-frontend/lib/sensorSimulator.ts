/**
 * Sensor Simulation Engine
 * Calculates real-time sensor distances from 3D scene
 * Sends updates back to Python via event bus
 */

import { getCarEventBus } from './carEventBus';
import { getErrorHandler } from './errorHandler';

export interface SensorConfig {
  updateFrequency: number; // ms between updates
  maxDistance: number; // max detection distance in cm
  enableCollisionDetection: boolean;
}

export interface SensorReading {
  front: number;
  left: number;
  right: number;
}

/**
 * Simulates distance sensors for the car
 * Can be connected to actual 3D scene raytracing or use preset values
 */
class SensorSimulator {
  private eventBus = getCarEventBus();
  private errorHandler = getErrorHandler();
  private config: SensorConfig;
  private currentReading: SensorReading = {
    front: 100,
    left: 100,
    right: 100,
  };
  private updateInterval: NodeJS.Timeout | null = null;
  private sensorFunction: ((config: any) => SensorReading) | null = null;
  private carPosition = { x: 0, y: 0, rotation: 0 };

  constructor(config: Partial<SensorConfig> = {}) {
    this.config = {
      updateFrequency: config.updateFrequency ?? 100,
      maxDistance: config.maxDistance ?? 200,
      enableCollisionDetection: config.enableCollisionDetection ?? true,
    };
  }

  /**
   * Set a custom sensor function to calculate distances
   * This would typically integrate with Babylon.js raycasting
   */
  setSensorFunction(
    fn: (config: { carPos: any; maxDist: number }) => SensorReading
  ): void {
    this.sensorFunction = fn;
  }

  /**
   * Update car position and rotation
   * Used to calculate sensor readings based on car state
   */
  updateCarPosition(x: number, y: number, rotation: number): void {
    this.carPosition = { x, y, rotation };
  }

  /**
   * Manually set sensor readings
   */
  setReading(front: number, left: number, right: number): void {
    this.currentReading = { front, left, right };
    this.emitSensorUpdate();
  }

  /**
   * Calculate sensor readings
   */
  private calculateReading(): SensorReading {
    // If custom function provided, use it
    if (this.sensorFunction) {
      return this.sensorFunction({
        carPos: this.carPosition,
        maxDist: this.config.maxDistance,
      });
    }

    // Default: use current reading
    return this.currentReading;
  }

  /**
   * Emit sensor update event
   */
  private emitSensorUpdate(): void {
    const reading = this.calculateReading();

    this.eventBus.emit({
      type: 'sensor:update',
      ...reading,
      timestamp: Date.now(),
    });

    // Update internal state
    this.currentReading = reading;

    // Check for collisions
    if (this.config.enableCollisionDetection) {
      this.checkCollisions(reading);
    }
  }

  /**
   * Check for collisions based on sensor readings
   */
  private checkCollisions(reading: SensorReading): void {
    const collisionThreshold = 10; // cm

    if (reading.front < collisionThreshold) {
      this.eventBus.emit({
        type: 'collision:detected',
        side: 'front',
        distance: reading.front,
        timestamp: Date.now(),
      });
    }

    if (reading.left < collisionThreshold) {
      this.eventBus.emit({
        type: 'collision:detected',
        side: 'left',
        distance: reading.left,
        timestamp: Date.now(),
      });
    }

    if (reading.right < collisionThreshold) {
      this.eventBus.emit({
        type: 'collision:detected',
        side: 'right',
        distance: reading.right,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Start continuous sensor updates
   */
  start(): void {
    if (this.updateInterval) {
      return; // Already running
    }

    this.updateInterval = setInterval(() => {
      try {
        this.emitSensorUpdate();
      } catch (error: any) {
        this.errorHandler.handle(error, {
          source: 'js',
          severity: 'warning',
          context: { component: 'SensorSimulator' },
        });
      }
    }, this.config.updateFrequency);
  }

  /**
   * Stop continuous sensor updates
   */
  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Get current reading
   */
  getReading(): SensorReading {
    return { ...this.currentReading };
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<SensorConfig>): void {
    this.config = { ...this.config, ...config };

    // Restart with new frequency if needed
    if (this.updateInterval) {
      this.stop();
      this.start();
    }
  }
}

// Singleton instance
let simulatorInstance: SensorSimulator | null = null;

/**
 * Get the singleton sensor simulator
 */
export function getSensorSimulator(
  config?: Partial<SensorConfig>
): SensorSimulator {
  if (!simulatorInstance) {
    simulatorInstance = new SensorSimulator(config);
  }
  return simulatorInstance;
}

/**
 * Reset sensor simulator
 */
export function resetSensorSimulator(): void {
  if (simulatorInstance) {
    simulatorInstance.stop();
  }
  simulatorInstance = null;
}

export default getSensorSimulator;
