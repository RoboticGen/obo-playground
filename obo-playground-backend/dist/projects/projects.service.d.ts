import { Repository } from 'typeorm';
import { Project } from '../entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
export declare class ProjectsService {
    private readonly projectRepository;
    private readonly logger;
    private readonly projectFilesDir;
    constructor(projectRepository: Repository<Project>);
    create(createProjectDto: CreateProjectDto): Promise<Project>;
    findAll(): Promise<Project[]>;
    findOne(id: string): Promise<Project>;
    findByUserId(userId: string): Promise<Project[]>;
    update(id: string, updateProjectDto: UpdateProjectDto): Promise<Project>;
    remove(id: string): Promise<void>;
    updateFileContent(id: string, code: string): Promise<{
        message: string;
        lastModified: Date;
    }>;
    getFileContent(id: string): Promise<{
        code: string;
        lastModified: Date;
    }>;
}
