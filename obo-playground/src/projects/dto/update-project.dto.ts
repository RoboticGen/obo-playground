import { IsUUID, IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateProjectDto {
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  file_path?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  assignment_id?: string;
}
