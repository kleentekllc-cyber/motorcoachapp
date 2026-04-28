# Fleet Operations Platform

AI-ready full-stack fleet management system with Next.js frontend, Express backend, and PostgreSQL.

## Architecture

- **Frontend**: Next.js 14 + TypeScript + React
- **Backend**: Node.js + Express + TypeScript + Prisma
- **Database**: PostgreSQL (Supabase in production, local in dev)
- **CI/CD**: GitHub Actions
- **Infrastructure**: Terraform (skeleton)
- **Hosting**: 
  - Frontend → Vercel
  - Backend → Render/Azure
  - Database → Supabase

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL (local or cloud)
- Git

### Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

Backend runs on http://localhost:4000

### Frontend Setup

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Frontend runs on http://localhost:3000

### Verify Setup

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`  
3. Visit http://localhost:3000/dashboard
4. Confirm health check from http://localhost:4000/api/health

## Project Structure

```
.
├── backend/              # Express API
│   ├── src/
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   └── config/      # Configuration
│   └── prisma/          # Database schema
├── frontend/            # Next.js app
│   ├── app/            # App router pages
│   ├── components/     # React components
│   └── lib/            # Utilities
└── infra/              # Infrastructure
    ├── terraform/      # IaC
    └── github/         # CI/CD
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/trips` - List trips
- `GET /api/drivers` - List drivers
- `GET /api/vehicles` - List vehicles
- `GET /api/analytics` - Analytics data
- `GET /api/executive/overview` - Executive dashboard

## Deployment

### Database (Supabase)

1. Create project at https://supabase.com
2. Copy connection string
3. Set as `DATABASE_URL` in production env

### Backend (Render)

1. Connect GitHub repo
2. Set build command: `npm run build`
3. Set start command: `npm start`
4. Add environment variables

### Frontend (Vercel)

1. Import Git repository
2. Vercel auto-detects Next.js
3. Add environment variables
4. Deploy

## Google Maps Integration

Set `GOOGLE_MAPS_API_KEY` in environment variables when ready to enable maps features.

## CI/CD

GitHub Actions automatically:
- Build backend on push to `backend/**`
- Build frontend on push to `frontend/**`
- Ready to add deployment steps

## Development

```bash
# Backend
cd backend
npm run dev

# Frontend  
cd frontend
npm run dev

# Database migrations
cd backend
npx prisma migrate dev --name description
```

## Production Deployment

### 1. Supabase (Database)
1. Create a new project at https://supabase.com
2. Get your credentials:
   - `SUPABASE_DB_URL` (Connection pooling → Transaction mode)
   - `SUPABASE_SERVICE_ROLE_KEY` (Settings → API → service_role key)
   - `SUPABASE_ANON_KEY` (Settings → API → anon key)
3. Run initial migrations:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

### 2. Render (Backend API)
1. Connect your GitHub repo to Render
2. Render will detect `render.yaml` and create "fleet-backend" service
3. In Render dashboard, set environment variables:
   - `NODE_ENV=production`
   - `SUPABASE_DB_URL=<from Supabase>`
   - `SUPABASE_SERVICE_ROLE_KEY=<from Supabase>`
   - `SUPABASE_ANON_KEY=<from Supabase>`
   - `FRONTEND_ORIGIN=https://your-app.vercel.app`
   - `GOOGLE_MAPS_API_KEY=<your key>`
4. Deploy and copy your backend URL (e.g., `https://fleet-backend.onrender.com`)

### 3. Vercel (Frontend)
1. Import GitHub repo to Vercel
2. Set **Root Directory** to `frontend`
3. Set environment variables in Vercel:
   - `NEXT_PUBLIC_API_BASE_URL=https://fleet-backend.onrender.com`
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<your key>`
4. Deploy and copy your frontend URL

### 4. Update CORS
1. Go back to Render dashboard
2. Update `FRONTEND_ORIGIN` to match your Vercel URL
3. Redeploy backend

### 5. Custom Domains (Optional)
- **Backend**: Add custom domain in Render (e.g., `api.yourdomain.com`)
- **Frontend**: Add custom domain in Vercel (e.g., `app.yourdomain.com`)
- Update `FRONTEND_ORIGIN` in Render accordingly

### 6. Verify Deployment
Test these endpoints:
- ✅ https://your-backend.onrender.com/api/health
- ✅ https://your-backend.onrender.com/api/analytics/fleet-health
- ✅ https://your-backend.onrender.com/api/analytics/depot-load
- ✅ https://your-backend.onrender.com/api/analytics/trip-profit
- ✅ https://your-frontend.vercel.app/analytics

### Auto-Deploy
- **Render**: Auto-deploys on push to `main` branch
- **Vercel**: Auto-deploys on push to `main` branch
- **CI**: GitHub Actions runs build checks before deployment

## License

Private - All rights reserved
