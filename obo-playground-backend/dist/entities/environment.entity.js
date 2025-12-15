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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Environment = void 0;
const typeorm_1 = require("typeorm");
const swagger_1 = require("@nestjs/swagger");
const project_entity_1 = require("./project.entity");
let Environment = class Environment {
    environment_id;
    environment_name;
    environment_code;
    description;
    thumbnail;
    environment_path;
    scene_config;
    difficulty;
    tags;
    is_active;
    created_at;
    updated_at;
    projects;
};
exports.Environment = Environment;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Unique identifier for the environment',
        example: 1,
    }),
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Environment.prototype, "environment_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Name of the 3D simulation environment',
        example: 'Basic Arena',
        maxLength: 100,
    }),
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, unique: true }),
    __metadata("design:type", String)
], Environment.prototype, "environment_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Unique code/slug for the environment',
        example: 'basic-arena',
        maxLength: 50,
    }),
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, unique: true }),
    __metadata("design:type", String)
], Environment.prototype, "environment_code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Description of the environment',
        example: 'Simple flat arena for basic movement practice',
    }),
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Environment.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Thumbnail image URL for the environment',
        example: '/thumbnails/basic-arena.jpg',
    }),
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], Environment.prototype, "thumbnail", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Path or endpoint to the environment runtime',
        example: '/runtime/unity',
        maxLength: 500,
    }),
    (0, typeorm_1.Column)({ type: 'varchar', length: 500 }),
    __metadata("design:type", String)
], Environment.prototype, "environment_path", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '3D scene configuration in JSON format',
        example: {
            modelUrl: '/model/obocar.glb',
            obstacles: [],
            lighting: { ambient: '#ffffff', directional: { direction: [1, -1, 0], intensity: 0.8 } }
        },
    }),
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], Environment.prototype, "scene_config", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Difficulty level of the environment',
        example: 'easy',
        enum: ['easy', 'medium', 'hard'],
    }),
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'medium' }),
    __metadata("design:type", String)
], Environment.prototype, "difficulty", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Tags for categorizing environments',
        example: ['basic', 'beginner', 'tutorial'],
    }),
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], Environment.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Whether this environment is currently active',
        example: true,
    }),
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Environment.prototype, "is_active", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Timestamp when the environment was created',
        example: '2025-12-11T10:30:00Z',
    }),
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Environment.prototype, "created_at", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Timestamp when the environment was last updated',
        example: '2025-12-11T15:45:00Z',
    }),
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Environment.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => project_entity_1.Project, (project) => project.environment),
    __metadata("design:type", Array)
], Environment.prototype, "projects", void 0);
exports.Environment = Environment = __decorate([
    (0, typeorm_1.Entity)('environments')
], Environment);
//# sourceMappingURL=environment.entity.js.map