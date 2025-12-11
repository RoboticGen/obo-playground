import { IsUUID, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProjectDto {
  @ApiPropertyOptional({
    description: 'UUID of the user who owns the project',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @ApiPropertyOptional({
    description: 'Name of the project',
    example: 'My Robotics Project',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  project_name?: string;

  @ApiPropertyOptional({
    description: 'ID of the 3D environment for running simulations',
    example: 1,
  })
  @IsOptional()
  environment_id?: number;

  @ApiPropertyOptional({
    description: 'File path where the project is stored',
    example: 'Project_files/123e4567-e89b-12d3-a456-426614174000/my-project.py',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  file_path?: string;

  @ApiPropertyOptional({
    description: 'Optional assignment identifier',
    example: 'assignment-001',
    maxLength: 255,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  assignment_id?: string;
}
