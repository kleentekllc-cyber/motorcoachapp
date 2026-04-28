import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  Driver,
  Vehicle,
  Trip,
  TripStop,
  TimelineSegment,
  DriverHours,
  PayStructure,
  BonusRule,
  DotSettings,
} from '../entities';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: configService.get<number>('DATABASE_PORT', 5432),
        username: configService.get('DATABASE_USER', 'postgres'),
        password: configService.get('DATABASE_PASSWORD', 'postgres'),
        database: configService.get('DATABASE_NAME', 'bus_dot_tracker'),
        entities: [
          Driver,
          Vehicle,
          Trip,
          TripStop,
          TimelineSegment,
          DriverHours,
          PayStructure,
          BonusRule,
          DotSettings,
        ],
        synchronize: configService.get('NODE_ENV') !== 'production', // Auto-create tables in dev
        logging: configService.get('NODE_ENV') === 'development',
      }),
    }),
  ],
})
export class DatabaseModule {}
