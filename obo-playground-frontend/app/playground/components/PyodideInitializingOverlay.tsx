/**
 * Pyodide Initializing Overlay Component
 * Shows loading state while Python runtime initializes
 */

import React from 'react';
import { PLAYGROUND_CONSTANTS } from '../constants';

export default function PyodideInitializingOverlay() {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-700 border-t-transparent" />
        <p className="text-lg font-semibold text-white">
          {PLAYGROUND_CONSTANTS.MESSAGES.LOADING_PYTHON}
        </p>
        <p className="mt-2 text-sm text-neutral-400">
          {PLAYGROUND_CONSTANTS.MESSAGES.LOAD_MOMENT}
        </p>
      </div>
    </div>
  );
}
