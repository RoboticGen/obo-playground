"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddEnvironmentSceneConfig1734220000000 = void 0;
const typeorm_1 = require("typeorm");
class AddEnvironmentSceneConfig1734220000000 {
    async up(queryRunner) {
        await queryRunner.addColumn('environments', new typeorm_1.TableColumn({
            name: 'description',
            type: 'text',
            isNullable: true,
        }));
        await queryRunner.addColumn('environments', new typeorm_1.TableColumn({
            name: 'thumbnail',
            type: 'varchar',
            length: '500',
            isNullable: true,
        }));
        await queryRunner.addColumn('environments', new typeorm_1.TableColumn({
            name: 'scene_config',
            type: 'json',
            isNullable: true,
        }));
        await queryRunner.addColumn('environments', new typeorm_1.TableColumn({
            name: 'difficulty',
            type: 'varchar',
            length: '20',
            default: "'medium'",
            isNullable: false,
        }));
        await queryRunner.addColumn('environments', new typeorm_1.TableColumn({
            name: 'tags',
            type: 'text',
            isNullable: true,
        }));
    }
    async down(queryRunner) {
        await queryRunner.dropColumn('environments', 'tags');
        await queryRunner.dropColumn('environments', 'difficulty');
        await queryRunner.dropColumn('environments', 'scene_config');
        await queryRunner.dropColumn('environments', 'thumbnail');
        await queryRunner.dropColumn('environments', 'description');
    }
}
exports.AddEnvironmentSceneConfig1734220000000 = AddEnvironmentSceneConfig1734220000000;
//# sourceMappingURL=1734220000000-AddEnvironmentSceneConfig.js.map