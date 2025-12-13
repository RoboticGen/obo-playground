import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project } from '../entities/project.entity';

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let service: ProjectsService;

  const mockProject = {
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
    assignment_id: null as any,
    created_at: new Date(),
    updated_at: new Date(),
  } as Project;

  const mockProjectsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByUserId: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        {
          provide: ProjectsService,
          useValue: mockProjectsService,
        },
      ],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
    service = module.get<ProjectsService>(ProjectsService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new project', async () => {
      const createProjectDto: CreateProjectDto = {
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        project_name: 'Test Project',
        environment_id: 1,
      };

      mockProjectsService.create.mockResolvedValue(mockProject);

      const result = await controller.create(createProjectDto);

      expect(result).toEqual(mockProject);
      expect(service.create).toHaveBeenCalledWith(createProjectDto);
      expect(service.create).toHaveBeenCalledTimes(1);
    });

    it('should handle create with assignment_id', async () => {
      const createProjectDto: CreateProjectDto = {
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        project_name: 'Test Project',
        environment_id: 1,
        assignment_id: 'assignment-001',
      };

      const projectWithAssignment = { ...mockProject, assignment_id: 'assignment-001' };
      mockProjectsService.create.mockResolvedValue(projectWithAssignment);

      const result = await controller.create(createProjectDto);

      expect(result).toEqual(projectWithAssignment);
      expect(service.create).toHaveBeenCalledWith(createProjectDto);
    });
  });

  describe('findAll', () => {
    it('should return all projects when no userId provided', async () => {
      const projects = [mockProject];
      mockProjectsService.findAll.mockResolvedValue(projects);

      const result = await controller.findAll();

      expect(result).toEqual(projects);
      expect(service.findAll).toHaveBeenCalledTimes(1);
      expect(service.findByUserId).not.toHaveBeenCalled();
    });

    it('should return user projects when userId is provided', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174001';
      const userProjects = [mockProject];
      mockProjectsService.findByUserId.mockResolvedValue(userProjects);

      const result = await controller.findAll(userId);

      expect(result).toEqual(userProjects);
      expect(service.findByUserId).toHaveBeenCalledWith(userId);
      expect(service.findByUserId).toHaveBeenCalledTimes(1);
      expect(service.findAll).not.toHaveBeenCalled();
    });

    it('should return empty array when no projects exist', async () => {
      mockProjectsService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single project by id', async () => {
      const projectId = '123e4567-e89b-12d3-a456-426614174000';
      mockProjectsService.findOne.mockResolvedValue(mockProject);

      const result = await controller.findOne(projectId);

      expect(result).toEqual(mockProject);
      expect(service.findOne).toHaveBeenCalledWith(projectId);
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('should update a project', async () => {
      const projectId = '123e4567-e89b-12d3-a456-426614174000';
      const updateProjectDto: UpdateProjectDto = {
        project_name: 'Updated Project Name',
      };
      const updatedProject = { ...mockProject, project_name: 'Updated Project Name' };
      
      mockProjectsService.update.mockResolvedValue(updatedProject);

      const result = await controller.update(projectId, updateProjectDto);

      expect(result).toEqual(updatedProject);
      expect(service.update).toHaveBeenCalledWith(projectId, updateProjectDto);
      expect(service.update).toHaveBeenCalledTimes(1);
    });

    it('should update project with multiple fields', async () => {
      const projectId = '123e4567-e89b-12d3-a456-426614174000';
      const updateProjectDto: UpdateProjectDto = {
        project_name: 'Updated Project',
        assignment_id: 'new-assignment',
      };
      const updatedProject = { 
        ...mockProject, 
        project_name: 'Updated Project',
        assignment_id: 'new-assignment',
      };
      
      mockProjectsService.update.mockResolvedValue(updatedProject);

      const result = await controller.update(projectId, updateProjectDto);

      expect(result).toEqual(updatedProject);
      expect(service.update).toHaveBeenCalledWith(projectId, updateProjectDto);
    });
  });

  describe('remove', () => {
    it('should delete a project', async () => {
      const projectId = '123e4567-e89b-12d3-a456-426614174000';
      mockProjectsService.remove.mockResolvedValue(undefined);

      await controller.remove(projectId);

      expect(service.remove).toHaveBeenCalledWith(projectId);
      expect(service.remove).toHaveBeenCalledTimes(1);
    });
  });
});
