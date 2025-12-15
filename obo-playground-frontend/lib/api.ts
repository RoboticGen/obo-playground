import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Environment {
  environment_id: number;
  environment_name: string;
  environment_code: string;
  environment_path: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

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

export interface CreateProjectDto {
  user_id: string;
  project_name: string;
  environment_id: number;
  assignment_id?: string;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const environmentsApi = {
  // Get all active environments
  getEnvironments: async (): Promise<Environment[]> => {
    const response = await api.get('/environments');
    return response.data;
  },
};

export const projectsApi = {
  // Get all projects for a user
  getProjectsByUserId: async (userId: string): Promise<Project[]> => {
    const response = await api.get(`/projects?userId=${userId}`);
    return response.data;
  },

  // Create a new project
  createProject: async (data: CreateProjectDto): Promise<Project> => {
    const response = await api.post('/projects', data);
    return response.data;
  },

  // Delete a project
  deleteProject: async (projectId: string): Promise<void> => {
    await api.delete(`/projects/${projectId}`);
  },

  // Update a project
  updateProject: async (projectId: string, data: Partial<CreateProjectDto>): Promise<Project> => {
    const response = await api.patch(`/projects/${projectId}`, data);
    return response.data;
  },

  // Get a single project by ID
  getProjectById: async (projectId: string): Promise<Project> => {
    const response = await api.get(`/projects/${projectId}`);
    return response.data;
  },
};
