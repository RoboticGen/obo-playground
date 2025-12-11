import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnvironmentsController } from './environments.controller';
import { EnvironmentsService } from './environments.service';
import { Environment } from '../entities/environment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Environment])],
  controllers: [EnvironmentsController],
  providers: [EnvironmentsService],
  exports: [EnvironmentsService],
})
export class EnvironmentsModule {}
