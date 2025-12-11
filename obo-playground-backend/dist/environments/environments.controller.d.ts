import { EnvironmentsService } from './environments.service';
import { Environment } from '../entities/environment.entity';
export declare class EnvironmentsController {
    private readonly environmentsService;
    constructor(environmentsService: EnvironmentsService);
    findAll(): Promise<Environment[]>;
    findOne(id: string): Promise<Environment | null>;
}
