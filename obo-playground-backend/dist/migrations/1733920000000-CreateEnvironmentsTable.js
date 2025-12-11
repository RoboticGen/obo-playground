"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateEnvironmentsTable1733920000000 = void 0;
const typeorm_1 = require("typeorm");
class CreateEnvironmentsTable1733920000000 {
    async up(queryRunner) {
        await queryRunner.createTable(new typeorm_1.Table({
            name: 'environments',
            columns: [
                {
                    name: 'environment_id',
                    type: 'serial',
                    isPrimary: true,
                },
                {
                    name: 'environment_name',
                    type: 'varchar',
                    length: '100',
                    isUnique: true,
                    isNullable: false,
                },
                {
                    name: 'environment_code',
                    type: 'varchar',
                    length: '50',
                    isUnique: true,
                    isNullable: false,
                },
                {
                    name: 'environment_path',
                    type: 'varchar',
                    length: '500',
                    isNullable: false,
                },
                {
                    name: 'is_active',
                    type: 'boolean',
                    default: true,
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
                },
            ],
        }), true);
        await queryRunner.query(`
      INSERT INTO environments (environment_name, environment_code, environment_path, is_active) 
      VALUES 
        ('Unity 3D', 'unity', '/runtime/unity', true),
        ('Unreal Engine', 'unreal', '/runtime/unreal', true),
        ('Gazebo', 'gazebo', '/runtime/gazebo', true),
        ('Webots', 'webots', '/runtime/webots', true),
        ('PyBullet', 'pybullet', '/runtime/pybullet', true)
    `);
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN IF EXISTS "environment"`);
        await queryRunner.query(`
      ALTER TABLE "projects" 
      ADD COLUMN "environment_id" INTEGER NOT NULL DEFAULT 1
    `);
        await queryRunner.query(`ALTER TABLE "projects" ALTER COLUMN "environment_id" DROP DEFAULT`);
        await queryRunner.createForeignKey('projects', new typeorm_1.TableForeignKey({
            columnNames: ['environment_id'],
            referencedColumnNames: ['environment_id'],
            referencedTableName: 'environments',
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE',
        }));
    }
    async down(queryRunner) {
        const table = await queryRunner.getTable('projects');
        const foreignKey = table?.foreignKeys.find((fk) => fk.columnNames.indexOf('environment_id') !== -1);
        if (foreignKey) {
            await queryRunner.dropForeignKey('projects', foreignKey);
        }
        await queryRunner.dropColumn('projects', 'environment_id');
        await queryRunner.query(`
      ALTER TABLE "projects" 
      ADD COLUMN "environment" VARCHAR(50) NOT NULL DEFAULT 'unity'
    `);
        await queryRunner.dropTable('environments');
    }
}
exports.CreateEnvironmentsTable1733920000000 = CreateEnvironmentsTable1733920000000;
//# sourceMappingURL=1733920000000-CreateEnvironmentsTable.js.map