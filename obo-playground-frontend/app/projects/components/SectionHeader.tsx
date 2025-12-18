/**
 * Section Header with Create Button Component
 * Displays page section header and action button
 */

import React from 'react';
import { PROJECTS_CONSTANTS } from '../constants';

interface SectionHeaderProps {
  onCreateClick: () => void;
}

export default function SectionHeader({ onCreateClick }: SectionHeaderProps) {
  return (
    <div className="mb-8 flex items-center justify-between">
      <SectionTitle />
      <CreateButton onClick={onCreateClick} />
    </div>
  );
}

/**
 * Section Title and Description
 */
function SectionTitle() {
  return (
    <div>
      <h2 className="font-[family-name:var(--font-red-hat-display)] text-2xl font-bold text-white">
        {PROJECTS_CONSTANTS.MESSAGES.YOUR_PROJECTS}
      </h2>
      <p className="mt-1 text-sm text-neutral-400">
        {PROJECTS_CONSTANTS.MESSAGES.PROJECTS_DESCRIPTION}
      </p>
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
      aria-label="Create new project"
    >
      <PlusIcon />
      {PROJECTS_CONSTANTS.MESSAGES.NEW_PROJECT}
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
