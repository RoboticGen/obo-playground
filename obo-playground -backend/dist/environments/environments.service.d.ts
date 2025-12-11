import { Repository } from 'typeorm';
import { Environment } from '../entities/environment.entity';
export declare class EnvironmentsService {
    private readonly environmentRepository;
    private readonly logger;
    constructor(environmentRepository: Repository<Environment>);
    findAll(): Promise<Environment[]>;
    findOne(id: number): Promise<Environment | null>;
}
