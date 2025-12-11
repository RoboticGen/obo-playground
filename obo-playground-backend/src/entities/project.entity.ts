import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Environment } from './environment.entity';

@Entity('projects')
export class Project {
  @ApiProperty({
    description: 'Unique identifier for the project',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @PrimaryGeneratedColumn('uuid')
  project_id: string;

  @ApiProperty({
    description: 'UUID of the user who owns the project',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @Column('uuid')
  user_id: string;

  @ApiProperty({
    description: 'Name of the project',
    example: 'My Robotics Project',
    maxLength: 255,
  })
  @Column({ type: 'varchar', length: 255 })
  project_name: string;

  @ApiProperty({
    description: 'Foreign key to the environment',
    example: 1,
  })
  @Column({ type: 'integer' })
  environment_id: number;

  @ManyToOne(() => Environment, (environment) => environment.projects, { eager: true })
  @JoinColumn({ name: 'environment_id' })
  environment: Environment;

  @ApiProperty({
    description: 'File path where the project is stored',
    example: 'Project_files/123e4567-e89b-12d3-a456-426614174000/my-project.py',
    maxLength: 500,
  })
  @Column({ type: 'varchar', length: 500 })
  file_path: string;

  @ApiPropertyOptional({
    description: 'Optional assignment identifier',
    example: 'assignment-001',
    maxLength: 255,
    nullable: true,
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  assignment_id: string;

  @ApiProperty({
    description: 'Timestamp when the project was created',
    example: '2025-12-10T10:30:00Z',
  })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({
    description: 'Timestamp when the project was last updated',
    example: '2025-12-10T15:45:00Z',
  })
  @UpdateDateColumn()
  updated_at: Date;
}
