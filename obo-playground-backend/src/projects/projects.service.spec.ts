import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
jest.mock('fs');
jest.mock('path');

// Mock typeorm without importing it
const mockRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
};

const getRepositoryToken = (entity: any) => `${entity.name}Repository`;

interface Project {
  project_id: string;
  user_id: string;
  project_name: string;
  environment_id: number;
  environment: any;
  file_path: string;
  assignment_id: any;
  created_at: Date;
  updated_at: Date;
}

describe('ProjectsService', () => {
  let service: ProjectsService;
  let repository: any;

  const mockProject: Project = {
    project_id: '123e4567-e89b-12d3-a456-426614174000',
    user_id: '123e4567-e89b-12d3-a456-426614174001',
    project_name: 'Test Project',
    environment_id: 1,
    environment: {
      environment_id: 1,
      environment_name: 'Unity 3D',
      environment_code: 'unity',
      environment_path: '/runtime/unity',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      projects: [],
    },
    file_path: 'Project_files/123e4567-e89b-12d3-a456-426614174001/test-project.py',
    assignment_id: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: 'ProjectRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    repository = mockRepository as any;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createProjectDto: CreateProjectDto = {
      user_id: '123e4567-e89b-12d3-a456-426614174001',
      project_name: 'Test Project',
      environment_id: 1,
    };

    beforeEach(() => {
      // Mock file system operations
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
      (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);
      (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
    });

    it('should create a new project successfully', async () => {
      mockRepository.create.mockReturnValue(mockProject);
      mockRepository.save.mockResolvedValue(mockProject);

      const result = await service.create(createProjectDto);

      expect(result).toEqual(mockProject);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: createProjectDto.user_id,
          project_name: createProjectDto.project_name,
          environment_id: createProjectDto.environment_id,
        }),
      );
      expect(mockRepository.save).toHaveBeenCalled();
      expect(fs.mkdirSync).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should create user directory if it does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      mockRepository.create.mockReturnValue(mockProject);
      mockRepository.save.mockResolvedValue(mockProject);

      await service.create(createProjectDto);

      expect(fs.mkdirSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ recursive: true }),
      );
    });

    it('should not create directory if it already exists', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      mockRepository.create.mockReturnValue(mockProject);
      mockRepository.save.mockResolvedValue(mockProject);

      await service.create(createProjectDto);

      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });

    it('should sanitize project name for file path', async () => {
      const dtoWithSpecialChars: CreateProjectDto = {
        ...createProjectDto,
        project_name: 'My Project! @#$ Name',
      };

      mockRepository.create.mockReturnValue(mockProject);
      mockRepository.save.mockResolvedValue(mockProject);

      await service.create(dtoWithSpecialChars);

      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException on database error', async () => {
      mockRepository.create.mockReturnValue(mockProject);
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.create(createProjectDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of projects', async () => {
      const projects = [mockProject];
      mockRepository.find.mockResolvedValue(projects);

      const result = await service.findAll();

      expect(result).toEqual(projects);
      expect(mockRepository.find).toHaveBeenCalledWith({
        order: {
          created_at: 'DESC',
        },
      });
    });

    it('should return empty array when no projects exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(mockRepository.find).toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException on database error', async () => {
      mockRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(service.findAll()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findOne', () => {
    const projectId = '123e4567-e89b-12d3-a456-426614174000';

    it('should return a project by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockProject);

      const result = await service.findOne(projectId);

      expect(result).toEqual(mockProject);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { project_id: projectId },
      });
    });

    it('should throw NotFoundException when project does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(projectId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(projectId)).rejects.toThrow(
        `Project with ID ${projectId} not found`,
      );
    });

    it('should throw InternalServerErrorException on database error', async () => {
      mockRepository.findOne.mockRejectedValue(new Error('Database error'));

      await expect(service.findOne(projectId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findByUserId', () => {
    const userId = '123e4567-e89b-12d3-a456-426614174001';

    it('should return projects for a specific user', async () => {
      const userProjects = [mockProject];
      mockRepository.find.mockResolvedValue(userProjects);

      const result = await service.findByUserId(userId);

      expect(result).toEqual(userProjects);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { user_id: userId },
        order: {
          created_at: 'DESC',
        },
      });
    });

    it('should return empty array when user has no projects', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findByUserId(userId);

      expect(result).toEqual([]);
    });

    it('should throw InternalServerErrorException on database error', async () => {
      mockRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(service.findByUserId(userId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('update', () => {
    const projectId = '123e4567-e89b-12d3-a456-426614174000';
    const updateProjectDto: UpdateProjectDto = {
      project_name: 'Updated Project Name',
    };

    it('should update a project successfully', async () => {
      const updatedProject = { ...mockProject, ...updateProjectDto };
      mockRepository.findOne.mockResolvedValue(mockProject);
      mockRepository.save.mockResolvedValue(updatedProject);

      const result = await service.update(projectId, updateProjectDto);

      expect(result).toEqual(updatedProject);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when project does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update(projectId, updateProjectDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw InternalServerErrorException on database error', async () => {
      mockRepository.findOne.mockResolvedValue(mockProject);
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.update(projectId, updateProjectDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('remove', () => {
    const projectId = '123e4567-e89b-12d3-a456-426614174000';

    beforeEach(() => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.unlinkSync as jest.Mock).mockReturnValue(undefined);
    });

    it('should delete a project successfully', async () => {
      mockRepository.findOne.mockResolvedValue(mockProject);
      mockRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      await service.remove(projectId);

      expect(mockRepository.delete).toHaveBeenCalledWith(projectId);
      expect(fs.unlinkSync).toHaveBeenCalled();
    });

    it('should throw NotFoundException when project does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(projectId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle file deletion gracefully when file does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      mockRepository.findOne.mockResolvedValue(mockProject);
      mockRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      await service.remove(projectId);

      expect(fs.unlinkSync).not.toHaveBeenCalled();
      expect(mockRepository.delete).toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException on database error', async () => {
      mockRepository.findOne.mockResolvedValue(mockProject);
      mockRepository.delete.mockRejectedValue(new Error('Database error'));

      await expect(service.remove(projectId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
