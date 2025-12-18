/**
 * Projects Page Constants
 * Shared constants and messages
 */

export const PROJECTS_CONSTANTS = {
  // Hardcoded user ID - replace with actual auth later
  HARDCODED_USER_ID: '123e4567-e89b-12d3-a456-426614174000',

  // Messages
  MESSAGES: {
    YOUR_PROJECTS: 'Your Projects',
    PROJECTS_DESCRIPTION: 'Create and manage your robot programming projects',
    NEW_PROJECT: 'New Project',
    CREATE_FIRST_PROJECT: 'Create Your First Project',
    NO_PROJECTS_TITLE: 'No projects yet',
    NO_PROJECTS_DESCRIPTION: 'Create your first robot programming project to get started',
    FAILED_LOAD_PROJECTS: 'Failed to load projects. Please try again.',
    FAILED_CREATE_PROJECT: 'Failed to create project. Please try again.',
    FAILED_DELETE_PROJECT: 'Failed to delete project. Please try again.',
  },

  // UI Text
  UI: {
    USER_LABEL: 'User:',
    PAGE_TITLE: 'OBO Playground',
    OBO_LOGO_ALT: 'OBO Logo',
  },
} as const;
