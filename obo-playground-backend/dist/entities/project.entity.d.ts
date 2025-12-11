import { Environment } from './environment.entity';
export declare class Project {
    project_id: string;
    user_id: string;
    project_name: string;
    environment_id: number;
    environment: Environment;
    file_path: string;
    assignment_id: string;
    created_at: Date;
    updated_at: Date;
}
