import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayStructure } from '../../entities/pay-structure.entity';
import { BonusRule } from '../../entities/bonus-rule.entity';
import { Trip } from '../../entities/trip.entity';
import { PayController } from './pay.controller';
import { PayService } from './pay.service';

@Module({
  imports: [TypeOrmModule.forFeature([PayStructure, BonusRule, Trip])],
  controllers: [PayController],
  providers: [PayService],
  exports: [PayService],
})
export class PayModule {}
