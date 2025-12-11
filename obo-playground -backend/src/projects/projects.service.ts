import { Injectable, NotFoundException, BadRequestException, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);
  private readonly projectFilesDir = path.join(process.cwd(), 'Project_files');

  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    try {
      this.logger.log(`Creating new project for user: ${createProjectDto.user_id}`);
      
      // Generate file path: Project_files/[user_id]/[project_name].py
      const sanitizedProjectName = createProjectDto.project_name
        .replace(/[^a-zA-Z0-9-_\s]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase();
      const userDir = path.join(this.projectFilesDir, createProjectDto.user_id);
      const fileName = `${sanitizedProjectName}.py`;
      const filePath = path.join('Project_files', createProjectDto.user_id, fileName);
      const fullFilePath = path.join(this.projectFilesDir, createProjectDto.user_id, fileName);
      
      // Create user directory if it doesn't exist
      if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
        this.logger.log(`Created user directory: ${userDir}`);
      }
      
      // Create Python file with template content
      const pythonTemplate = `# ${createProjectDto.project_name}
# 3D Environment ID: ${createProjectDto.environment_id}
# Created: ${new Date().toISOString()}

def main():
    """Main function for ${createProjectDto.project_name}"""
    print("Starting ${createProjectDto.project_name}")
    # Add your 3D simulation code here

if __name__ == "__main__":
    main()
`;
      
      fs.writeFileSync(fullFilePath, pythonTemplate, 'utf8');
      this.logger.log(`Created Python file: ${fullFilePath}`);
      
      // Save project to database
      const project = this.projectRepository.create({
        ...createProjectDto,
        file_path: filePath,
      });
      const savedProject = await this.projectRepository.save(project);
      this.logger.log(`Project created successfully: ${savedProject.project_id}`);
      return savedProject;
    } catch (error) {
      this.logger.error(
        `Failed to create project: ${error.message}`,
        error.stack,
      );
      if (error.code === '23505') {
        throw new BadRequestException('A project with this information already exists');
      }
      throw new InternalServerErrorException('Failed to create project. Please try again.');
    }
  }

  async findAll(): Promise<Project[]> {
    try {
      this.logger.log('Fetching all projects');
      const projects = await this.projectRepository.find({
        order: {
          created_at: 'DESC',
        },
      });
      this.logger.log(`Found ${projects.length} projects`);
      return projects;
    } catch (error) {
      this.logger.error(
        `Failed to fetch projects: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to fetch projects');
    }
  }

  async findOne(id: string): Promise<Project> {
    try {
      this.logger.log(`Fetching project with ID: ${id}`);
      const project = await this.projectRepository.findOne({
        where: { project_id: id },
      });

      if (!project) {
        this.logger.warn(`Project not found with ID: ${id}`);
        throw new NotFoundException(`Project with ID ${id} not found`);
      }

      return project;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to fetch project ${id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to fetch project');
    }
  }

  async findByUserId(userId: string): Promise<Project[]> {
    try {
      this.logger.log(`Fetching projects for user: ${userId}`);
      const projects = await this.projectRepository.find({
        where: { user_id: userId },
        order: {
          created_at: 'DESC',
        },
      });
      this.logger.log(`Found ${projects.length} projects for user ${userId}`);
      return projects;
    } catch (error) {
      this.logger.error(
        `Failed to fetch projects for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to fetch user projects');
    }
  }

  async update(id: string, updateProjectDto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id);

    this.logger.log(`Updating project: ${id}`);
    Object.assign(project, updateProjectDto);

    try {
      const updatedProject = await this.projectRepository.save(project);
      this.logger.log(`Project updated successfully: ${id}`);
      return updatedProject;
    } catch (error) {
      this.logger.error(
        `Failed to update project ${id}: ${error.message}`,
        error.stack,
      );
      if (error.code === '23505') {
        throw new BadRequestException('A project with this information already exists');
      }
      throw new InternalServerErrorException('Failed to update project. Please try again.');
    }
  }

  async remove(id: string): Promise<void> {
    const project = await this.findOne(id);
    
    try {
      this.logger.log(`Deleting project: ${id}`);
      await this.projectRepository.remove(project);
      this.logger.log(`Project deleted successfully: ${id}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete project ${id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to delete project');
    }
  }
}
