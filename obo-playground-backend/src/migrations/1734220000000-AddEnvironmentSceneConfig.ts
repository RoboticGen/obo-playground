import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddEnvironmentSceneConfig1734220000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add description column
    await queryRunner.addColumn(
      'environments',
      new TableColumn({
        name: 'description',
        type: 'text',
        isNullable: true,
      }),
    );

    // Add thumbnail column
    await queryRunner.addColumn(
      'environments',
      new TableColumn({
        name: 'thumbnail',
        type: 'varchar',
        length: '500',
        isNullable: true,
      }),
    );

    // Add scene_config column (JSON)
    await queryRunner.addColumn(
      'environments',
      new TableColumn({
        name: 'scene_config',
        type: 'json',
        isNullable: true,
      }),
    );

    // Add difficulty column
    await queryRunner.addColumn(
      'environments',
      new TableColumn({
        name: 'difficulty',
        type: 'varchar',
        length: '20',
        default: "'medium'",
        isNullable: false,
      }),
    );

    // Add tags column (simple array)
    await queryRunner.addColumn(
      'environments',
      new TableColumn({
        name: 'tags',
        type: 'text',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove columns in reverse order
    await queryRunner.dropColumn('environments', 'tags');
    await queryRunner.dropColumn('environments', 'difficulty');
    await queryRunner.dropColumn('environments', 'scene_config');
    await queryRunner.dropColumn('environments', 'thumbnail');
    await queryRunner.dropColumn('environments', 'description');
  }
}
