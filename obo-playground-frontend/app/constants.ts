/**
 * Home Page Constants
 * Shared constants and messages for the landing page
 */

export const HOME_CONSTANTS = {
  // Page metadata
  TITLE: 'OBO Playground',
  LOGO_ALT: 'OBO Logo',
  GITHUB_URL: 'https://github.com/RoboticGen/obo-playground',

  // Hero Section
  HERO: {
    BADGE: 'Interactive Learning Platform',
    HEADING: 'Robot programming built for learning',
    DESCRIPTION:
      'OBO Playground delivers interactive 3D robot simulation and real-time Python execution to help you learn robotics and programming across any skill level.',
    CTA_PRIMARY: 'Start building',
    CTA_SECONDARY: 'Learn more',
    CAR_PREVIEW_TEXT: 'Interactive 3D Robot • Drag to rotate',
    LOGIN: 'Login',
  },

  // Features Section
  FEATURES: {
    SECTION_TITLE: 'Build on a reliable foundation',
    SECTION_DESCRIPTION:
      'Everything you need to learn robotics and programming through interactive simulation',
    ITEMS: [
      {
        title: 'Interactive 3D simulation',
        description:
          'Control robots in real-time through a fully interactive 3D environment powered by Babylon.js with realistic physics.',
      },
      {
        title: 'Professional code editor',
        description:
          'Write Python code with Monaco Editor featuring syntax highlighting, auto-completion, and error detection.',
      },
      {
        title: 'Real-time execution',
        description:
          'Execute Python instantly with Pyodide. See your robot respond to commands line-by-line in real-time.',
      },
      {
        title: 'Differential drive physics',
        description:
          'Control individual wheel motors for realistic robot movement. Learn real robotics concepts with accurate physics.',
      },
      {
        title: 'Project management',
        description:
          'Save and organize your projects. Keep track of your progress and revisit your work anytime.',
      },
      {
        title: 'Learn by doing',
        description:
          'Hands-on learning approach. Experiment with programming concepts and see immediate visual feedback.',
      },
    ],
  },

  // CTA Section
  CTA: {
    HEADING: 'Ready to start learning?',
    DESCRIPTION: 'Join students worldwide learning robotics through interactive programming',
    BUTTON: 'Get started',
  },

  // Footer
  FOOTER: {
    COPYRIGHT: '© 2025 OBO Playground. All rights reserved.',
    SECTIONS: {
      PLATFORM: {
        title: 'Platform',
        links: [
          { label: 'Features', href: '#' },
          { label: 'Documentation', href: '#' },
          { label: 'Tutorials', href: '#' },
        ],
      },
      RESOURCES: {
        title: 'Resources',
        links: [
          { label: 'Learn', href: '#' },
          { label: 'Community', href: '#' },
          { label: 'Support', href: '#' },
        ],
      },
      COMPANY: {
        title: 'Company',
        links: [
          { label: 'About', href: '#' },
          { label: 'Blog', href: '#' },
          { label: 'Contact', href: '#' },
        ],
      },
      LEGAL: {
        title: 'Legal',
        links: [
          { label: 'Privacy', href: '#' },
          { label: 'Terms', href: '#' },
        ],
      },
    },
  },
} as const;
