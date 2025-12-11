"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddProjectNameAndEnvironment1733892000000 = void 0;
const typeorm_1 = require("typeorm");
class AddProjectNameAndEnvironment1733892000000 {
    async up(queryRunner) {
        await queryRunner.addColumn('projects', new typeorm_1.TableColumn({
            name: 'project_name',
            type: 'varchar',
            length: '255',
            isNullable: false,
            default: "'Untitled Project'",
        }));
        await queryRunner.addColumn('projects', new typeorm_1.TableColumn({
            name: 'environment',
            type: 'varchar',
            length: '50',
            isNullable: false,
            default: "'unity'",
        }));
        await queryRunner.query(`ALTER TABLE "projects" ALTER COLUMN "project_name" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "projects" ALTER COLUMN "environment" DROP DEFAULT`);
    }
    async down(queryRunner) {
        await queryRunner.dropColumn('projects', 'environment');
        await queryRunner.dropColumn('projects', 'project_name');
    }
}
exports.AddProjectNameAndEnvironment1733892000000 = AddProjectNameAndEnvironment1733892000000;
//# sourceMappingURL=1733892000000-AddProjectNameAndEnvironment.js.map