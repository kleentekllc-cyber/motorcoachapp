import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from '../../entities/trip.entity';
import { DriverHours } from '../../entities/driver-hours.entity';
import { HosController } from './hos.controller';
import { HosService } from './hos.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trip, DriverHours]),
    SettingsModule,
  ],
  controllers: [HosController],
  providers: [HosService],
  exports: [HosService],
})
export class HosModule {}
