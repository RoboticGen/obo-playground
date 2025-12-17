/**
 * Home Hero Section Component
 * Main landing section with heading and 3D car preview
 */

import React, { Suspense } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { HOME_CONSTANTS } from '../constants';

const CarPreview = dynamic(() => import('@/components/CarPreview'), {
  ssr: false,
  loading: () => <CarPreviewLoading />,
});

export default function HeroSection() {
  return (
    <section className="relative border-b border-neutral-900 py-16 lg:py-24">
      <BackgroundOverlay />
      <div className="relative z-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <HeroContent />
            <HeroImage />
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Background Overlay Image
 */
function BackgroundOverlay() {
  return (
    <div className="absolute inset-0 z-0 opacity-20">
      <img src="/background.png" alt="" className="h-full w-full object-cover" />
    </div>
  );
}

/**
 * Hero Content (Text and CTAs)
 */
function HeroContent() {
  return (
    <div className="flex flex-col justify-center">
      <Badge />
      <Heading />
      <Description />
      <CTAButtons />
    </div>
  );
}

/**
 * Badge Component
 */
function Badge() {
  return (
    <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-sm border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-neutral-400">
      <span className="h-1.5 w-1.5 rounded-full bg-blue-700" />
      {HOME_CONSTANTS.HERO.BADGE}
    </div>
  );
}

/**
 * Main Heading
 */
function Heading() {
  return (
    <h1 className="mb-6 font-[family-name:var(--font-red-hat-display)] text-5xl font-bold leading-tight text-white lg:text-6xl">
      {HOME_CONSTANTS.HERO.HEADING}
    </h1>
  );
}

/**
 * Hero Description
 */
function Description() {
  return (
    <p className="mb-8 text-lg leading-relaxed text-neutral-400">
      {HOME_CONSTANTS.HERO.DESCRIPTION}
    </p>
  );
}

/**
 * CTA Buttons
 */
function CTAButtons() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <PrimaryButton />
      <SecondaryButton />
    </div>
  );
}

/**
 * Primary CTA Button
 */
function PrimaryButton() {
  return (
    <Link
      href="/projects"
      className="inline-flex items-center justify-center rounded-sm bg-blue-700 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-800"
    >
      {HOME_CONSTANTS.HERO.CTA_PRIMARY}
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

/**
 * Secondary CTA Button
 */
function SecondaryButton() {
  return (
    <a
      href="#features"
      className="inline-flex items-center justify-center rounded-sm border border-neutral-700 bg-transparent px-6 py-3 text-sm font-medium text-white transition-colors hover:border-neutral-600 hover:bg-neutral-900"
    >
      {HOME_CONSTANTS.HERO.CTA_SECONDARY}
    </a>
  );
}

/**
 * Hero Image with 3D Car Preview
 */
function HeroImage() {
  return (
    <div className="relative flex items-center justify-center">
      <div className="relative h-[400px] w-full overflow-hidden rounded-sm border border-neutral-800 bg-gradient-to-br from-neutral-950 via-blue-950/30 to-neutral-950 lg:h-[500px]">
        <Suspense fallback={<CarPreviewLoading />}>
          <CarPreview />
        </Suspense>
        <CarPreviewLabel />
      </div>
    </div>
  );
}

/**
 * Car Preview Loading State
 */
function CarPreviewLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="mb-4 text-7xl" />
        <p className="text-sm text-neutral-500">Loading 3D preview...</p>
      </div>
    </div>
  );
}

/**
 * Car Preview Label
 */
function CarPreviewLabel() {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-sm bg-black/80 px-4 py-2 backdrop-blur-sm">
      <p className="text-sm font-medium text-neutral-400">
        {HOME_CONSTANTS.HERO.CAR_PREVIEW_TEXT.split('•')[0]}
        <span className="text-blue-400"> • {HOME_CONSTANTS.HERO.CAR_PREVIEW_TEXT.split('•')[1]}</span>
      </p>
    </div>
  );
}
