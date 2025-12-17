'use client';

import HomeHeader from './components/HomeHeader';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import CTASection from './components/CTASection';
import HomeFooter from './components/HomeFooter';

export default function Home() {
  return (
    <div className="min-h-screen bg-black">
      <HomeHeader />
      <main className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <HeroSection />
        <FeaturesSection />
        <CTASection />
      </main>
      <HomeFooter />
    </div>
  );
}
