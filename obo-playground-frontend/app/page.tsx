'use client';

import { useEffect, useState } from 'react';
import { projectsApi, Project } from '@/lib/api';
import ProjectCard from '@/components/ProjectCard';
import NewProjectModal from '@/components/NewProjectForm';

// Hardcoded user ID (UUID format) - replace this later with actual auth
const HARDCODED_USER_ID = '123e4567-e89b-12d3-a456-426614174000';

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch projects on component mount
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await projectsApi.getProjectsByUserId(HARDCODED_USER_ID);
      setProjects(data);
    } catch (err) {
      setError('Failed to load projects. Please try again.');
      console.error('Error fetching projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async (projectName: string, environmentId: number) => {
    try {
      setIsCreating(true);
      setError(null);
      const newProject = await projectsApi.createProject({
        user_id: HARDCODED_USER_ID,
        project_name: projectName,
        environment_id: environmentId,
      });
      //setProjects([newProject, ...projects]);
      await fetchProjects();
      setIsModalOpen(false);
    } catch (err) {
      setError('Failed to create project. Please try again.');
      console.error('Error creating project:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await projectsApi.deleteProject(projectId);
      setProjects(projects.filter((p) => p.project_id !== projectId));
    } catch (err) {
      setError('Failed to delete project. Please try again.');
      console.error('Error deleting project:', err);
    }
  };

  const handleProjectClick = (project: Project) => {
    console.log('Opening project:', project);
    // TODO: Navigate to project editor
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <svg className="h-8 w-8 text-blue-600 dark:text-blue-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
            </svg>
            <h1 className="text-xl font-medium text-zinc-900 dark:text-zinc-50">
              OBO Playground
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-500">
              <span className="hidden sm:inline">User: </span>
              <code className="rounded bg-zinc-100 px-2 py-1 text-xs dark:bg-zinc-800">
                {HARDCODED_USER_ID.split('-')[0]}...
              </code>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-400">
            <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {/* Section Header */}
        <div className="mb-6">
          <h2 className="text-base font-medium text-zinc-700 dark:text-zinc-300">
            Start a new project
          </h2>
        </div>

        {/* New Project Template */}
        <div className="mb-12">
          <button
            onClick={() => setIsModalOpen(true)}
            className="group flex w-48 flex-col items-center transition-transform hover:scale-105"
          >
            <div className="flex h-48 w-full items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-white transition-colors group-hover:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:group-hover:border-blue-600">
              <svg className="h-16 w-16 text-zinc-400 group-hover:text-blue-600 dark:text-zinc-600 dark:group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="mt-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Blank
            </span>
          </button>
        </div>

        {/* Recent Projects */}
        <div>
          <h2 className="mb-4 text-base font-medium text-zinc-700 dark:text-zinc-300">
            Recent projects
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-500"></div>
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-lg border border-zinc-200 bg-white p-16 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <svg
                className="mx-auto h-16 w-16 text-zinc-300 dark:text-zinc-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-zinc-900 dark:text-zinc-50">
                No projects yet
              </h3>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                Create your first project to get started
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {projects.map((project) => (
                <ProjectCard
                  key={project.project_id}
                  project={project}
                  onDelete={handleDeleteProject}
                  onClick={() => handleProjectClick(project)}
                />
              ))}
            </div>
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
