/**
 * CTA Section Component
 * Call-to-action section encouraging user signup
 */

import React from 'react';
import Link from 'next/link';
import { HOME_CONSTANTS } from '../constants';

export default function CTASection() {
  return (
    <section className="border-b border-neutral-900 py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="rounded-sm border border-neutral-800 bg-neutral-950 p-12 text-center md:p-16">
          <h2 className="mb-4 font-[family-name:var(--font-red-hat-display)] text-4xl font-bold text-white md:text-5xl">
            {HOME_CONSTANTS.CTA.HEADING}
          </h2>
          <p className="mb-8 text-lg text-neutral-400">{HOME_CONSTANTS.CTA.DESCRIPTION}</p>
          <CTAButton />
        </div>
      </div>
    </section>
  );
}

/**
 * CTA Button
 */
function CTAButton() {
  return (
    <Link
      href="/projects"
      className="inline-flex items-center rounded-sm bg-blue-700 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-800"
    >
      {HOME_CONSTANTS.CTA.BUTTON}
      <svg
        className="ml-2 h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
