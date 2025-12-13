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
    description: 'Name of the project',
    example: 'My Robotics Project',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  project_name: string;

  @ApiProperty({
    description: 'ID of the 3D environment for running simulations',
    example: 1,
  })
  environment_id: number;

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
