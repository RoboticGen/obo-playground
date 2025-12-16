'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';

const CarPreview = dynamic(() => import('@/components/CarPreview'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="mb-4 text-7xl"></div>
        <p className="text-sm text-neutral-500">Loading 3D preview...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="relative z-50 border-b border-neutral-900 bg-black">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-black-700 p-1.5">
              <img src="/logo.ico" alt="OBO Logo" className="h-full w-full object-contain" />
            </div>
            <h1 className="font-[family-name:var(--font-red-hat-display)] text-xl font-bold tracking-tight text-white">
              OBO Playground
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="https://github.com/RoboticGen/obo-playground" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-neutral-400 transition-colors hover:text-white"
              aria-label="GitHub Repository"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
            <Link 
              href="/projects"
              className="rounded-sm bg-blue-700 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-800"
            >
              <span className="relative z-10 flex items-center gap-2">
                Login
                <svg className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <section className="relative border-b border-neutral-900 py-16 lg:py-24">
          {/* Background Image Overlay */}
          <div className="absolute inset-0 z-0 opacity-20">
            <img 
              src="/background.png" 
              alt="" 
              className="h-full w-full object-cover"
            />
          </div>
          <div className="relative z-10">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="flex flex-col justify-center">
              {/* Badge */}
              <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-sm border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-neutral-400">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-700"></span>
                Interactive Learning Platform
              </div>

              {/* Main Heading */}
              <h1 className="mb-6 font-[family-name:var(--font-red-hat-display)] text-5xl font-bold leading-tight text-white lg:text-6xl">
                Robot programming built for learning
              </h1>

              {/* Description */}
              <p className="mb-8 text-lg leading-relaxed text-neutral-400">
                OBO Playground delivers interactive 3D robot simulation and real-time Python execution to help you learn robotics and programming across any skill level.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link 
                  href="/projects"
                  className="inline-flex items-center justify-center rounded-sm bg-blue-700 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-800"
                >
                  Start building
                  <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <a 
                  href="#features"
                  className="inline-flex items-center justify-center rounded-sm border border-neutral-700 bg-transparent px-6 py-3 text-sm font-medium text-white transition-colors hover:border-neutral-600 hover:bg-neutral-900"
                >
                  Learn more
                </a>
              </div>
            </div>

            {/* Hero Image - 3D Car Preview */}
            <div className="relative flex items-center justify-center">
              <div className="relative h-[400px] w-full overflow-hidden rounded-sm border border-neutral-800 bg-gradient-to-br from-neutral-950 via-blue-950/30 to-neutral-950 lg:h-[500px]">
                <CarPreview />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-sm bg-black/80 px-4 py-2 backdrop-blur-sm">
                  <p className="text-sm font-medium text-neutral-400">
                    Interactive 3D Robot • <span className="text-blue-400">Drag to rotate</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="border-b border-neutral-900 py-16 scroll-mt-20">
          {/* Section Header */}
          <div className="mb-12">
            <h2 className="mb-4 font-[family-name:var(--font-red-hat-display)] text-4xl font-bold text-white">
              Build on a reliable foundation
            </h2>
            <p className="max-w-2xl text-lg text-neutral-400">
              Everything you need to learn robotics and programming through interactive simulation
            </p>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="group rounded-sm border border-neutral-800 bg-black p-6 transition-colors hover:border-neutral-700">
              <h3 className="mb-2 font-[family-name:var(--font-red-hat-display)] text-xl font-bold text-white">
                Interactive 3D simulation
              </h3>
              <p className="mb-4 text-sm leading-relaxed text-neutral-400">
                Control robots in real-time through a fully interactive 3D environment powered by Babylon.js with realistic physics.
              </p>
              <a href="#" className="inline-flex items-center text-sm font-medium text-blue-400 hover:text-blue-300">
                Learn more
                <svg className="ml-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>

            {/* Feature 2 */}
            <div className="group rounded-sm border border-neutral-800 bg-black p-6 transition-colors hover:border-neutral-700">
          
              <h3 className="mb-2 font-[family-name:var(--font-red-hat-display)] text-xl font-bold text-white">
                Professional code editor
              </h3>
              <p className="mb-4 text-sm leading-relaxed text-neutral-400">
                Write Python code with Monaco Editor featuring syntax highlighting, auto-completion, and error detection.
              </p>
              <a href="#" className="inline-flex items-center text-sm font-medium text-blue-400 hover:text-blue-300">
                Learn more
                <svg className="ml-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>

            {/* Feature 3 */}
            <div className="group rounded-sm border border-neutral-800 bg-black p-6 transition-colors hover:border-neutral-700">
          
              <h3 className="mb-2 font-[family-name:var(--font-red-hat-display)] text-xl font-bold text-white">
                Real-time execution
              </h3>
              <p className="mb-4 text-sm leading-relaxed text-neutral-400">
                Execute Python instantly with Pyodide. See your robot respond to commands line-by-line in real-time.
              </p>
              <a href="#" className="inline-flex items-center text-sm font-medium text-blue-400 hover:text-blue-300">
                Learn more
                <svg className="ml-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>

            {/* Feature 4 */}
            <div className="group rounded-sm border border-neutral-800 bg-black p-6 transition-colors hover:border-neutral-700">
            
              <h3 className="mb-2 font-[family-name:var(--font-red-hat-display)] text-xl font-bold text-white">
                Differential drive physics
              </h3>
              <p className="mb-4 text-sm leading-relaxed text-neutral-400">
                Control individual wheel motors for realistic robot movement. Learn real robotics concepts with accurate physics.
              </p>
              <a href="#" className="inline-flex items-center text-sm font-medium text-blue-400 hover:text-blue-300">
                Learn more
                <svg className="ml-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>

            {/* Feature 5 */}
            <div className="group rounded-sm border border-neutral-800 bg-black p-6 transition-colors hover:border-neutral-700">
            
              <h3 className="mb-2 font-[family-name:var(--font-red-hat-display)] text-xl font-bold text-white">
                Project management
              </h3>
              <p className="mb-4 text-sm leading-relaxed text-neutral-400">
                Save and organize your projects. Keep track of your progress and revisit your work anytime.
              </p>
              <a href="#" className="inline-flex items-center text-sm font-medium text-blue-400 hover:text-blue-300">
                Learn more
                <svg className="ml-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>

            {/* Feature 6 */}
            <div className="group rounded-sm border border-neutral-800 bg-black p-6 transition-colors hover:border-neutral-700">
           
              <h3 className="mb-2 font-[family-name:var(--font-red-hat-display)] text-xl font-bold text-white">
                Learn by doing
              </h3>
              <p className="mb-4 text-sm leading-relaxed text-neutral-400">
                Hands-on learning approach. Experiment with programming concepts and see immediate visual feedback.
              </p>
              <a href="#" className="inline-flex items-center text-sm font-medium text-blue-400 hover:text-blue-300">
                Learn more
                <svg className="ml-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-b border-neutral-900 py-16">
          <div className="rounded-sm border border-neutral-800 bg-neutral-950 p-12 text-center md:p-16">
            <h2 className="mb-4 font-[family-name:var(--font-red-hat-display)] text-4xl font-bold text-white md:text-5xl">
              Ready to start learning?
            </h2>
            <p className="mb-8 text-lg text-neutral-400">
              Join students worldwide learning robotics through interactive programming
            </p>
            <Link 
              href="/projects"
              className="inline-flex items-center rounded-sm bg-blue-700 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-800"
            >
              Get started
              <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-neutral-900 bg-black py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-8 grid grid-cols-2 gap-8 md:grid-cols-4">
            <div>
              <h3 className="mb-4 font-[family-name:var(--font-red-hat-display)] text-sm font-bold text-white">Platform</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-neutral-400 hover:text-white">Features</a></li>
                <li><a href="#" className="text-sm text-neutral-400 hover:text-white">Documentation</a></li>
                <li><a href="#" className="text-sm text-neutral-400 hover:text-white">Tutorials</a></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-[family-name:var(--font-red-hat-display)] text-sm font-bold text-white">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-neutral-400 hover:text-white">Learn</a></li>
                <li><a href="#" className="text-sm text-neutral-400 hover:text-white">Community</a></li>
                <li><a href="#" className="text-sm text-neutral-400 hover:text-white">Support</a></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-[family-name:var(--font-red-hat-display)] text-sm font-bold text-white">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-neutral-400 hover:text-white">About</a></li>
                <li><a href="#" className="text-sm text-neutral-400 hover:text-white">Blog</a></li>
                <li><a href="#" className="text-sm text-neutral-400 hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-[family-name:var(--font-red-hat-display)] text-sm font-bold text-white">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-neutral-400 hover:text-white">Privacy</a></li>
                <li><a href="#" className="text-sm text-neutral-400 hover:text-white">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-900 pt-8 text-center">
            <p className="text-sm text-neutral-500">
              © 2025 OBO Playground. All rights reserved.
            </p>
          </div>
        </div>
      </footer>


    </div>
  );
}
