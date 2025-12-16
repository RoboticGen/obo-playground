/**
 * API Client Module
 * Centralized HTTP client for all backend API calls
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from './constants';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Environment configuration for robot scenes
 */
export interface Environment {
  environment_id: number;
  environment_name: string;
  environment_code: string;
  environment_path: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Project model representing a user's coding project
 */
export interface Project {
  project_id: string;
  user_id: string;
  project_name: string;
  environment_id: number;
  environment: Environment;
  file_path: string;
  assignment_id?: string;
  created_at: string;
  updated_at: string;
}

/**
 * DTO for creating a new project
 */
export interface CreateProjectDto {
  user_id: string;
  project_name: string;
  environment_id: number;
  assignment_id?: string;
}

/**
 * API response for project content
 */
export interface ProjectContentResponse {
  code: string;
  lastModified: string;
}

/**
 * API error response
 */
export interface ApiErrorResponse {
  message: string;
  statusCode: number;
  error?: string;
}

// ============================================================================
// HTTP Client Setup
// ============================================================================

/**
 * Configured Axios instance for all API requests
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

/**
 * Response interceptor for global error handling
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (!error.response) {
      console.error('Network error:', error.message);
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// Environments API
// ============================================================================

/**
 * Environment-related API operations
 */
export const environmentsApi = {
  /**
   * Fetch all active environments from the server
   * @returns Promise resolving to array of Environment objects
   * @throws AxiosError if request fails
   */
  getEnvironments: async (): Promise<Environment[]> => {
    const response = await apiClient.get<Environment[]>(API_ENDPOINTS.ENVIRONMENTS);
    return response.data;
  },
};

// ============================================================================
// Projects API
// ============================================================================

/**
 * Project-related API operations
 */
export const projectsApi = {
  /**
   * Fetch all projects belonging to a specific user
   * @param userId - UUID of the user
   * @returns Promise resolving to array of Project objects
   * @throws AxiosError if request fails
   */
  getProjectsByUserId: async (userId: string): Promise<Project[]> => {
    const response = await apiClient.get<Project[]>(API_ENDPOINTS.PROJECTS, {
      params: { userId },
    });
    return response.data;
  },

  /**
   * Create a new project
   * @param data - Project creation details
   * @returns Promise resolving to created Project object
   * @throws AxiosError if request fails
   */
  createProject: async (data: CreateProjectDto): Promise<Project> => {
    const response = await apiClient.post<Project>(API_ENDPOINTS.PROJECTS, data);
    return response.data;
  },

  /**
   * Delete an existing project
   * @param projectId - UUID of the project to delete
   * @throws AxiosError if request fails
   */
  deleteProject: async (projectId: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.PROJECT_DELETE(projectId));
  },

  /**
   * Update an existing project
   * @param projectId - UUID of the project to update
   * @param data - Partial project data to update
   * @returns Promise resolving to updated Project object
   * @throws AxiosError if request fails
   */
  updateProject: async (
    projectId: string,
    data: Partial<CreateProjectDto>
  ): Promise<Project> => {
    const response = await apiClient.patch<Project>(
      API_ENDPOINTS.PROJECT_DELETE(projectId),
      data
    );
    return response.data;
  },

  /**
   * Fetch a single project by ID
   * @param projectId - UUID of the project
   * @returns Promise resolving to Project object
   * @throws AxiosError if request fails
   */
  getProjectById: async (projectId: string): Promise<Project> => {
    const response = await apiClient.get<Project>(
      API_ENDPOINTS.PROJECT_DELETE(projectId)
    );
    return response.data;
  },

  /**
   * Fetch project code content from server
   * @param projectId - UUID of the project
   * @returns Promise resolving to ProjectContentResponse
   * @throws AxiosError if request fails
   */
  getProjectContent: async (projectId: string): Promise<ProjectContentResponse> => {
    const response = await apiClient.get<ProjectContentResponse>(
      API_ENDPOINTS.PROJECT_CONTENT(projectId)
    );
    return response.data;
  },

  /**
   * Save project code to server
   * @param projectId - UUID of the project
   * @param code - Python code to save
   * @returns Promise resolving when save completes
   * @throws AxiosError if request fails
   */
  saveProjectContent: async (projectId: string, code: string): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.PROJECT_SAVE(projectId), { code });
  },
};
