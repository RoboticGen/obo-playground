/**
 * Empty State Component
 * Displayed when no projects exist
 */

import React from 'react';
import { PROJECTS_CONSTANTS } from '../constants';

interface EmptyStateProps {
  onCreateClick: () => void;
}

export default function EmptyState({ onCreateClick }: EmptyStateProps) {
  return (
    <div className="rounded-sm border border-neutral-800 bg-neutral-950 p-20 text-center">
      <EmptyStateIcon />
      <h3 className="mb-2 font-[family-name:var(--font-red-hat-display)] text-xl font-bold text-white">
        {PROJECTS_CONSTANTS.MESSAGES.NO_PROJECTS_TITLE}
      </h3>
      <p className="mb-6 text-sm text-neutral-400">
        {PROJECTS_CONSTANTS.MESSAGES.NO_PROJECTS_DESCRIPTION}
      </p>
      <CreateButton onClick={onCreateClick} />
    </div>
  );
}

/**
 * Empty State Icon
 */
function EmptyStateIcon() {
  return (
    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-900">
      <svg
        className="h-10 w-10 text-neutral-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    </div>
  );
}

/**
 * Create Project Button
 */
function CreateButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-sm bg-blue-700 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-800"
      aria-label="Create your first project"
    >
      <PlusIcon />
      {PROJECTS_CONSTANTS.MESSAGES.CREATE_FIRST_PROJECT}
    </button>
  );
}

/**
 * Plus Icon
 */
function PlusIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}
