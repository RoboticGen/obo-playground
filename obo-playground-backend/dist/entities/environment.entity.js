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
    environment_path;
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
        example: 'Unity 3D',
        maxLength: 100,
    }),
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, unique: true }),
    __metadata("design:type", String)
], Environment.prototype, "environment_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Unique code/slug for the environment',
        example: 'unity',
        maxLength: 50,
    }),
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, unique: true }),
    __metadata("design:type", String)
], Environment.prototype, "environment_code", void 0);
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