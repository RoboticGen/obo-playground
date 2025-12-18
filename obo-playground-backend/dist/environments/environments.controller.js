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
exports.EnvironmentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const environments_service_1 = require("./environments.service");
const environment_entity_1 = require("../entities/environment.entity");
const create_environment_dto_1 = require("./dto/create-environment.dto");
const update_environment_dto_1 = require("./dto/update-environment.dto");
let EnvironmentsController = class EnvironmentsController {
    environmentsService;
    constructor(environmentsService) {
        this.environmentsService = environmentsService;
    }
    findAll() {
        return this.environmentsService.findAll();
    }
    async seedDefaults() {
        await this.environmentsService.seedDefaultEnvironments();
        return { message: 'Default environments seeded successfully' };
    }
    findByCode(code) {
        return this.environmentsService.findByCode(code);
    }
    findOne(id) {
        return this.environmentsService.findOne(+id);
    }
    create(createEnvironmentDto) {
        return this.environmentsService.create(createEnvironmentDto);
    }
    update(id, updateEnvironmentDto) {
        return this.environmentsService.update(+id, updateEnvironmentDto);
    }
    remove(id) {
        return this.environmentsService.remove(+id);
    }
};
exports.EnvironmentsController = EnvironmentsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all active environments' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of all active environments',
        type: [environment_entity_1.Environment],
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EnvironmentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)('seed'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Seed default environments' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Default environments seeded successfully',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EnvironmentsController.prototype, "seedDefaults", null);
__decorate([
    (0, common_1.Get)('code/:code'),
    (0, swagger_1.ApiOperation)({ summary: 'Get environment by code' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Environment details',
        type: environment_entity_1.Environment,
    }),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EnvironmentsController.prototype, "findByCode", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get environment by ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Environment details',
        type: environment_entity_1.Environment,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Environment not found',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EnvironmentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new environment' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Environment created successfully',
        type: environment_entity_1.Environment,
    }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'Environment with this code already exists',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_environment_dto_1.CreateEnvironmentDto]),
    __metadata("design:returntype", Promise)
], EnvironmentsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update an environment' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Environment updated successfully',
        type: environment_entity_1.Environment,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Environment not found',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_environment_dto_1.UpdateEnvironmentDto]),
    __metadata("design:returntype", Promise)
], EnvironmentsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete an environment' }),
    (0, swagger_1.ApiResponse)({
        status: 204,
        description: 'Environment deleted successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Environment not found',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EnvironmentsController.prototype, "remove", null);
exports.EnvironmentsController = EnvironmentsController = __decorate([
    (0, swagger_1.ApiTags)('environments'),
    (0, common_1.Controller)('environments'),
    __metadata("design:paramtypes", [environments_service_1.EnvironmentsService])
], EnvironmentsController);
//# sourceMappingURL=environments.controller.js.map