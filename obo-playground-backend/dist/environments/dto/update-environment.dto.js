"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateEnvironmentDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_environment_dto_1 = require("./create-environment.dto");
class UpdateEnvironmentDto extends (0, swagger_1.PartialType)(create_environment_dto_1.CreateEnvironmentDto) {
}
exports.UpdateEnvironmentDto = UpdateEnvironmentDto;
//# sourceMappingURL=update-environment.dto.js.map