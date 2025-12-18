/**
 * Projects Page Header Component
 * Displays logo, title, and user information
 */

import React from 'react';
import { PROJECTS_CONSTANTS } from '../constants';

interface ProjectsPageHeaderProps {
  userId: string;
}

export default function ProjectsPageHeader({ userId }: ProjectsPageHeaderProps) {
  const userIdDisplay = userId.split('-')[0];

  return (
    <header className="border-b border-neutral-900 bg-black">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <LogoSection />
        <UserInfo userIdDisplay={userIdDisplay} />
      </div>
    </header>
  );
}

/**
 * Logo and Title Section
 */
function LogoSection() {
  return (
    <a href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
      <div className="flex h-10 w-10 items-center justify-center rounded bg-black-700 p-1.5">
        <img
          src="/logo.ico"
          alt={PROJECTS_CONSTANTS.UI.OBO_LOGO_ALT}
          className="h-full w-full object-contain"
        />
      </div>
      <h1 className="font-[family-name:var(--font-red-hat-display)] text-xl font-bold tracking-tight text-white">
        {PROJECTS_CONSTANTS.UI.PAGE_TITLE}
      </h1>
    </a>
  );
}

/**
 * User Information Display
 */
function UserInfo({ userIdDisplay }: { userIdDisplay: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-neutral-400">
        <span className="hidden sm:inline">{PROJECTS_CONSTANTS.UI.USER_LABEL} </span>
        <code className="rounded bg-neutral-900 px-2 py-1 text-xs text-neutral-300">
          {userIdDisplay}...
        </code>
      </span>
    </div>
  );
}
