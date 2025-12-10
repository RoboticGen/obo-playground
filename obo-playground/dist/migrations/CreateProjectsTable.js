"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateProjectsTable = void 0;
const typeorm_1 = require("typeorm");
class CreateProjectsTable {
    async up(queryRunner) {
        await queryRunner.createTable(new typeorm_1.Table({
            name: 'projects',
            columns: [
                {
                    name: 'project_id',
                    type: 'uuid',
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: 'uuid',
                    default: 'uuid_generate_v4()',
                },
                {
                    name: 'user_id',
                    type: 'uuid',
                    isNullable: false,
                },
                {
                    name: 'file_path',
                    type: 'varchar',
                    length: '500',
                    isNullable: false,
                },
                {
                    name: 'assignment_id',
                    type: 'varchar',
                    length: '255',
                    isNullable: true,
                },
                {
                    name: 'created_at',
                    type: 'timestamp',
                    default: 'CURRENT_TIMESTAMP',
                },
                {
                    name: 'updated_at',
                    type: 'timestamp',
                    default: 'CURRENT_TIMESTAMP',
                    onUpdate: 'CURRENT_TIMESTAMP',
                },
            ],
        }), true);
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    }
    async down(queryRunner) {
        await queryRunner.dropTable('projects');
    }
}
exports.CreateProjectsTable = CreateProjectsTable;
//# sourceMappingURL=CreateProjectsTable.js.map