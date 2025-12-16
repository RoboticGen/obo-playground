import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project } from '../entities/project.entity';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Create a new project',
    description: 'Creates a new project with the provided user ID, file path, and optional assignment ID',
  })
  @ApiBody({ type: CreateProjectDto })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Project successfully created',
    type: Project,
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data provided',
  })
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all projects',
    description: 'Retrieves all projects or filters by user ID if provided',
  })
  @ApiQuery({ 
    name: 'userId', 
    required: false, 
    description: 'Filter projects by user UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'List of projects retrieved successfully',
    type: [Project],
  })
  findAll(@Query('userId') userId?: string) {
    if (userId) {
      return this.projectsService.findByUserId(userId);
    }
    return this.projectsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get a project by ID',
    description: 'Retrieves a single project by its UUID',
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Project UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Project found and returned',
    type: Project,
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Project with the specified ID not found',
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid UUID format',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Update a project',
    description: 'Updates an existing project with the provided fields',
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Project UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
  })
  @ApiBody({ type: UpdateProjectDto })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Project successfully updated',
    type: Project,
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Project with the specified ID not found',
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data or UUID format',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Delete a project',
    description: 'Permanently deletes a project by its UUID',
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Project UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
  })
  @ApiResponse({ 
    status: HttpStatus.NO_CONTENT, 
    description: 'Project successfully deleted',
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Project with the specified ID not found',
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid UUID format',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.projectsService.remove(id);
  }

  @Patch(':id/content')
  @ApiOperation({ 
    summary: 'Update project file content',
    description: 'Updates the Python file content for a project',
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Project UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
  })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'Python code content',
        },
      },
      required: ['code'],
    },
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'File content successfully updated',
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Project not found',
  })
  async updateContent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('code') code: string,
  ) {
    return this.projectsService.updateFileContent(id, code);
  }

  @Get(':id/content')
  @ApiOperation({ 
    summary: 'Get project file content',
    description: 'Retrieves the Python file content for a project',
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Project UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'File content retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        lastModified: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Project not found',
  })
  async getContent(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.getFileContent(id);
  }
}
