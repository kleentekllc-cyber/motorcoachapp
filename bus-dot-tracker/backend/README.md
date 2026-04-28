# Bus DOT Hours Tracker - Backend API

NestJS backend API for the Bus DOT Hours Tracker application.

## Prerequisites

- Node.js 20.11 or higher
- PostgreSQL 12 or higher
- npm or yarn

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Database

Create a PostgreSQL database:

```sql
CREATE DATABASE bus_dot_tracker;
```

Update `.env` file with your database credentials:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=bus_dot_tracker
PORT=3000
```

### 3. Start the Development Server

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`

### 4. Database Auto-Migration

In development mode, TypeORM will automatically create all tables based on the entities.

## API Endpoints

### Drivers
- `GET /api/drivers` - Get all drivers
- `GET /api/drivers/:id` - Get driver by ID
- `POST /api/drivers` - Create new driver
- `PATCH /api/drivers/:id` - Update driver
- `DELETE /api/drivers/:id` - Soft delete driver

### Vehicles
- `GET /api/vehicles` - Get all vehicles
- `GET /api/vehicles/:id` - Get vehicle by ID
- `POST /api/vehicles` - Create new vehicle
- `PATCH /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Soft delete vehicle

### Trips
- `GET /api/trips` - Get all trips (supports query params: driver_id, vehicle_id, status, legality_status, start_date, end_date)
- `GET /api/trips/:id` - Get trip by ID
- `POST /api/trips` - Create new trip
- `PATCH /api/trips/:id` - Update trip
- `DELETE /api/trips/:id` - Delete trip

### HOS (Hours of Service)
- `POST /api/hos/calculate` - Calculate HOS compliance for a trip

### Timeline
- `POST /api/timeline/generate` - Generate timeline segments for a trip
- `POST /api/timeline/save` - Save timeline segments to database

### Pay
- `POST /api/pay/calculate` - Calculate driver pay for a trip
- `GET /api/pay/structures` - Get all pay structures
- `GET /api/pay/bonus-rules` - Get bonus rules

### Settings
- `GET /api/settings/dot` - Get DOT settings
- `PUT /api/settings/dot` - Update DOT settings

## Database Schema

### Tables
- `drivers` - Driver information and status
- `vehicles` - Fleet vehicles
- `trips` - Trip records with pickup/dropoff details
- `trip_stops` - Individual stops within a trip
- `timeline_segments` - Calculated timeline breakdown
- `driver_hours` - Daily hours tracking
- `pay_structures` - Pay rate configurations
- `bonus_rules` - Deadhead and relay bonus rules
- `dot_settings` - DOT regulation settings

## Development Commands

```bash
# Start in development mode (auto-reload)
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod

# Run tests
npm run test

# Lint code
npm run lint
```

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Change `synchronize: false` in database config
3. Run migrations manually
4. Use a proper secret for `JWT_SECRET`
5. Configure proper CORS origins

## Architecture

```
backend/
├── src/
│   ├── entities/          # TypeORM entities (database models)
│   ├── modules/
│   │   ├── drivers/       # Driver CRUD
│   │   ├── vehicles/      # Vehicle CRUD
│   │   ├── trips/         # Trip CRUD
│   │   ├── hos/           # HOS calculation engine
│   │   ├── timeline/      # Timeline generation
│   │   ├── pay/           # Pay calculation
│   │   └── settings/      # DOT settings
│   ├── database/          # Database configuration
│   ├── app.module.ts      # Main app module
│   └── main.ts            # Application entry point
├── .env                   # Environment configuration
└── package.json
```

## API Response Examples

### HOS Calculate Response
```json
{
  "status": "LEGAL",
  "legality_status": "legal",
  "driving_hours": 8.5,
  "on_duty_hours": 9.0,
  "remaining_driving": 1.5,
  "remaining_duty": 6.0,
  "remaining_weekly": 61.0,
  "break_required": true,
  "violations": [],
  "recommendations": [
    {
      "type": "BREAK",
      "priority": "INFO",
      "message": "30-minute break required after 8 hours",
      "solution": "break"
    }
  ]
}
```

### Pay Calculate Response
```json
{
  "driver_type": "full_time",
  "weekly_salary": 400,
  "base_pay": 240.00,
  "gratuity": 0,
  "safety_bonus": 80.00,
  "deadhead_bonus": 100.00,
  "relay_bonus": 0,
  "trip_share": 320.00,
  "total_pay": 420.00,
  "breakdown": [
    { "label": "Base Pay (12%)", "amount": 240 },
    { "label": "Safety Bonus (4%)", "amount": 80 },
    { "label": "Deadhead Bonus", "amount": 100 }
  ]
}
```

## Support

For issues or questions, please open an issue in the repository.
