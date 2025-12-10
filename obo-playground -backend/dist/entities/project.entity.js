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
exports.Project = void 0;
const typeorm_1 = require("typeorm");
const swagger_1 = require("@nestjs/swagger");
let Project = class Project {
    project_id;
    user_id;
    file_path;
    assignment_id;
    created_at;
    updated_at;
};
exports.Project = Project;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Unique identifier for the project',
        example: '123e4567-e89b-12d3-a456-426614174000',
        format: 'uuid',
    }),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Project.prototype, "project_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'UUID of the user who owns the project',
        example: '123e4567-e89b-12d3-a456-426614174000',
        format: 'uuid',
    }),
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], Project.prototype, "user_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'File path where the project is stored',
        example: '/projects/user123/robotics-project.py',
        maxLength: 500,
    }),
    (0, typeorm_1.Column)({ type: 'varchar', length: 500 }),
    __metadata("design:type", String)
], Project.prototype, "file_path", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Optional assignment identifier',
        example: 'assignment-001',
        maxLength: 255,
        nullable: true,
    }),
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Project.prototype, "assignment_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Timestamp when the project was created',
        example: '2025-12-10T10:30:00Z',
    }),
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Project.prototype, "created_at", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Timestamp when the project was last updated',
        example: '2025-12-10T15:45:00Z',
    }),
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Project.prototype, "updated_at", void 0);
exports.Project = Project = __decorate([
    (0, typeorm_1.Entity)('projects')
], Project);
//# sourceMappingURL=project.entity.js.map