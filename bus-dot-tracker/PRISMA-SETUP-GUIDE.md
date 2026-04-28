# 🎯 Bus DOT Tracker - Prisma Setup Guide

## ✅ What's Been Set Up

You now have a **complete Prisma-based backend** ready to deploy!

### Files Created:
- ✅ `prisma/schema.prisma` - Complete database schema (9 models)
- ✅ `prisma/seed.ts` - Seed script with default data
- ✅ `src/prisma/prisma.service.ts` - Prisma service for NestJS
- ✅ `src/prisma/prisma.module.ts` - Global Prisma module
- ✅ `.env` - Database connection string
- ✅ `package.json` - Updated with Prisma dependencies

---

## 🚀 Quick Start Steps

### 1. Install Dependencies
```bash
cd C:\Users\owner\Desktop\bus-dot-tracker\backend
npm install
```

### 2. Configure Database Connection

Edit `.env` file and update your PostgreSQL credentials:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/bus_dot_tracker?schema=public"
PORT=3000
NODE_ENV=development
```

### 3. Create PostgreSQL Database
```sql
CREATE DATABASE bus_dot_tracker;
```

### 4. Generate Prisma Client
```bash
npm run prisma:generate
```

This generates the type-safe Prisma Client based on your schema.

### 5. Run Database Migration
```bash
npm run prisma:migrate
```

This will:
- Create all 9 tables in your database
- Apply the complete schema
- Prompt you for a migration name (e.g., "init")

### 6. Seed the Database (Optional)
```bash
npm run prisma:seed
```

This adds:
- Default DOT settings
- Bonus rules (deadhead and relay)
- Sample driver
- Sample vehicle

### 7. Start the Backend Server
```bash
npm run start:dev
```

API will be available at: `http://localhost:3000`

---

## 📊 Prisma Schema Overview

### 9 Database Models:

1. **Driver** - Driver information
   - name, email, phone, license_number
   - status, employment_type, hos_mode
   - Relations: trips, hours, payStructure

2. **Vehicle** - Fleet vehicles
   - name, type, capacity, plate_number
   - make_model, year, wheelchair_accessible
   - Relations: trips

3. **Trip** - Trip records
   - passenger info, locations, times
   - mileage, speed, relay/hotel flags
   - Relations: driver, vehicle, stops, segments

4. **TripStop** - Individual stops in a trip
   - name, sequence, duration
   - Relations: trip

5. **TimelineSegment** - Calculated timeline
   - type, start/end times, duration
   - dot_status, description
   - Relations: trip

6. **DriverHours** - Daily hours tracking
   - on_duty, driving, off_duty minutes
   - cycle_type, total_cycle_minutes
   - Relations: driver

7. **PayStructure** - Driver pay configuration
   - base/gratuity/safety percentages
   - weekly_salary, flat rates
   - Relations: driver

8. **BonusRule** - Deadhead and relay bonuses
   - type, min/max hours, amount
   - description, active flag

9. **DotSettings** - DOT regulation settings
   - 11/14 hour limits
   - 60/70 hour weekly limits
   - break requirements

---

## 🛠️ Prisma Commands

### Development:
```bash
# Generate Prisma Client (after schema changes)
npm run prisma:generate

# Create and apply migration
npm run prisma:migrate

# Open Prisma Studio (GUI database browser)
npm run prisma:studio

# Seed database with default data
npm run prisma:seed

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Viewing Data:
```bash
# Open Prisma Studio to view/edit data
npm run prisma:studio
```
This opens a web interface at `http://localhost:5555`

---

## 🔧 Using Prisma in Services

The `PrismaService` is globally available in all modules. Here's how to use it:

### Example: Drivers Service
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DriversService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return await this.prisma.driver.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    return await this.prisma.driver.findUnique({
      where: { id },
      include: {
        trips: true,
        hours: true,
        payStructure: true,
      },
    });
  }

  async create(data: any) {
    return await this.prisma.driver.create({
      data,
    });
  }

  async update(id: number, data: any) {
    return await this.prisma.driver.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    return await this.prisma.driver.update({
      where: { id },
      data: { active: false },
    });
  }
}
```

---

## 📝 Database URL Format

### PostgreSQL:
```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA"
```

### Examples:
```
# Local development
DATABASE_URL="postgresql://postgres:password@localhost:5432/bus_dot_tracker?schema=public"

# Heroku
DATABASE_URL="postgres://user:pass@host.compute.amazonaws.com:5432/database"

# Digital Ocean
DATABASE_URL="postgresql://user:password@db-postgresql-nyc3-12345.ondigitalocean.com:25060/defaultdb?sslmode=require"
```

---

## 🎯 Migration Workflow

### Creating Migrations:
```bash
# 1. Edit prisma/schema.prisma
# 2. Create migration
npm run prisma:migrate

# 3. Name your migration (e.g., "add_user_table")
# 4. Prisma generates SQL and applies it
```

### Viewing Migrations:
Migrations are stored in `prisma/migrations/` folder

### Reset and Reseed:
```bash
# WARNING: Deletes all data!
npx prisma migrate reset

# Re-seed
npm run prisma:seed
```

---

## 🔍 Benefits of Prisma

### Type Safety:
```typescript
// Prisma Client is fully typed!
const driver = await prisma.driver.findUnique({ where: { id: 1 } });
driver.name  // ✅ TypeScript knows this is a string
driver.trips // ✅ Auto-complete for relations
```

### Intuitive API:
```typescript
// Simple, readable queries
const trips = await prisma.trip.findMany({
  where: {
    driver_id: 1,
    status: 'scheduled',
    pickup_time: {
      gte: new Date('2026-04-01'),
      lte: new Date('2026-04-30'),
    },
  },
  include: {
    driver: true,
    vehicle: true,
    segments: true,
  },
  orderBy: {
    pickup_time: 'asc',
  },
});
```

### Prisma Studio:
Visual database browser - see and edit data in a GUI!

---

## 📚 Next Steps After Setup

### 1. Test Basic Queries
```bash
# Open Prisma Studio
npm run prisma:studio

# Verify tables exist
# Check seed data is present
```

### 2. Test API Endpoints
Using Postman or curl:
```bash
# Get all drivers
curl http://localhost:3000/api/drivers

# Create a driver
curl -X POST http://localhost:3000/api/drivers \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Smith","email":"jane@example.com"}'
```

### 3. Update Services to Use Prisma
The existing services need to be updated from TypeORM to Prisma Client.

---

## 🎓 Learning Resources

- **Prisma Docs**: https://www.prisma.io/docs
- **NestJS + Prisma**: https://docs.nestjs.com/recipes/prisma
- **Prisma Schema Reference**: https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference

---

## ✨ Summary

**Prisma Setup is Complete!**  

You have:
✅ Complete schema with 9 models  
✅ Type-safe database client  
✅ Seed scripts ready  
✅ Migration system configured  
✅ NestJS integration ready  

**Run these commands to get started:**
```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run start:dev
```

Then open `http://localhost:3000` to access your API! 🎉
