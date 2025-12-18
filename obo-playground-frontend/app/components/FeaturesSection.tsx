/**
 * Features Section Component
 * Displays feature cards grid
 */

import React from 'react';
import { HOME_CONSTANTS } from '../constants';

export default function FeaturesSection() {
  return (
    <section id="features" className="border-b border-neutral-900 py-16 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeader />
        <FeatureGrid />
      </div>
    </section>
  );
}

/**
 * Section Header
 */
function SectionHeader() {
  return (
    <div className="mb-12">
      <h2 className="mb-4 font-[family-name:var(--font-red-hat-display)] text-4xl font-bold text-white">
        {HOME_CONSTANTS.FEATURES.SECTION_TITLE}
      </h2>
      <p className="max-w-2xl text-lg text-neutral-400">
        {HOME_CONSTANTS.FEATURES.SECTION_DESCRIPTION}
      </p>
    </div>
  );
}

/**
 * Features Grid
 */
function FeatureGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {HOME_CONSTANTS.FEATURES.ITEMS.map((feature, index) => (
        <FeatureCard key={index} title={feature.title} description={feature.description} />
      ))}
    </div>
  );
}

/**
 * Feature Card Component
 */
interface FeatureCardProps {
  title: string;
  description: string;
}

function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <div className="group rounded-sm border border-neutral-800 bg-black p-6 transition-colors hover:border-neutral-700">
      <h3 className="mb-2 font-[family-name:var(--font-red-hat-display)] text-xl font-bold text-white">
        {title}
      </h3>
      <p className="mb-4 text-sm leading-relaxed text-neutral-400">{description}</p>
      <LearnMoreLink />
    </div>
  );
}

/**
 * Learn More Link
 */
function LearnMoreLink() {
  return (
    <a href="#" className="inline-flex items-center text-sm font-medium text-blue-400 hover:text-blue-300">
      Learn more
      <svg
        className="ml-1 h-3 w-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </a>
  );
}
