import { Controller, Get, Post, Put, Delete, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EnvironmentsService } from './environments.service';
import { Environment } from '../entities/environment.entity';
import { CreateEnvironmentDto } from './dto/create-environment.dto';
import { UpdateEnvironmentDto } from './dto/update-environment.dto';

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

  @Post('seed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Seed default environments' })
  @ApiResponse({
    status: 200,
    description: 'Default environments seeded successfully',
  })
  async seedDefaults(): Promise<{ message: string }> {
    await this.environmentsService.seedDefaultEnvironments();
    return { message: 'Default environments seeded successfully' };
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get environment by code' })
  @ApiResponse({
    status: 200,
    description: 'Environment details',
    type: Environment,
  })
  findByCode(@Param('code') code: string): Promise<Environment> {
    return this.environmentsService.findByCode(code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get environment by ID' })
  @ApiResponse({
    status: 200,
    description: 'Environment details',
    type: Environment,
  })
  @ApiResponse({
    status: 404,
    description: 'Environment not found',
  })
  findOne(@Param('id') id: string): Promise<Environment> {
    return this.environmentsService.findOne(+id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new environment' })
  @ApiResponse({
    status: 201,
    description: 'Environment created successfully',
    type: Environment,
  })
  @ApiResponse({
    status: 409,
    description: 'Environment with this code already exists',
  })
  create(@Body() createEnvironmentDto: CreateEnvironmentDto): Promise<Environment> {
    return this.environmentsService.create(createEnvironmentDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an environment' })
  @ApiResponse({
    status: 200,
    description: 'Environment updated successfully',
    type: Environment,
  })
  @ApiResponse({
    status: 404,
    description: 'Environment not found',
  })
  update(
    @Param('id') id: string,
    @Body() updateEnvironmentDto: UpdateEnvironmentDto,
  ): Promise<Environment> {
    return this.environmentsService.update(+id, updateEnvironmentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an environment' })
  @ApiResponse({
    status: 204,
    description: 'Environment deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Environment not found',
  })
  remove(@Param('id') id: string): Promise<void> {
    return this.environmentsService.remove(+id);
  }
}
