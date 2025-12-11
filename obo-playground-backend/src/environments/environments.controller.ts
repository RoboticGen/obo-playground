import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EnvironmentsService } from './environments.service';
import { Environment } from '../entities/environment.entity';

@ApiTags('environments')
@Controller('environments')
export class EnvironmentsController {
  constructor(private readonly environmentsService: EnvironmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active environments' })
  @ApiResponse({
    status: 200,
    description: 'List of all active environments',
    type: [Environment],
  })
  findAll(): Promise<Environment[]> {
    return this.environmentsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get environment by ID' })
  @ApiResponse({
    status: 200,
    description: 'Environment details',
    type: Environment,
  })
  findOne(@Param('id') id: string): Promise<Environment | null> {
    return this.environmentsService.findOne(+id);
  }
}
