import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnvironmentsService } from './environments.service';
import { Environment } from '../entities/environment.entity';

describe('EnvironmentsService', () => {
  let service: EnvironmentsService;
  let repository: Repository<Environment>;

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
    {
      environment_id: 3,
      environment_name: 'Gazebo',
      environment_code: 'gazebo',
      environment_path: '/runtime/gazebo',
      is_active: false,
      created_at: new Date('2025-12-11'),
      updated_at: new Date('2025-12-11'),
      projects: [],
    },
  ];

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnvironmentsService,
        {
          provide: getRepositoryToken(Environment),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<EnvironmentsService>(EnvironmentsService);
    repository = module.get<Repository<Environment>>(
      getRepositoryToken(Environment),
    );

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all active environments', async () => {
      const activeEnvironments = mockEnvironments.filter(env => env.is_active);
      mockRepository.find.mockResolvedValue(activeEnvironments);

      const result = await service.findAll();

      expect(result).toEqual(activeEnvironments);
      expect(result).toHaveLength(2);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { is_active: true },
        order: { environment_id: 'ASC' },
      });
      expect(mockRepository.find).toHaveBeenCalledTimes(1);
    });

    it('should return environments ordered by environment_id', async () => {
      const activeEnvironments = mockEnvironments.filter(env => env.is_active);
      mockRepository.find.mockResolvedValue(activeEnvironments);

      const result = await service.findAll();

      expect(result[0].environment_id).toBeLessThan(result[1].environment_id);
    });

    it('should return empty array when no active environments exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should only return active environments', async () => {
      const activeEnvironments = mockEnvironments.filter(env => env.is_active);
      mockRepository.find.mockResolvedValue(activeEnvironments);

      const result = await service.findAll();

      result.forEach(env => {
        expect(env.is_active).toBe(true);
      });
    });
  });

  describe('findOne', () => {
    it('should return an environment by id', async () => {
      const targetEnvironment = mockEnvironments[0];
      mockRepository.findOne.mockResolvedValue(targetEnvironment);

      const result = await service.findOne(1);

      expect(result).toEqual(targetEnvironment);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { environment_id: 1 },
      });
      expect(mockRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('should return null when environment does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { environment_id: 999 },
      });
    });

    it('should return inactive environment by id', async () => {
      const inactiveEnvironment = mockEnvironments[2];
      mockRepository.findOne.mockResolvedValue(inactiveEnvironment);

      const result = await service.findOne(3);

      expect(result).toEqual(inactiveEnvironment);
      expect(result?.is_active).toBe(false);
    });

    it('should handle different environment ids correctly', async () => {
      for (const env of mockEnvironments) {
        mockRepository.findOne.mockResolvedValue(env);
        
        const result = await service.findOne(env.environment_id);
        
        expect(result).toEqual(env);
        expect(result?.environment_id).toBe(env.environment_id);
      }
    });
  });
});
