import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Environment } from '../entities/environment.entity';
import { CreateEnvironmentDto } from './dto/create-environment.dto';
import { UpdateEnvironmentDto } from './dto/update-environment.dto';

@Injectable()
export class EnvironmentsService {
  private readonly logger = new Logger(EnvironmentsService.name);

  constructor(
    @InjectRepository(Environment)
    private readonly environmentRepository: Repository<Environment>,
  ) {}

  async findAll(): Promise<Environment[]> {
    this.logger.log('Fetching all environments');
    return await this.environmentRepository.find({
      where: { is_active: true },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Environment> {
    this.logger.log(`Fetching environment with ID: ${id}`);
    const environment = await this.environmentRepository.findOne({
      where: { environment_id: id },
    });
    
    if (!environment) {
      throw new NotFoundException(`Environment with ID ${id} not found`);
    }
    
    return environment;
  }

  async findByCode(code: string): Promise<Environment> {
    const environment = await this.environmentRepository.findOne({
      where: { environment_code: code },
    });
    
    if (!environment) {
      throw new NotFoundException(`Environment with code ${code} not found`);
    }
    
    return environment;
  }

  async create(createEnvironmentDto: CreateEnvironmentDto): Promise<Environment> {
    this.logger.log(`Creating new environment: ${createEnvironmentDto.environment_name}`);
    
    // Check if environment with same code already exists
    const existing = await this.environmentRepository.findOne({
      where: { environment_code: createEnvironmentDto.environment_code },
    });
    
    if (existing) {
      throw new ConflictException(
        `Environment with code ${createEnvironmentDto.environment_code} already exists`,
      );
    }
    
    const environment = this.environmentRepository.create(createEnvironmentDto);
    return await this.environmentRepository.save(environment);
  }

  async update(id: number, updateEnvironmentDto: UpdateEnvironmentDto): Promise<Environment> {
    this.logger.log(`Updating environment with ID: ${id}`);
    
    const environment = await this.findOne(id);
    
    // Check if updating code and it conflicts with existing
    if (updateEnvironmentDto.environment_code && 
        updateEnvironmentDto.environment_code !== environment.environment_code) {
      const existing = await this.environmentRepository.findOne({
        where: { environment_code: updateEnvironmentDto.environment_code },
      });
      
      if (existing) {
        throw new ConflictException(
          `Environment with code ${updateEnvironmentDto.environment_code} already exists`,
        );
      }
    }
    
    Object.assign(environment, updateEnvironmentDto);
    return await this.environmentRepository.save(environment);
  }

  async remove(id: number): Promise<void> {
    this.logger.log(`Removing environment with ID: ${id}`);
    const environment = await this.findOne(id);
    await this.environmentRepository.remove(environment);
  }

  async seedDefaultEnvironments(): Promise<void> {
    this.logger.log('Seeding default environments...');
    
    const defaults: CreateEnvironmentDto[] = [
      {
        environment_name: 'Basic Arena',
        environment_code: 'basic-arena',
        description: 'Simple flat grass arena for basic movement practice. Perfect for beginners learning car controls.',
        environment_path: '/environments/basic',
        difficulty: 'easy',
        tags: ['basic', 'beginner', 'tutorial'],
        scene_config: {
          modelUrl: '/model/obocar.glb',
          groundColor: '#7cb342', // Bright green grass
          obstacles: [],
          lighting: {
            ambient: '#ffffff',
            directional: {
              direction: [-1, -2, -1],
              intensity: 0.8, // Bright daylight
            },
          },
          camera: {
            alpha: -Math.PI / 2,
            beta: Math.PI / 3,
            radius: 80,
            target: [0, 5, 0],
          },
        },
        is_active: true,
      },
      {
        environment_name: 'Obstacle Course',
        environment_code: 'obstacle-course',
        description: 'Navigate through colorful boxes and barriers in sunset atmosphere. Test your maneuvering skills!',
        environment_path: '/environments/obstacles',
        difficulty: 'medium',
        tags: ['obstacles', 'intermediate', 'challenge'],
        scene_config: {
          modelUrl: '/model/obocar.glb',
          groundColor: '#d84315', // Deep orange ground
          obstacles: [
            {
              type: 'box',
              position: [20, 3, 0],
              size: [20, 6, 2], // Taller wall
              color: '#d32f2f', // Bright red
            },
            {
              type: 'box',
              position: [-20, 2, 20],
              size: [2, 4, 20], // Medium height
              color: '#1976d2', // Bright blue
            },
            {
              type: 'cylinder',
              position: [0, 5, 30],
              size: [6, 10, 6], // Tall cylinder
              color: '#fbc02d', // Bright yellow
            },
            {
              type: 'box',
              position: [15, 1.5, 15],
              size: [3, 3, 3], // Short box
              color: '#7b1fa2', // Purple
            },
            {
              type: 'box',
              position: [-15, 1.5, -15],
              size: [3, 3, 3], // Short box
              color: '#0097a7', // Cyan
            },
            {
              type: 'cylinder',
              position: [-10, 2.5, 5],
              size: [4, 5, 4], // Medium cylinder
              color: '#388e3c', // Green
            },
          ],
          lighting: {
            ambient: '#ffccbc', // Warm sunset ambient
            directional: {
              direction: [-1, -2, -1],
              intensity: 0.9, // Bright sunset
            },
          },
        },
        is_active: true,
      },
      {
        environment_name: 'Maze Challenge',
        environment_code: 'maze-challenge',
        description: 'Dark complex maze with tall walls and dead ends. Find your way through the shadows!',
        environment_path: '/environments/maze',
        difficulty: 'hard',
        tags: ['maze', 'advanced', 'expert'],
        scene_config: {
          modelUrl: '/model/obocar.glb',
          groundColor: '#424242', // Dark gray ground
          obstacles: [
            // Outer walls - tall and dark
            { type: 'box', position: [0, 5, 40], size: [80, 10, 2], color: '#1a1a1a' },
            { type: 'box', position: [0, 5, -40], size: [80, 10, 2], color: '#1a1a1a' },
            { type: 'box', position: [40, 5, 0], size: [2, 10, 80], color: '#1a1a1a' },
            { type: 'box', position: [-40, 5, 0], size: [2, 10, 80], color: '#1a1a1a' },
            // Inner maze walls - very tall to feel enclosed
            { type: 'box', position: [0, 4.5, 20], size: [30, 9, 2], color: '#212121' },
            { type: 'box', position: [15, 4.5, 0], size: [2, 9, 40], color: '#212121' },
            { type: 'box', position: [-15, 4.5, 10], size: [2, 9, 20], color: '#212121' },
            { type: 'box', position: [0, 4.5, -10], size: [20, 9, 2], color: '#212121' },
            { type: 'box', position: [25, 4.5, 15], size: [2, 9, 30], color: '#212121' },
            { type: 'box', position: [-25, 4.5, -15], size: [2, 9, 30], color: '#212121' },
            { type: 'box', position: [10, 4.5, -25], size: [15, 9, 2], color: '#212121' },
            { type: 'box', position: [-20, 4.5, 25], size: [10, 9, 2], color: '#212121' },
          ],
          lighting: {
            ambient: '#444444', // Very dim ambient
            directional: {
              direction: [-1, -2, -1],
              intensity: 0.3, // Dark moody lighting
            },
          },
        },
        is_active: true,
      },
      {
        environment_name: 'Race Track',
        environment_code: 'race-track',
        description: 'Speed around the oval track under stadium lights. Time your laps!',
        environment_path: '/environments/race',
        difficulty: 'medium',
        tags: ['racing', 'speed', 'competitive'],
        scene_config: {
          modelUrl: '/model/obocar.glb',
          groundColor: '#1a1a1a', // Black asphalt
          obstacles: [
            // Track barriers - outer (white)
            { type: 'box', position: [30, 1.5, 0], size: [2, 3, 60], color: '#ffffff' },
            { type: 'box', position: [-30, 1.5, 0], size: [2, 3, 60], color: '#ffffff' },
            { type: 'cylinder', position: [30, 1.5, 30], size: [4, 3, 4], color: '#ffffff' },
            { type: 'cylinder', position: [30, 1.5, -30], size: [4, 3, 4], color: '#ffffff' },
            { type: 'cylinder', position: [-30, 1.5, 30], size: [4, 3, 4], color: '#ffffff' },
            { type: 'cylinder', position: [-30, 1.5, -30], size: [4, 3, 4], color: '#ffffff' },
            // Track barriers - inner (red and white striped)
            { type: 'box', position: [15, 1.5, 0], size: [2, 3, 40], color: '#d32f2f' },
            { type: 'box', position: [-15, 1.5, 0], size: [2, 3, 40], color: '#d32f2f' },
            { type: 'cylinder', position: [15, 1.5, 20], size: [3, 3, 3], color: '#ffffff' },
            { type: 'cylinder', position: [15, 1.5, -20], size: [3, 3, 3], color: '#ffffff' },
            { type: 'cylinder', position: [-15, 1.5, 20], size: [3, 3, 3], color: '#ffffff' },
            { type: 'cylinder', position: [-15, 1.5, -20], size: [3, 3, 3], color: '#ffffff' },
            // Start/finish line markers
            { type: 'box', position: [0, 0.5, -35], size: [30, 1, 2], color: '#ffffff' },
          ],
          lighting: {
            ambient: '#ffffff',
            directional: {
              direction: [0, -1, 0], // Stadium lights from above
              intensity: 1.0, // Very bright stadium lighting
            },
          },
        },
        is_active: true,
      },
      {
        environment_name: 'Parking Lot',
        environment_code: 'parking-lot',
        description: 'Practice precision parking between tight spaces in an underground garage.',
        environment_path: '/environments/parking',
        difficulty: 'medium',
        tags: ['parking', 'precision', 'skill'],
        scene_config: {
          modelUrl: '/model/obocar.glb',
          groundColor: '#546e7a', // Blue-gray concrete
          obstacles: [
            // Building perimeter walls
            { type: 'box', position: [0, 2, 35], size: [70, 4, 2], color: '#37474f' },
            { type: 'box', position: [0, 2, -35], size: [70, 4, 2], color: '#37474f' },
            { type: 'box', position: [35, 2, 0], size: [2, 4, 70], color: '#37474f' },
            { type: 'box', position: [-35, 2, 0], size: [2, 4, 70], color: '#37474f' },
            // Parking spot markers (yellow lines - low height)
            { type: 'box', position: [10, 0.2, 10], size: [8, 0.4, 0.3], color: '#fdd835' },
            { type: 'box', position: [10, 0.2, 20], size: [8, 0.4, 0.3], color: '#fdd835' },
            { type: 'box', position: [10, 0.2, 30], size: [8, 0.4, 0.3], color: '#fdd835' },
            { type: 'box', position: [-10, 0.2, 10], size: [8, 0.4, 0.3], color: '#fdd835' },
            { type: 'box', position: [-10, 0.2, 20], size: [8, 0.4, 0.3], color: '#fdd835' },
            { type: 'box', position: [-10, 0.2, 30], size: [8, 0.4, 0.3], color: '#fdd835' },
            { type: 'box', position: [10, 0.2, 5], size: [8, 0.4, 0.3], color: '#fdd835' },
            { type: 'box', position: [-10, 0.2, 5], size: [8, 0.4, 0.3], color: '#fdd835' },
            // Parked cars
            { type: 'box', position: [10, 1.5, 12], size: [4, 3, 7], color: '#1976d2' },
            { type: 'box', position: [-10, 1.5, 22], size: [4, 3, 7], color: '#d32f2f' },
            { type: 'box', position: [10, 1.5, 27], size: [4, 3, 7], color: '#388e3c' },
            { type: 'box', position: [-10, 1.5, 7], size: [4, 3, 7], color: '#ffffff' },
          ],
          lighting: {
            ambient: '#b3e5fc', // Cool blue ambient light
            directional: {
              direction: [0, -1, 0], // Overhead parking lot lights
              intensity: 0.6, // Dim indoor lighting
            },
          },
        },
        is_active: true,
      },
    ];

    for (const envDto of defaults) {
      try {
        const existing = await this.environmentRepository.findOne({
          where: { environment_code: envDto.environment_code },
        });
        
        if (!existing) {
          await this.create(envDto);
          this.logger.log(`✅ Seeded environment: ${envDto.environment_name}`);
        } else {
          this.logger.log(`⏭️  Environment already exists: ${envDto.environment_name}`);
        }
      } catch (error) {
        this.logger.error(`Failed to seed environment ${envDto.environment_name}:`, error);
      }
    }
    
    this.logger.log('Default environments seeding complete!');
  }
}
