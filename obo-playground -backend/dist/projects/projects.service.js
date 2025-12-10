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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const project_entity_1 = require("../entities/project.entity");
let ProjectsService = class ProjectsService {
    projectRepository;
    constructor(projectRepository) {
        this.projectRepository = projectRepository;
    }
    async create(createProjectDto) {
        try {
            const project = this.projectRepository.create(createProjectDto);
            return await this.projectRepository.save(project);
        }
        catch (error) {
            throw new common_1.BadRequestException('Failed to create project');
        }
    }
    async findAll() {
        return await this.projectRepository.find({
            order: {
                created_at: 'DESC',
            },
        });
    }
    async findOne(id) {
        const project = await this.projectRepository.findOne({
            where: { project_id: id },
        });
        if (!project) {
            throw new common_1.NotFoundException(`Project with ID ${id} not found`);
        }
        return project;
    }
    async findByUserId(userId) {
        return await this.projectRepository.find({
            where: { user_id: userId },
            order: {
                created_at: 'DESC',
            },
        });
    }
    async update(id, updateProjectDto) {
        const project = await this.findOne(id);
        Object.assign(project, updateProjectDto);
        try {
            return await this.projectRepository.save(project);
        }
        catch (error) {
            throw new common_1.BadRequestException('Failed to update project');
        }
    }
    async remove(id) {
        const project = await this.findOne(id);
        await this.projectRepository.remove(project);
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ProjectsService);
//# sourceMappingURL=projects.service.js.map