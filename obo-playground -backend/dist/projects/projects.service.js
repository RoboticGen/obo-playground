"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ProjectsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const project_entity_1 = require("../entities/project.entity");
let ProjectsService = ProjectsService_1 = class ProjectsService {
    projectRepository;
    logger = new common_1.Logger(ProjectsService_1.name);
    constructor(projectRepository) {
        this.projectRepository = projectRepository;
    }
    async create(createProjectDto) {
        try {
            this.logger.log(`Creating new project for user: ${createProjectDto.user_id}`);
            const project = this.projectRepository.create(createProjectDto);
            const savedProject = await this.projectRepository.save(project);
            this.logger.log(`Project created successfully: ${savedProject.project_id}`);
            return savedProject;
        }
        catch (error) {
            this.logger.error(`Failed to create project: ${error.message}`, error.stack);
            if (error.code === '23505') {
                throw new common_1.BadRequestException('A project with this information already exists');
            }
            throw new common_1.InternalServerErrorException('Failed to create project. Please try again.');
        }
    }
    async findAll() {
        try {
            this.logger.log('Fetching all projects');
            const projects = await this.projectRepository.find({
                order: {
                    created_at: 'DESC',
                },
            });
            this.logger.log(`Found ${projects.length} projects`);
            return projects;
        }
        catch (error) {
            this.logger.error(`Failed to fetch projects: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException('Failed to fetch projects');
        }
    }
    async findOne(id) {
        try {
            this.logger.log(`Fetching project with ID: ${id}`);
            const project = await this.projectRepository.findOne({
                where: { project_id: id },
            });
            if (!project) {
                this.logger.warn(`Project not found with ID: ${id}`);
                throw new common_1.NotFoundException(`Project with ID ${id} not found`);
            }
            return project;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            this.logger.error(`Failed to fetch project ${id}: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException('Failed to fetch project');
        }
    }
    async findByUserId(userId) {
        try {
            this.logger.log(`Fetching projects for user: ${userId}`);
            const projects = await this.projectRepository.find({
                where: { user_id: userId },
                order: {
                    created_at: 'DESC',
                },
            });
            this.logger.log(`Found ${projects.length} projects for user ${userId}`);
            return projects;
        }
        catch (error) {
            this.logger.error(`Failed to fetch projects for user ${userId}: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException('Failed to fetch user projects');
        }
    }
    async update(id, updateProjectDto) {
        const project = await this.findOne(id);
        this.logger.log(`Updating project: ${id}`);
        Object.assign(project, updateProjectDto);
        try {
            const updatedProject = await this.projectRepository.save(project);
            this.logger.log(`Project updated successfully: ${id}`);
            return updatedProject;
        }
        catch (error) {
            this.logger.error(`Failed to update project ${id}: ${error.message}`, error.stack);
            if (error.code === '23505') {
                throw new common_1.BadRequestException('A project with this information already exists');
            }
            throw new common_1.InternalServerErrorException('Failed to update project. Please try again.');
        }
    }
    async remove(id) {
        const project = await this.findOne(id);
        try {
            this.logger.log(`Deleting project: ${id}`);
            await this.projectRepository.remove(project);
            this.logger.log(`Project deleted successfully: ${id}`);
        }
        catch (error) {
            this.logger.error(`Failed to delete project ${id}: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException('Failed to delete project');
        }
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = ProjectsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ProjectsService);
//# sourceMappingURL=projects.service.js.map