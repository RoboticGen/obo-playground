import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import {
  HealthCheckService,
  HttpHealthIndicator,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: HealthCheckService;
  let dbHealthIndicator: TypeOrmHealthIndicator;
  let memoryHealthIndicator: MemoryHealthIndicator;
  let diskHealthIndicator: DiskHealthIndicator;

  const mockHealthCheckService = {
    check: jest.fn(),
  };

  const mockHttpHealthIndicator = {
    pingCheck: jest.fn(),
  };

  const mockDbHealthIndicator = {
    pingCheck: jest.fn(),
  };

  const mockMemoryHealthIndicator = {
    checkHeap: jest.fn(),
    checkRSS: jest.fn(),
  };

  const mockDiskHealthIndicator = {
    checkStorage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: mockHealthCheckService,
        },
        {
          provide: HttpHealthIndicator,
          useValue: mockHttpHealthIndicator,
        },
        {
          provide: TypeOrmHealthIndicator,
          useValue: mockDbHealthIndicator,
        },
        {
          provide: MemoryHealthIndicator,
          useValue: mockMemoryHealthIndicator,
        },
        {
          provide: DiskHealthIndicator,
          useValue: mockDiskHealthIndicator,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get<HealthCheckService>(HealthCheckService);
    dbHealthIndicator = module.get<TypeOrmHealthIndicator>(TypeOrmHealthIndicator);
    memoryHealthIndicator = module.get<MemoryHealthIndicator>(MemoryHealthIndicator);
    diskHealthIndicator = module.get<DiskHealthIndicator>(DiskHealthIndicator);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should return healthy status when all checks pass', async () => {
      const healthyResponse = {
        status: 'ok',
        info: {
          database: { status: 'up' },
          memory_heap: { status: 'up' },
          memory_rss: { status: 'up' },
          storage: { status: 'up' },
        },
        error: {},
        details: {
          database: { status: 'up' },
          memory_heap: { status: 'up' },
          memory_rss: { status: 'up' },
          storage: { status: 'up' },
        },
      };

      mockHealthCheckService.check.mockResolvedValue(healthyResponse);

      const result = await controller.check();

      expect(result).toEqual(healthyResponse);
      expect(healthCheckService.check).toHaveBeenCalledTimes(1);
    });

    it('should check database health', async () => {
      mockHealthCheckService.check.mockImplementation(async (checks) => {
        for (const check of checks) {
          await check();
        }
        return { status: 'ok', info: {}, error: {}, details: {} };
      });

      mockDbHealthIndicator.pingCheck.mockResolvedValue({ database: { status: 'up' } });

      await controller.check();

      expect(mockDbHealthIndicator.pingCheck).toHaveBeenCalledWith('database');
    });

    it('should check memory heap within threshold', async () => {
      const heapThreshold = 150 * 1024 * 1024; // 150MB
      
      mockHealthCheckService.check.mockImplementation(async (checks) => {
        for (const check of checks) {
          await check();
        }
        return { status: 'ok', info: {}, error: {}, details: {} };
      });

      mockMemoryHealthIndicator.checkHeap.mockResolvedValue({ 
        memory_heap: { status: 'up' } 
      });

      await controller.check();

      expect(mockMemoryHealthIndicator.checkHeap).toHaveBeenCalledWith(
        'memory_heap',
        heapThreshold,
      );
    });

    it('should check memory RSS within threshold', async () => {
      const rssThreshold = 300 * 1024 * 1024; // 300MB
      
      mockHealthCheckService.check.mockImplementation(async (checks) => {
        for (const check of checks) {
          await check();
        }
        return { status: 'ok', info: {}, error: {}, details: {} };
      });

      mockMemoryHealthIndicator.checkRSS.mockResolvedValue({ 
        memory_rss: { status: 'up' } 
      });

      await controller.check();

      expect(mockMemoryHealthIndicator.checkRSS).toHaveBeenCalledWith(
        'memory_rss',
        rssThreshold,
      );
    });

    it('should check disk storage with correct path for Windows', async () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'win32' });
      
      mockHealthCheckService.check.mockImplementation(async (checks) => {
        for (const check of checks) {
          await check();
        }
        return { status: 'ok', info: {}, error: {}, details: {} };
      });

      mockDiskHealthIndicator.checkStorage.mockResolvedValue({ 
        storage: { status: 'up' } 
      });

      await controller.check();

      expect(mockDiskHealthIndicator.checkStorage).toHaveBeenCalledWith(
        'storage',
        expect.objectContaining({
          path: 'C:\\',
          thresholdPercent: 0.9,
        }),
      );

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should check disk storage with correct path for Unix', async () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'linux' });
      
      mockHealthCheckService.check.mockImplementation(async (checks) => {
        for (const check of checks) {
          await check();
        }
        return { status: 'ok', info: {}, error: {}, details: {} };
      });

      mockDiskHealthIndicator.checkStorage.mockResolvedValue({ 
        storage: { status: 'up' } 
      });

      await controller.check();

      expect(mockDiskHealthIndicator.checkStorage).toHaveBeenCalledWith(
        'storage',
        expect.objectContaining({
          path: '/',
          thresholdPercent: 0.9,
        }),
      );

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should return unhealthy status when checks fail', async () => {
      const unhealthyResponse = {
        status: 'error',
        info: {},
        error: {
          database: { status: 'down', message: 'Connection failed' },
        },
        details: {
          database: { status: 'down', message: 'Connection failed' },
        },
      };

      mockHealthCheckService.check.mockResolvedValue(unhealthyResponse);

      const result = await controller.check();

      expect(result.status).toBe('error');
      expect(result.error).toBeDefined();
    });
  });

  describe('ping', () => {
    it('should return ok status with timestamp', () => {
      const beforeTime = new Date();
      const result = controller.ping();
      const afterTime = new Date();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
      
      const resultTime = new Date(result.timestamp);
      expect(resultTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(resultTime.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should return ISO timestamp format', () => {
      const result = controller.ping();
      
      expect(result.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
    });

    it('should always return status ok', () => {
      for (let i = 0; i < 5; i++) {
        const result = controller.ping();
        expect(result.status).toBe('ok');
      }
    });
  });
});
