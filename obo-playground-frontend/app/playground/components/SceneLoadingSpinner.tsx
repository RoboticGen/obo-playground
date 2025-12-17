/**
 * Scene Loading Spinner Component
 * Shows loading state while 3D engine initializes
 */

import React from 'react';
import { PLAYGROUND_CONSTANTS } from '../constants';

export default function SceneLoadingSpinner() {
  return (
    <div className="flex h-full items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
        <p className="text-lg text-white">{PLAYGROUND_CONSTANTS.MESSAGES.LOADING_3D_ENGINE}</p>
      </div>
    </div>
  );
}
