export interface SceneObstacle {
  type: 'box' | 'sphere' | 'cylinder' | 'wall';
  position: [number, number, number];
  size: [number, number, number];
  color?: string;
  rotation?: [number, number, number];
}

export interface SceneConfig {
  modelUrl?: string;
  groundTexture?: string;
  groundColor?: string;
  obstacles?: SceneObstacle[];
  lighting?: {
    ambient?: string;
    directional?: {
      direction: [number, number, number];
      intensity: number;
    };
  };
  camera?: {
    alpha?: number;
    beta?: number;
    radius?: number;
    target?: [number, number, number];
  };
}

export interface Environment {
  environment_id: number;
  environment_name: string;
  environment_code: string;
  description: string;
  thumbnail: string;
  environment_path: string;
  scene_config: SceneConfig;
  difficulty: string;
  tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function getEnvironments(): Promise<Environment[]> {
  const response = await fetch(`${API_URL}/environments`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch environments');
  }

  return response.json();
}

export async function getEnvironment(id: number): Promise<Environment> {
  const response = await fetch(`${API_URL}/environments/${id}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch environment ${id}`);
  }

  return response.json();
}

export async function getEnvironmentByCode(code: string): Promise<Environment> {
  const response = await fetch(`${API_URL}/environments/code/${code}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch environment ${code}`);
  }

  return response.json();
}

export async function seedDefaultEnvironments(): Promise<void> {
  const response = await fetch(`${API_URL}/environments/seed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to seed environments');
  }
}
