'use client';

import { useEffect, useState } from 'react';
import { projectsApi, Project } from '@/lib/api';
import ProjectCard from '@/components/ProjectCard';
import NewProjectModal from '@/components/NewProjectForm';

// Hardcoded user ID (UUID format) - replace this later with actual auth
const HARDCODED_USER_ID = '123e4567-e89b-12d3-a456-426614174000';

export default function ProjectsPage() {
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
    // Navigate to playground
    window.location.href = `/playground/${project.project_id}`;
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-neutral-900 bg-black">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <a href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-black-700 p-1.5">
              <img src="/logo.ico" alt="OBO Logo" className="h-full w-full object-contain" />
            </div>
            <h1 className="font-[family-name:var(--font-red-hat-display)] text-xl font-bold tracking-tight text-white">
              OBO Playground
            </h1>
          </a>
          <div className="flex items-center gap-4">
            <span className="text-sm text-neutral-400">
              <span className="hidden sm:inline">User: </span>
              <code className="rounded bg-neutral-900 px-2 py-1 text-xs text-neutral-300">
                {HARDCODED_USER_ID.split('-')[0]}...
              </code>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-12">
        {/* Error Message */}
        {error && (
          <div className="mb-8 flex items-center gap-3 rounded-sm border border-red-900/50 bg-red-950/20 p-4 text-red-400">
            <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {/* Section Header with Create Button */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-red-hat-display)] text-2xl font-bold text-white">
              Your Projects
            </h2>
            <p className="mt-1 text-sm text-neutral-400">
              Create and manage your robot programming projects
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-sm bg-blue-700 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-800"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </button>
        </div>

        {/* Projects Grid */}
        <div>

          {isLoading ? (
            <div className="flex items-center justify-center py-32">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-800 border-t-blue-700"></div>
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-sm border border-neutral-800 bg-neutral-950 p-20 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-900">
                <svg
                  className="h-10 w-10 text-neutral-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 font-[family-name:var(--font-red-hat-display)] text-xl font-bold text-white">
                No projects yet
              </h3>
              <p className="mb-6 text-sm text-neutral-400">
                Create your first robot programming project to get started
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-sm bg-blue-700 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-800"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Create Your First Project
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
