import { Repository } from 'typeorm';
import { Environment } from '../entities/environment.entity';
import { CreateEnvironmentDto } from './dto/create-environment.dto';
import { UpdateEnvironmentDto } from './dto/update-environment.dto';
export declare class EnvironmentsService {
    private readonly environmentRepository;
    private readonly logger;
    constructor(environmentRepository: Repository<Environment>);
    findAll(): Promise<Environment[]>;
    findOne(id: number): Promise<Environment>;
    findByCode(code: string): Promise<Environment>;
    create(createEnvironmentDto: CreateEnvironmentDto): Promise<Environment>;
    update(id: number, updateEnvironmentDto: UpdateEnvironmentDto): Promise<Environment>;
    remove(id: number): Promise<void>;
    seedDefaultEnvironments(): Promise<void>;
}
