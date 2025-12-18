/**
 * Playground Constants
 * Shared constants and configuration values
 */

export const PLAYGROUND_CONSTANTS = {
  // Motor speed configuration
  MOTOR_MAX_SPEED: 512,

  // Animation durations
  SPINNER_SIZE: 12,
  SPINNER_BORDER_WIDTH: 4,

  // Panel dimensions
  MOTOR_SPEED_BAR_WIDTH: 96, // w-24 = 6rem = 96px
  MOTOR_SPEED_BAR_HEIGHT: 24, // h-6 = 1.5rem = 24px

  // Status indicators
  STATUS_ICONS: {
    RUNNING: '🟢',
    READY: '⚪',
    INITIALIZING: '🟡',
    SUCCESS: '✅',
    ERROR: '❌',
    WARNING: '⚠️',
  },

  // Messages
  MESSAGES: {
    PYTHON_LOADING: 'Loading Python runtime...',
    PYTHON_INITIALIZED: 'Python runtime ready! ✅',
    PYTHON_FAILED: 'Failed to initialize Python',
    PYTHON_NOT_READY: 'Python runtime is still loading, please wait...',
    CODE_EXECUTING: 'Starting execution...',
    CODE_STOPPED: 'Execution stopped by user',
    CAR_RESET: 'Car reset to initial position',
    ENVIRONMENT_LOADED: 'Loaded environment:',
    BACK_ONLINE: 'Back Online',
    CONNECTION_RESTORED: 'Connection restored.',
    OFFLINE_MODE: 'Offline Mode',
    SYNC_ON_RESTORE: 'Changes will sync when back online.',
    LOADING_PROJECT: 'Loading project...',
    LOADING_3D_ENGINE: 'Loading 3D Engine...',
    CONSOLE_EMPTY: 'No output yet. Run your code to see results here.',
    SHOW_CONSOLE: 'Show Console',
    HIDE_CONSOLE: 'Hide Console',
    CONSOLE_LABEL: 'Console Output',
    PYTHON_INITIALIZING: 'Initializing Python...',
    LOAD_MOMENT: 'This may take a moment on first load',
    RUNTIME_STATUS: 'Python Runtime: Pyodide (WebAssembly)',
  },

  // CSS Classes
  COLORS: {
    SUCCESS: 'text-green-400',
    ERROR: 'text-red-400',
    WARNING: 'text-yellow-400',
    INFO: 'text-blue-400',
    NEUTRAL: 'text-neutral-300',
  },
} as const;
