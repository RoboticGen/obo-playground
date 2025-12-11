import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateEnvironmentsTable1733920000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create environments table
    await queryRunner.createTable(
      new Table({
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
      }),
      true,
    );

    // Insert initial environment data
    await queryRunner.query(`
      INSERT INTO environments (environment_name, environment_code, environment_path, is_active) 
      VALUES 
        ('Unity 3D', 'unity', '/runtime/unity', true),
        ('Unreal Engine', 'unreal', '/runtime/unreal', true),
        ('Gazebo', 'gazebo', '/runtime/gazebo', true),
        ('Webots', 'webots', '/runtime/webots', true),
        ('PyBullet', 'pybullet', '/runtime/pybullet', true)
    `);

    // Drop old environment column from projects table
    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN IF EXISTS "environment"`);

    // Add environment_id column to projects table
    await queryRunner.query(`
      ALTER TABLE "projects" 
      ADD COLUMN "environment_id" INTEGER NOT NULL DEFAULT 1
    `);

    // Remove default after adding column
    await queryRunner.query(`ALTER TABLE "projects" ALTER COLUMN "environment_id" DROP DEFAULT`);

    // Create foreign key
    await queryRunner.createForeignKey(
      'projects',
      new TableForeignKey({
        columnNames: ['environment_id'],
        referencedColumnNames: ['environment_id'],
        referencedTableName: 'environments',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    const table = await queryRunner.getTable('projects');
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('environment_id') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('projects', foreignKey);
    }

    // Drop environment_id column
    await queryRunner.dropColumn('projects', 'environment_id');

    // Re-add old environment column
    await queryRunner.query(`
      ALTER TABLE "projects" 
      ADD COLUMN "environment" VARCHAR(50) NOT NULL DEFAULT 'unity'
    `);

    // Drop environments table
    await queryRunner.dropTable('environments');
  }
}
