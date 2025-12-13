import { Test, TestingModule } from '@nestjs/testing';
import { EnvironmentsController } from './environments.controller';
import { EnvironmentsService } from './environments.service';
import { Environment } from '../entities/environment.entity';

describe('EnvironmentsController', () => {
  let controller: EnvironmentsController;
  let service: EnvironmentsService;

  const mockEnvironments: Environment[] = [
    {
      environment_id: 1,
      environment_name: 'Unity 3D',
      environment_code: 'unity',
      environment_path: '/runtime/unity',
      is_active: true,
      created_at: new Date('2025-12-11'),
      updated_at: new Date('2025-12-11'),
      projects: [],
    },
    {
      environment_id: 2,
      environment_name: 'Unreal Engine',
      environment_code: 'unreal',
      environment_path: '/runtime/unreal',
      is_active: true,
      created_at: new Date('2025-12-11'),
      updated_at: new Date('2025-12-11'),
      projects: [],
    },
  ];

  const mockEnvironmentsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnvironmentsController],
      providers: [
        {
          provide: EnvironmentsService,
          useValue: mockEnvironmentsService,
        },
      ],
    }).compile();

    controller = module.get<EnvironmentsController>(EnvironmentsController);
    service = module.get<EnvironmentsService>(EnvironmentsService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all active environments', async () => {
      mockEnvironmentsService.findAll.mockResolvedValue(mockEnvironments);

      const result = await controller.findAll();

      expect(result).toEqual(mockEnvironments);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no environments exist', async () => {
      mockEnvironmentsService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should return environments with correct structure', async () => {
      mockEnvironmentsService.findAll.mockResolvedValue(mockEnvironments);

      const result = await controller.findAll();

      result.forEach(env => {
        expect(env).toHaveProperty('environment_id');
        expect(env).toHaveProperty('environment_name');
        expect(env).toHaveProperty('environment_code');
        expect(env).toHaveProperty('environment_path');
        expect(env).toHaveProperty('is_active');
        expect(env).toHaveProperty('created_at');
        expect(env).toHaveProperty('updated_at');
      });
    });
  });

  describe('findOne', () => {
    it('should return a single environment by id', async () => {
      const targetEnvironment = mockEnvironments[0];
      mockEnvironmentsService.findOne.mockResolvedValue(targetEnvironment);

      const result = await controller.findOne('1');

      expect(result).toEqual(targetEnvironment);
      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });

    it('should convert string id to number', async () => {
      const targetEnvironment = mockEnvironments[1];
      mockEnvironmentsService.findOne.mockResolvedValue(targetEnvironment);

      const result = await controller.findOne('2');

      expect(service.findOne).toHaveBeenCalledWith(2);
      expect(result).toEqual(targetEnvironment);
    });

    it('should return null when environment does not exist', async () => {
      mockEnvironmentsService.findOne.mockResolvedValue(null);

      const result = await controller.findOne('999');

      expect(result).toBeNull();
      expect(service.findOne).toHaveBeenCalledWith(999);
    });

    it('should handle different environment ids', async () => {
      for (const env of mockEnvironments) {
        mockEnvironmentsService.findOne.mockResolvedValue(env);
        
        const result = await controller.findOne(String(env.environment_id));
        
        expect(result).toEqual(env);
        expect(service.findOne).toHaveBeenCalledWith(env.environment_id);
      }
    });
  });
});
