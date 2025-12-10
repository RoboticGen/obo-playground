import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class CreateProjectsTable implements MigrationInterface {
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
