/**
 * Project Loading Spinner Component
 * Shows loading state while project data loads
 */

import React from 'react';
import { PLAYGROUND_CONSTANTS } from '../constants';

export default function ProjectLoadingSpinner() {
  return (
    <div className="flex h-screen items-center justify-center bg-black">
      <div className="text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-700 border-t-transparent" />
        <p className="text-lg font-semibold text-white">
          {PLAYGROUND_CONSTANTS.MESSAGES.LOADING_PROJECT}
        </p>
      </div>
    </div>
  );
}
