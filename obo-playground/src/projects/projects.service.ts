import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    try {
      const project = this.projectRepository.create(createProjectDto);
      return await this.projectRepository.save(project);
    } catch (error) {
      throw new BadRequestException('Failed to create project');
    }
  }

  async findAll(): Promise<Project[]> {
    return await this.projectRepository.find({
      order: {
        created_at: 'DESC',
      },
    });
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { project_id: id },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
  }

  async findByUserId(userId: string): Promise<Project[]> {
    return await this.projectRepository.find({
      where: { user_id: userId },
      order: {
        created_at: 'DESC',
      },
    });
  }

  async update(id: string, updateProjectDto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id);

    Object.assign(project, updateProjectDto);

    try {
      return await this.projectRepository.save(project);
    } catch (error) {
      throw new BadRequestException('Failed to update project');
    }
  }

  async remove(id: string): Promise<void> {
    const project = await this.findOne(id);
    await this.projectRepository.remove(project);
  }
}
