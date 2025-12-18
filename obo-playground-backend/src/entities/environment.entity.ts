import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Project } from './project.entity';

@Entity('environments')
export class Environment {
  @ApiProperty({
    description: 'Unique identifier for the environment',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  environment_id: number;

  @ApiProperty({
    description: 'Name of the 3D simulation environment',
    example: 'Basic Arena',
    maxLength: 100,
  })
  @Column({ type: 'varchar', length: 100, unique: true })
  environment_name: string;

  @ApiProperty({
    description: 'Unique code/slug for the environment',
    example: 'basic-arena',
    maxLength: 50,
  })
  @Column({ type: 'varchar', length: 50, unique: true })
  environment_code: string;

  @ApiProperty({
    description: 'Description of the environment',
    example: 'Simple flat arena for basic movement practice',
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({
    description: 'Thumbnail image URL for the environment',
    example: '/thumbnails/basic-arena.jpg',
  })
  @Column({ type: 'varchar', length: 500, nullable: true })
  thumbnail: string;

  @ApiProperty({
    description: 'Path or endpoint to the environment runtime',
    example: '/runtime/unity',
    maxLength: 500,
  })
  @Column({ type: 'varchar', length: 500 })
  environment_path: string;

  @ApiProperty({
    description: '3D scene configuration in JSON format',
    example: {
      modelUrl: '/model/obocar.glb',
      obstacles: [],
      lighting: { ambient: '#ffffff', directional: { direction: [1, -1, 0], intensity: 0.8 } }
    },
  })
  @Column({ type: 'json', nullable: true })
  scene_config: {
    modelUrl?: string;
    groundTexture?: string;
    groundColor?: string;
    obstacles?: Array<{
      type: 'box' | 'sphere' | 'cylinder' | 'wall';
      position: [number, number, number];
      size: [number, number, number];
      color?: string;
      rotation?: [number, number, number];
    }>;
    lighting?: {
      ambient?: string;
      directional?: {
        direction: [number, number, number];
        intensity: number;
      };
    };
    camera?: {
      alpha?: number;
      beta?: number;
      radius?: number;
      target?: [number, number, number];
    };
  };

  @ApiProperty({
    description: 'Difficulty level of the environment',
    example: 'easy',
    enum: ['easy', 'medium', 'hard'],
  })
  @Column({ type: 'varchar', length: 20, default: 'medium' })
  difficulty: string;

  @ApiProperty({
    description: 'Tags for categorizing environments',
    example: ['basic', 'beginner', 'tutorial'],
  })
  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @ApiProperty({
    description: 'Whether this environment is currently active',
    example: true,
  })
  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @ApiProperty({
    description: 'Timestamp when the environment was created',
    example: '2025-12-11T10:30:00Z',
  })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({
    description: 'Timestamp when the environment was last updated',
    example: '2025-12-11T15:45:00Z',
  })
  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Project, (project) => project.environment)
  projects: Project[];
}
