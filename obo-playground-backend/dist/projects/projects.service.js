"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let ProjectsService = ProjectsService_1 = class ProjectsService {
    projectRepository;
    logger = new common_1.Logger(ProjectsService_1.name);
    projectFilesDir = path.join(process.cwd(), 'Project_files');
    constructor(projectRepository) {
        this.projectRepository = projectRepository;
    }
    async create(createProjectDto) {
        try {
            this.logger.log(`Creating new project for user: ${createProjectDto.user_id}`);
            const sanitizedProjectName = createProjectDto.project_name
                .replace(/[^a-zA-Z0-9-_\s]/g, '')
                .replace(/\s+/g, '-')
                .toLowerCase();
            const userDir = path.join(this.projectFilesDir, createProjectDto.user_id);
            const fileName = `${sanitizedProjectName}.py`;
            const filePath = path.join('Project_files', createProjectDto.user_id, fileName);
            const fullFilePath = path.join(this.projectFilesDir, createProjectDto.user_id, fileName);
            if (!fs.existsSync(userDir)) {
                fs.mkdirSync(userDir, { recursive: true });
                this.logger.log(`Created user directory: ${userDir}`);
            }
            const pythonTemplate = `# ${createProjectDto.project_name}
# 3D Environment ID: ${createProjectDto.environment_id}
# Created: ${new Date().toISOString()}

def main():
    """Main function for ${createProjectDto.project_name}"""
    print("Starting ${createProjectDto.project_name}")
    # Add your 3D simulation code here

if __name__ == "__main__":
    main()
`;
            fs.writeFileSync(fullFilePath, pythonTemplate, 'utf8');
            this.logger.log(`Created Python file: ${fullFilePath}`);
            const project = this.projectRepository.create({
                ...createProjectDto,
                file_path: filePath,
            });
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
            const fullFilePath = path.join(process.cwd(), project.file_path);
            if (fs.existsSync(fullFilePath)) {
                fs.unlinkSync(fullFilePath);
                this.logger.log(`Deleted file: ${fullFilePath}`);
            }
            await this.projectRepository.remove(project);
            this.logger.log(`Project deleted successfully: ${id}`);
        }
        catch (error) {
            this.logger.error(`Failed to delete project ${id}: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException('Failed to delete project');
        }
    }
    async updateFileContent(id, code) {
        const project = await this.findOne(id);
        try {
            this.logger.log(`Updating file content for project: ${id}`);
            const fullFilePath = path.join(process.cwd(), project.file_path);
            const directory = path.dirname(fullFilePath);
            if (!fs.existsSync(directory)) {
                fs.mkdirSync(directory, { recursive: true });
            }
            fs.writeFileSync(fullFilePath, code, 'utf8');
            project.updated_at = new Date();
            await this.projectRepository.save(project);
            this.logger.log(`File content updated: ${fullFilePath}`);
            return {
                message: 'File content updated successfully',
                lastModified: project.updated_at,
            };
        }
        catch (error) {
            this.logger.error(`Failed to update file content for project ${id}: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException('Failed to update file content');
        }
    }
    async getFileContent(id) {
        const project = await this.findOne(id);
        try {
            this.logger.log(`Reading file content for project: ${id}`);
            const fullFilePath = path.join(process.cwd(), project.file_path);
            if (!fs.existsSync(fullFilePath)) {
                throw new common_1.NotFoundException(`File not found: ${project.file_path}`);
            }
            const code = fs.readFileSync(fullFilePath, 'utf8');
            return {
                code,
                lastModified: project.updated_at,
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            this.logger.error(`Failed to read file content for project ${id}: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException('Failed to read file content');
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