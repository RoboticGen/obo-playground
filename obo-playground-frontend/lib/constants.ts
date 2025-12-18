/**
 * Application-wide Constants
 * Centralized configuration for magic numbers, URLs, and API endpoints
 */

// ============================================================================
// API Configuration
// ============================================================================

/** Base URL for all API requests */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/** API endpoint paths */
export const API_ENDPOINTS = {
  PROJECTS: '/projects',
  ENVIRONMENTS: '/environments',
  PROJECT_CONTENT: (projectId: string) => `/projects/${projectId}/content`,
  PROJECT_SAVE: (projectId: string) => `/projects/${projectId}/save`,
  PROJECT_DELETE: (projectId: string) => `/projects/${projectId}`,
} as const;

// ============================================================================
// Pyodide Configuration
// ============================================================================

/** Pyodide CDN configuration */
export const PYODIDE_CONFIG = {
  CDN_URL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js',
  INDEX_URL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/',
  VERSION: 'v0.25.1',
} as const;

/** Timeout for code execution (milliseconds) */
export const CODE_EXECUTION_TIMEOUT = 30000; // 30 seconds

// ============================================================================
// Auto-Save Configuration
// ============================================================================

/** Auto-save interval in milliseconds */
export const AUTO_SAVE_INTERVAL = 5000; // 5 seconds

/** Debounce delay for backend sync */
export const BACKEND_SYNC_DELAY = 1000; // 1 second

// ============================================================================
// Default Code Template
// ============================================================================

export const DEFAULT_CODE = `# OBOCar Playground
# Control your virtual car with Python!

from obocar import OBOCar
from time import sleep

# Create car instance
car = OBOCar()

# Move forward for 1 second
car.move_forward(speed=512)
sleep(1)

# Stop
car.stop()
sleep(0.5)

# Turn left
car.turn_left(speed=400)
sleep(0.5)

# Move forward again
car.move_forward(speed=512)
sleep(1)

# Stop
car.stop()

# Try a simple pattern - Square movement
# for i in range(4):
#     car.move_forward(speed=512)
#     sleep(1)
#     car.turn_right(speed=400)
#     sleep(0.5)
# car.stop()

# Or try obstacle avoidance with while True:
# while True:
#     distance = car.get_front_distance()
#     if distance < 20:
#         car.move_backward(512)
#         sleep(0.3)
#         car.turn_right(512)
#         sleep(0.5)
#     else:
#         car.move_forward(512)
#     sleep(0.1)
`;

// ============================================================================
// Car State Defaults
// ============================================================================

export const DEFAULT_CAR_STATE = {
  leftMotorSpeed: 0,
  rightMotorSpeed: 0,
  leftMotorDirection: 0,
  rightMotorDirection: 0,
  frontDistance: 100,
  leftDistance: 100,
  rightDistance: 100,
} as const;

// ============================================================================
// UI Configuration
// ============================================================================

/** Default split panel width (percentage) */
export const DEFAULT_SPLIT_PANEL_WIDTH = 60;

/** Minimum split panel width (percentage) */
export const MIN_SPLIT_PANEL_WIDTH = 20;

/** Maximum split panel width (percentage) */
export const MAX_SPLIT_PANEL_WIDTH = 80;

// ============================================================================
// Babylon.js Scene Configuration
// ============================================================================

export const BABYLON_CONFIG = {
  // Camera defaults
  CAMERA: {
    INITIAL_ALPHA: -Math.PI / 2,        // Horizontal rotation
    INITIAL_BETA: Math.PI / 3,          // Vertical angle
    INITIAL_RADIUS: 80,                 // Distance from target
    MIN_RADIUS: 10,                     // Closest zoom
    MAX_RADIUS: 300,                    // Farthest zoom
    WHEEL_ZOOM_SPEED: 0.1,              // Lower = faster zoom
    INERTIA: 0.7,                       // Camera momentum
  },
  
  // Lighting
  LIGHT: {
    AMBIENT_INTENSITY: 0.8,
    DIRECTIONAL_INTENSITY: 1,
    SHADOW_MAP_SIZE: 2048,
  },

  // Car model
  CAR: {
    SCALE: 0.02,
    INITIAL_HEIGHT: 2,
    ROTATION_SPEED: 0.003,
  },

  // Ground
  GROUND: {
    WIDTH: 200,
    HEIGHT: 200,
    COLOR: [0.3, 0.3, 0.3],
  },

  // Grid
  GRID: {
    SIZE: 50,
    COLOR: [0.5, 0.5, 0.5],
    LINE_WIDTH: 1,
  },
} as const;

// ============================================================================
// User Configuration
// ============================================================================

/** Hardcoded user ID (TODO: Replace with real authentication) */
export const HARDCODED_USER_ID = '123e4567-e89b-12d3-a456-426614174000';

// ============================================================================
// Error Messages
// ============================================================================

export const ERROR_MESSAGES = {
  PYODIDE_LOAD_FAILED: 'Failed to load Python runtime. Please refresh the page.',
  PROJECT_LOAD_FAILED: 'Failed to load project. Please check your connection.',
  CODE_SAVE_FAILED: 'Failed to save code. Changes saved locally.',
  EXECUTION_TIMEOUT: 'Code execution timed out. Please check for infinite loops.',
  SCENE_INIT_FAILED: 'Failed to initialize 3D scene.',
  OBOCAR_MODULE_FAILED: 'Could not load OBOCar module. Make sure obocar.py exists.',
} as const;

// ============================================================================
// Success Messages
// ============================================================================

export const SUCCESS_MESSAGES = {
  CODE_SAVED: 'Code saved successfully',
  PROJECT_CREATED: 'Project created successfully',
  PROJECT_DELETED: 'Project deleted successfully',
  SYNCED: 'Changes synced to server',
  BACK_ONLINE: 'Connection restored. Syncing changes...',
} as const;

// ============================================================================
// Log Prefixes
// ============================================================================

export const LOG_PREFIX = {
  INFO: '📝',
  SUCCESS: '✅',
  ERROR: '❌',
  WARNING: '⚠️',
  PYTHON: '🐍',
  PACKAGE: '📦',
  ROCKET: '🚀',
} as const;
