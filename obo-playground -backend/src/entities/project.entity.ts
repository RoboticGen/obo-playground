import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  project_id: string;

  @Column('uuid')
  user_id: string;

  @Column({ type: 'varchar', length: 500 })
  file_path: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  assignment_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
