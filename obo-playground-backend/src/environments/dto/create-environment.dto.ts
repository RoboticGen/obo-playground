import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsArray, IsObject, MaxLength } from 'class-validator';

export class CreateEnvironmentDto {
  @ApiProperty({
    description: 'Name of the environment',
    example: 'Basic Arena',
  })
  @IsString()
  @MaxLength(100)
  environment_name: string;

  @ApiProperty({
    description: 'Unique code for the environment',
    example: 'basic-arena',
  })
  @IsString()
  @MaxLength(50)
  environment_code: string;

  @ApiProperty({
    description: 'Description of the environment',
    example: 'Simple flat arena for basic movement practice',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Thumbnail image URL',
    example: '/thumbnails/basic-arena.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiProperty({
    description: 'Path to environment runtime',
    example: '/environments/basic',
  })
  @IsString()
  @MaxLength(500)
  environment_path: string;

  @ApiProperty({
    description: '3D scene configuration',
    example: {
      modelUrl: '/model/obocar.glb',
      groundColor: '#4caf50',
      obstacles: [
        {
          type: 'box',
          position: [10, 1, 0],
          size: [2, 2, 2],
          color: '#ff0000'
        }
      ],
      lighting: {
        ambient: '#ffffff',
        directional: {
          direction: [1, -1, 0],
          intensity: 0.8
        }
      }
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  scene_config?: {
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
    description: 'Difficulty level',
    example: 'easy',
    enum: ['easy', 'medium', 'hard'],
    required: false,
  })
  @IsOptional()
  @IsString()
  difficulty?: string;

  @ApiProperty({
    description: 'Tags for categorization',
    example: ['basic', 'beginner'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiProperty({
    description: 'Whether environment is active',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
