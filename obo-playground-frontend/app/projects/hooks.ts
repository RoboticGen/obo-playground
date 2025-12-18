/**
 * Custom hooks for Projects Page
 */

import { useEffect, useState } from 'react';
import { projectsApi, Project } from '@/lib/api';
import { PROJECTS_CONSTANTS } from './constants';

/**
 * Hook for fetching and managing projects
 */
export function useProjects(userId: string) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await projectsApi.getProjectsByUserId(userId);
      setProjects(data);
    } catch (err) {
      setError(PROJECTS_CONSTANTS.MESSAGES.FAILED_LOAD_PROJECTS);
      console.error('Error fetching projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [userId]);

  return { projects, isLoading, error, setError, setProjects, refetch: fetchProjects };
}

/**
 * Hook for creating projects
 */
export function useCreateProject(userId: string) {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProject = async (projectName: string, environmentId: number) => {
    try {
      setIsCreating(true);
      setError(null);
      const newProject = await projectsApi.createProject({
        user_id: userId,
        project_name: projectName,
        environment_id: environmentId,
      });
      return newProject;
    } catch (err) {
      setError(PROJECTS_CONSTANTS.MESSAGES.FAILED_CREATE_PROJECT);
      console.error('Error creating project:', err);
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  return { createProject, isCreating, error, setError };
}

/**
 * Hook for deleting projects
 */
export function useDeleteProject() {
  const deleteProject = async (projectId: string) => {
    try {
      await projectsApi.deleteProject(projectId);
    } catch (err) {
      console.error('Error deleting project:', err);
      throw new Error(PROJECTS_CONSTANTS.MESSAGES.FAILED_DELETE_PROJECT);
    }
  };

  return { deleteProject };
}
