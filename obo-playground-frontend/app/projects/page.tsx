'use client';

import { useState } from 'react';
import NewProjectModal from '@/components/NewProjectForm';
import { PROJECTS_CONSTANTS } from './constants';
import { useProjects, useCreateProject, useDeleteProject } from './hooks';
import ProjectsPageHeader from './components/ProjectsPageHeader';
import SectionHeader from './components/SectionHeader';
import ErrorAlert from './components/ErrorAlert';
import LoadingSpinner from './components/LoadingSpinner';
import EmptyState from './components/EmptyState';
import ProjectsGrid from './components/ProjectsGrid';

export default function ProjectsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Data management
  const { projects, isLoading, error, setError, setProjects, refetch } = useProjects(
    PROJECTS_CONSTANTS.HARDCODED_USER_ID
  );
  const { createProject, isCreating, error: createError, setError: setCreateError } = useCreateProject(
    PROJECTS_CONSTANTS.HARDCODED_USER_ID
  );
  const { deleteProject } = useDeleteProject();

  // Event handlers
  const handleCreateProject = async (projectName: string, environmentId: number) => {
    try {
      await createProject(projectName, environmentId);
      await refetch();
      setIsModalOpen(false);
    } catch {
      // Error is handled by the hook
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId);
      setProjects(projects.filter((p) => p.project_id !== projectId));
    } catch {
      setError(PROJECTS_CONSTANTS.MESSAGES.FAILED_DELETE_PROJECT);
    }
  };

  const handleProjectClick = (project: any) => {
    window.location.href = `/playground/${project.project_id}`;
  };

  // Display error (prioritize create error)
  const displayError = createError || error;

  return (
    <div className="min-h-screen bg-black">
      <ProjectsPageHeader userId={PROJECTS_CONSTANTS.HARDCODED_USER_ID} />

      <main className="mx-auto max-w-7xl px-6 py-12">
        {/* Error Message */}
        {displayError && <ErrorAlert message={displayError} onDismiss={() => setError(null) || setCreateError(null)} />}

        {/* Section Header */}
        <SectionHeader onCreateClick={() => setIsModalOpen(true)} />

        {/* Projects Content */}
        <div>
          {isLoading ? (
            <LoadingSpinner />
          ) : projects.length === 0 ? (
            <EmptyState onCreateClick={() => setIsModalOpen(true)} />
          ) : (
            <ProjectsGrid
              projects={projects}
              onDelete={handleDeleteProject}
              onClick={handleProjectClick}
            />
          )}
        </div>
      </main>

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateProject}
        isLoading={isCreating}
      />
    </div>
  );
}
