import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Environment } from '../entities/environment.entity';

@Injectable()
export class EnvironmentsService {
  private readonly logger = new Logger(EnvironmentsService.name);

  constructor(
    @InjectRepository(Environment)
    private readonly environmentRepository: Repository<Environment>,
  ) {}

  async findAll(): Promise<Environment[]> {
    this.logger.log('Fetching all environments');
    return await this.environmentRepository.find({
      where: { is_active: true },
      order: { environment_id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Environment | null> {
    this.logger.log(`Fetching environment with ID: ${id}`);
    return await this.environmentRepository.findOne({
      where: { environment_id: id },
    });
  }
}
