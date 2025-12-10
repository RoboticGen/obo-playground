import { Injectable, NotFoundException, BadRequestException, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    try {
      this.logger.log(`Creating new project for user: ${createProjectDto.user_id}`);
      const project = this.projectRepository.create(createProjectDto);
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
