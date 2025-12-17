/**
 * Save Status Indicator Component
 * Displays auto-save status with visual feedback
 */

import React from 'react';

interface SaveStatusIndicatorProps {
  lastSaved: Date | null;
}

export default function SaveStatusIndicator({ lastSaved }: SaveStatusIndicatorProps) {
  return (
    <div className="flex items-center gap-2 text-xs text-neutral-400">
      {lastSaved ? (
        <>
          <CheckmarkIcon />
          <span>Saved {lastSaved.toLocaleTimeString()}</span>
        </>
      ) : (
        <>
          <DownloadIcon />
          <span>Auto-save enabled</span>
        </>
      )}
    </div>
  );
}

/**
 * Checkmark Icon
 */
function CheckmarkIcon() {
  return (
    <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );
}

/**
 * Download Icon
 */
function DownloadIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
    </svg>
  );
}
