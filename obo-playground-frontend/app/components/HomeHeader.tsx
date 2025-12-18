/**
 * Home Page Header Component
 * Top navigation bar with logo and CTA buttons
 */

import React from 'react';
import Link from 'next/link';
import { HOME_CONSTANTS } from '../constants';

export default function HomeHeader() {
  return (
    <header className="relative z-50 border-b border-neutral-900 bg-black">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <LogoSection />
        <NavControls />
      </div>
    </header>
  );
}

/**
 * Logo and Title Section
 */
function LogoSection() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded bg-black-700 p-1.5">
        <img
          src="/logo.ico"
          alt={HOME_CONSTANTS.LOGO_ALT}
          className="h-full w-full object-contain"
        />
      </div>
      <h1 className="font-[family-name:var(--font-red-hat-display)] text-xl font-bold tracking-tight text-white">
        {HOME_CONSTANTS.TITLE}
      </h1>
    </div>
  );
}

/**
 * Navigation Controls (GitHub and Login)
 */
function NavControls() {
  return (
    <div className="flex items-center gap-4">
      <GitHubLink />
      <LoginButton />
    </div>
  );
}

/**
 * GitHub Link Button
 */
function GitHubLink() {
  return (
    <a
      href={HOME_CONSTANTS.GITHUB_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="text-neutral-400 transition-colors hover:text-white"
      aria-label="GitHub Repository"
    >
      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
      </svg>
    </a>
  );
}

/**
 * Login Button
 */
function LoginButton() {
  return (
    <Link
      href="/projects"
      className="rounded-sm bg-blue-700 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-800"
    >
      <span className="relative z-10 flex items-center gap-2">
        {HOME_CONSTANTS.HERO.LOGIN}
        <svg
          className="h-5 w-5 transition-transform duration-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </span>
    </Link>
  );
}
