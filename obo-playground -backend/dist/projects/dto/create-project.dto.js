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
exports.CreateProjectDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateProjectDto {
    user_id;
    project_name;
    environment_id;
    assignment_id;
}
exports.CreateProjectDto = CreateProjectDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'UUID of the user who owns the project',
        example: '123e4567-e89b-12d3-a456-426614174000',
        format: 'uuid',
    }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateProjectDto.prototype, "user_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Name of the project',
        example: 'My Robotics Project',
        maxLength: 255,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateProjectDto.prototype, "project_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID of the 3D environment for running simulations',
        example: 1,
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Number)
], CreateProjectDto.prototype, "environment_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Optional assignment identifier',
        example: 'assignment-001',
        maxLength: 255,
        nullable: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateProjectDto.prototype, "assignment_id", void 0);
//# sourceMappingURL=create-project.dto.js.map