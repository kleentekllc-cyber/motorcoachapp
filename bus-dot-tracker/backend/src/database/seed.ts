import { DataSource } from 'typeorm';
import { Driver, Vehicle, BonusRule, DotSettings } from '../entities';

export async function seedDatabase(dataSource: DataSource) {
  console.log('🌱 Seeding database...');

  // Seed DOT Settings
  const settingsRepo = dataSource.getRepository(DotSettings);
  const existingSettings = await settingsRepo.findOne({ where: { id: 1 } });
  
  if (!existingSettings) {
    await settingsRepo.save({
      company_name: 'Bus Company',
      hos_11_hour_limit_minutes: 660,
      hos_14_hour_limit_minutes: 840,
      hos_60_70_hour_limit_minutes: 4200,
      pre_trip_default_minutes: 15,
      post_trip_default_minutes: 15,
      break_duration_minutes: 30,
      break_required_after_minutes: 480,
      restart_hours_minutes: 2040,
    });
    console.log('✅ DOT Settings seeded');
  }

  // Seed Bonus Rules
  const bonusRepo = dataSource.getRepository(BonusRule);
  const existingBonuses = await bonusRepo.count();
  
  if (existingBonuses === 0) {
    await bonusRepo.save([
      {
        type: 'deadhead',
        min_hours: 0,
        max_hours: 4,
        amount: 100,
        description: 'Deadhead bonus for trips under 4 hours',
        active: true,
      },
      {
        type: 'deadhead',
        min_hours: 4,
        max_hours: 8,
        amount: 200,
        description: 'Deadhead bonus for trips 4-8 hours',
        active: true,
      },
      {
        type: 'deadhead',
        min_hours: 8,
        max_hours: 999,
        amount: 300,
        description: 'Deadhead bonus for trips over 9 hours',
        active: true,
      },
      {
        type: 'relay',
        min_hours: 0,
        max_hours: 6,
        amount: 200,
        description: 'Relay bonus for trips under 6 hours',
        active: true,
      },
      {
        type: 'relay',
        min_hours: 6,
        max_hours: 999,
        amount: 325,
        description: 'Relay bonus for trips over 6 hours',
        active: true,
      },
    ]);
    console.log('✅ Bonus Rules seeded');
  }

  // Seed Default Driver
  const driverRepo = dataSource.getRepository(Driver);
  const existingDrivers = await driverRepo.count();
  
  if (existingDrivers === 0) {
    await driverRepo.save({
      name: 'Default Driver',
      email: 'driver@example.com',
      phone: '555-0100',
      status: 'off_duty',
      employment_type: 'full_time',
      license_number: 'CDL-001',
      active: true,
      hos_mode: '70_8',
    });
    console.log('✅ Default Driver seeded');
  }

  // Seed Default Vehicle
  const vehicleRepo = dataSource.getRepository(Vehicle);
  const existingVehicles = await vehicleRepo.count();
  
  if (existingVehicles === 0) {
    await vehicleRepo.save({
      name: 'Bus #001',
      type: 'motorcoach',
      capacity: 55,
      plate_number: 'BUS-001',
      make_model: 'Prevost H3-45',
      year: 2024,
      wheelchair_accessible: false,
      luggage_bays: 8,
      current_mileage: 0,
      active: true,
    });
    console.log('✅ Default Vehicle seeded');
  }

  console.log('🎉 Database seeding complete!');
}
