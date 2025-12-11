import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddProjectNameAndEnvironment1733892000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add project_name column
    await queryRunner.addColumn(
      'projects',
      new TableColumn({
        name: 'project_name',
        type: 'varchar',
        length: '255',
        isNullable: false,
        default: "'Untitled Project'",
      }),
    );

    // Add environment column
    await queryRunner.addColumn(
      'projects',
      new TableColumn({
        name: 'environment',
        type: 'varchar',
        length: '50',
        isNullable: false,
        default: "'unity'",
      }),
    );

    // Remove defaults after adding columns
    await queryRunner.query(`ALTER TABLE "projects" ALTER COLUMN "project_name" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "projects" ALTER COLUMN "environment" DROP DEFAULT`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('projects', 'environment');
    await queryRunner.dropColumn('projects', 'project_name');
  }
}
