/**
 * Loading Spinner Component
 * Displayed while projects are loading
 */

import React from 'react';

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-32">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-800 border-t-blue-700" />
    </div>
  );
}
