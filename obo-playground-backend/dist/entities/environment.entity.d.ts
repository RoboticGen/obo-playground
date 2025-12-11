import { Project } from './project.entity';
export declare class Environment {
    environment_id: number;
    environment_name: string;
    environment_code: string;
    environment_path: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    projects: Project[];
}
