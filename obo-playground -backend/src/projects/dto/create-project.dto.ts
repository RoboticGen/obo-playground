import { IsUUID, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({
    description: 'UUID of the user who owns the project',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID()
  user_id: string;

  @ApiProperty({
    description: 'File path where the project is stored',
    example: '/projects/user123/robotics-project.py',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  file_path: string;

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
