import { EnvironmentsService } from './environments.service';
import { Environment } from '../entities/environment.entity';
import { CreateEnvironmentDto } from './dto/create-environment.dto';
import { UpdateEnvironmentDto } from './dto/update-environment.dto';
export declare class EnvironmentsController {
    private readonly environmentsService;
    constructor(environmentsService: EnvironmentsService);
    findAll(): Promise<Environment[]>;
    seedDefaults(): Promise<{
        message: string;
    }>;
    findByCode(code: string): Promise<Environment>;
    findOne(id: string): Promise<Environment>;
    create(createEnvironmentDto: CreateEnvironmentDto): Promise<Environment>;
    update(id: string, updateEnvironmentDto: UpdateEnvironmentDto): Promise<Environment>;
    remove(id: string): Promise<void>;
}
