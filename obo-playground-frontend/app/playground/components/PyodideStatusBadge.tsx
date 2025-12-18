/**
 * Pyodide Status Badge Component
 * Shows Python runtime initialization status
 */

import React from 'react';
import { PLAYGROUND_CONSTANTS } from '../constants';

export default function PyodideStatusBadge() {
  return (
    <div className="flex items-center gap-2 rounded-sm border border-yellow-900/50 bg-yellow-950/20 px-3 py-2 text-sm text-yellow-400">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent" />
      {PLAYGROUND_CONSTANTS.MESSAGES.PYTHON_INITIALIZING}
    </div>
  );
}
