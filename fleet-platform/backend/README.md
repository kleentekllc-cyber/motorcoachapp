# Fleet Backend

Express + TypeScript + Prisma + PostgreSQL

## Setup

1. Copy `.env.example` to `.env`
2. Set `DATABASE_URL` to your PostgreSQL connection string
3. Install dependencies: `npm install`
4. Generate Prisma client: `npx prisma generate`
5. Run migrations: `npx prisma migrate dev`
6. Start dev server: `npm run dev`

Backend runs on http://localhost:4000

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/trips` - List trips
- `GET /api/drivers` - List drivers
- `GET /api/vehicles` - List vehicles
- `GET /api/analytics` - Analytics dashboard
- `GET /api/executive/overview` - Executive overview

## Production Build

```bash
npm run build
npm start
```
