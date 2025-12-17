/**
 * Resizable Divider Component
 * Allows resizing of split panels
 */

import React from 'react';

interface ResizableDividerProps {
  onMouseDown: () => void;
}

export default function ResizableDivider({ onMouseDown }: ResizableDividerProps) {
  return (
    <div
      onMouseDown={onMouseDown}
      className="group relative w-1 cursor-col-resize bg-neutral-900 transition-colors hover:bg-blue-700"
      role="separator"
      aria-label="Resize panel divider"
    >
      <div className="absolute inset-y-0 -left-1 -right-1" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-neutral-700 px-0.5 py-4 opacity-0 transition-opacity group-hover:opacity-100">
        <svg
          className="h-4 w-2 text-white"
          fill="currentColor"
          viewBox="0 0 8 16"
          aria-hidden="true"
        >
          <circle cx="2" cy="4" r="1" />
          <circle cx="6" cy="4" r="1" />
          <circle cx="2" cy="8" r="1" />
          <circle cx="6" cy="8" r="1" />
          <circle cx="2" cy="12" r="1" />
          <circle cx="6" cy="12" r="1" />
        </svg>
      </div>
    </div>
  );
}
