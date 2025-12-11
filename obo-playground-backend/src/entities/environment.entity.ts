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
    example: 'Unity 3D',
    maxLength: 100,
  })
  @Column({ type: 'varchar', length: 100, unique: true })
  environment_name: string;

  @ApiProperty({
    description: 'Unique code/slug for the environment',
    example: 'unity',
    maxLength: 50,
  })
  @Column({ type: 'varchar', length: 50, unique: true })
  environment_code: string;

  @ApiProperty({
    description: 'Path or endpoint to the environment runtime',
    example: '/runtime/unity',
    maxLength: 500,
  })
  @Column({ type: 'varchar', length: 500 })
  environment_path: string;

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
