import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfitabilityController } from './profitability.controller';
import { ProfitabilityService } from './profitability.service';
import { Trip } from '../../entities/trip.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Trip])],
  controllers: [ProfitabilityController],
  providers: [ProfitabilityService],
  exports: [ProfitabilityService],
})
export class ProfitabilityModule {}
