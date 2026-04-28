import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with Prisma...');

  // -------------------------
  // DOT SETTINGS
  // -------------------------
  const existingSettings = await prisma.dOTSettings.findFirst();
  
  if (!existingSettings) {
    await prisma.dOTSettings.create({
      data: {
        company_name: 'BMU Transportation',
        hos_11_hour_limit_minutes: 660,
        hos_14_hour_limit_minutes: 840,
        hos_60_70_hour_limit_minutes: 4200,
        pre_trip_default_minutes: 15,
        post_trip_default_minutes: 15,
        break_duration_minutes: 30,
        break_required_after_minutes: 480,
        restart_hours_minutes: 2040,
      },
    });
    console.log('✅ DOT Settings seeded');
  }

  // -------------------------
  // BONUS RULES
  // -------------------------
  const existingBonuses = await prisma.bonusRule.count();
  
  if (existingBonuses === 0) {
    await prisma.bonusRule.createMany({
      data: [
        {
          type: 'deadhead',
          min_hours: 1,
          max_hours: 3,
          amount: 50,
          description: 'Deadhead bonus for 1-3 hours',
          active: true,
        },
        {
          type: 'deadhead',
          min_hours: 3,
          max_hours: 6,
          amount: 100,
          description: 'Deadhead bonus for 3-6 hours',
          active: true,
        },
        {
          type: 'deadhead',
          min_hours: 6,
          max_hours: 999,
          amount: 200,
          description: 'Deadhead bonus for 6+ hours',
          active: true,
        },
        {
          type: 'relay',
          min_hours: 0,
          max_hours: null,
          amount: 150,
          description: 'Relay bonus (flat rate)',
          active: true,
        },
      ],
    });
    console.log('✅ Bonus Rules seeded');
  }

  // -------------------------
  // DRIVERS
  // -------------------------
  const existingDrivers = await prisma.driver.count();
  
  if (existingDrivers === 0) {
    const drivers = await prisma.driver.createMany({
      data: [
        {
          name: 'John Carter',
          email: 'john@example.com',
          phone: '555-1111',
          status: 'off_duty',
          employment_type: 'full_time',
          license_number: 'CDL12345',
          active: true,
          hos_mode: '70_8',
        },
        {
          name: 'Maria Lopez',
          email: 'maria@example.com',
          phone: '555-2222',
          status: 'off_duty',
          employment_type: 'part_time',
          license_number: 'CDL67890',
          active: true,
          hos_mode: '60_7',
        },
      ],
    });
    console.log('✅ Drivers seeded');
  }

  // -------------------------
  // VEHICLES
  // -------------------------
  const existingVehicles = await prisma.vehicle.count();
  
  if (existingVehicles === 0) {
    await prisma.vehicle.createMany({
      data: [
        {
          name: 'Coach 101',
          type: 'motorcoach',
          capacity: 56,
          plate_number: 'ABC-101',
          make_model: 'Prevost H3-45',
          year: 2024,
          wheelchair_accessible: false,
          luggage_bays: 8,
          current_mileage: 0,
          active: true,
        },
        {
          name: 'Coach 202',
          type: 'motorcoach',
          capacity: 56,
          plate_number: 'ABC-202',
          make_model: 'Prevost H3-45',
          year: 2023,
          wheelchair_accessible: true,
          luggage_bays: 8,
          current_mileage: 15000,
          active: true,
        },
      ],
    });
    console.log('✅ Vehicles seeded');
  }

  // -------------------------
  // PAY STRUCTURES
  // -------------------------
  const existingPayStructures = await prisma.payStructure.count();
  
  if (existingPayStructures === 0) {
    await prisma.payStructure.createMany({
      data: [
        {
          driver_id: 1,
          employment_type: 'full_time',
          vehicle_type: 'motorcoach',
          base_percent: 20,
          gratuity_percent: 10,
          safety_bonus_percent: 2,
          weekly_salary: 1200,
          active: true,
        },
        {
          driver_id: 2,
          employment_type: 'part_time',
          vehicle_type: 'motorcoach',
          base_percent: 25,
          gratuity_percent: 10,
          safety_bonus_percent: 0,
          weekly_salary: null,
          active: true,
        },
      ],
    });
    console.log('✅ Pay Structures seeded');
  }

  // -------------------------
  // SAMPLE TRIP
  // -------------------------
  const existingTrips = await prisma.trip.count();
  
  if (existingTrips === 0) {
    await prisma.trip.create({
      data: {
        passenger_name: 'Charleston Riverdogs Group',
        group_size: 40,
        pickup_location: 'Moncks Corner, SC',
        dropoff_location: 'Charleston Stadium',
        pickup_time: new Date('2026-04-05T09:00:00Z'),
        estimated_mileage: 35,
        average_speed: 45,
        pre_trip_minutes: 15,
        post_trip_minutes: 15,
        dump_fuel_clean_minutes: 10,
        deadhead_miles: 20,
        relay_required: false,
        hotel_reset_required: false,
        status: 'scheduled',
        driver_id: 1,
        vehicle_id: 1,
      },
    });
    console.log('✅ Sample Trip seeded');
  }

  console.log('🎉 Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
