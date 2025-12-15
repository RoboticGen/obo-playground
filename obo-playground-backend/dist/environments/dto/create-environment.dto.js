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
exports.CreateEnvironmentDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateEnvironmentDto {
    environment_name;
    environment_code;
    description;
    thumbnail;
    environment_path;
    scene_config;
    difficulty;
    tags;
    is_active;
}
exports.CreateEnvironmentDto = CreateEnvironmentDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Name of the environment',
        example: 'Basic Arena',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateEnvironmentDto.prototype, "environment_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Unique code for the environment',
        example: 'basic-arena',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreateEnvironmentDto.prototype, "environment_code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Description of the environment',
        example: 'Simple flat arena for basic movement practice',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEnvironmentDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Thumbnail image URL',
        example: '/thumbnails/basic-arena.jpg',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEnvironmentDto.prototype, "thumbnail", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Path to environment runtime',
        example: '/environments/basic',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateEnvironmentDto.prototype, "environment_path", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '3D scene configuration',
        example: {
            modelUrl: '/model/obocar.glb',
            groundColor: '#4caf50',
            obstacles: [
                {
                    type: 'box',
                    position: [10, 1, 0],
                    size: [2, 2, 2],
                    color: '#ff0000'
                }
            ],
            lighting: {
                ambient: '#ffffff',
                directional: {
                    direction: [1, -1, 0],
                    intensity: 0.8
                }
            }
        },
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateEnvironmentDto.prototype, "scene_config", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Difficulty level',
        example: 'easy',
        enum: ['easy', 'medium', 'hard'],
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEnvironmentDto.prototype, "difficulty", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Tags for categorization',
        example: ['basic', 'beginner'],
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CreateEnvironmentDto.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Whether environment is active',
        example: true,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateEnvironmentDto.prototype, "is_active", void 0);
//# sourceMappingURL=create-environment.dto.js.map