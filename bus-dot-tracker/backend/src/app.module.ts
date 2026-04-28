import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { TripsModule } from './modules/trips/trips.module';
import { HosModule } from './modules/hos/hos.module';
import { PayModule } from './modules/pay/pay.module';
import { TimelineModule } from './modules/timeline/timeline.module';
import { SettingsModule } from './modules/settings/settings.module';
import { ProfitabilityModule } from './modules/profitability/profitability.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    DriversModule,
    VehiclesModule,
    TripsModule,
    HosModule,
    PayModule,
    TimelineModule,
    SettingsModule,
    ProfitabilityModule,
  ],
})
export class AppModule {}
