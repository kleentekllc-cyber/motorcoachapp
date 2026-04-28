# Bus DOT Hours Tracker - Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying your Bus DOT Hours Tracker to production.

---

## Architecture

```
Frontend (Netlify/Vercel) → Backend (Render) → Database (Neon/Supabase)
```

---

## Phase 1: Database Deployment

### Option A: Neon (Recommended - Free Tier)

1. **Create Account**: https://neon.tech
2. **Create Project**: "bus-dot-tracker"
3. **Copy Connection String**:
   ```
   postgres://user:password@host.neon.tech/dbname?sslmode=require
   ```

### Option B: Supabase

1. **Create Account**: https://supabase.com
2. **Create Project**: "bus-dot-tracker"
3. **Go to Settings → Database**
4. **Copy Connection String** (Connection pooling)

---

## Phase 2: Backend Deployment (Render.com)

### Step 1: Prepare Repository

1. **Initialize Git** (if not already):
   ```bash
   cd C:\Users\owner\Desktop\bus-dot-tracker\backend
   git init
   git add .
   git commit -m "Initial commit - Bus DOT Hours Tracker Backend"
   ```

2. **Push to GitHub**:
   - Create new repo on GitHub: "bus-dot-tracker-backend"
   - Follow instructions to push

### Step 2: Deploy on Render

1. **Create Account**: https://render.com
2. **New Web Service**
3. **Connect Repository**: Select your GitHub repo
4. **Configuration**:
   ```
   Name: bus-dot-tracker-api
   Runtime: Node
   Build Command: npm install && npm run build
   Start Command: npm run start:prod
   ```

5. **Environment Variables** (Add in Render dashboard):
   ```
   DATABASE_URL=postgres://... (from Neon/Supabase)
   NODE_ENV=production
   PORT=3000
   ```

6. **Deploy**!

### Step 3: Run Migrations & Seed

After first deployment, use Render Shell:

```bash
npx prisma migrate deploy
npx prisma db seed
```

Or add to Build Command:
```bash
npm install && npm run build && npx prisma migrate deploy && npx prisma db seed
```

---

## Phase 3: Update CORS Configuration

Update `backend/src/main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // CORS Configuration for Production
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://your-app.netlify.app',
      'https://your-app.vercel.app'
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.setGlobalPrefix('api');
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 Backend running on port ${port}`);
}

bootstrap();
```

**Or use wildcard for testing** (less secure):
```typescript
app.enableCors({
  origin: '*',
  methods: 'GET,POST,PUT',
});
```

---

## Phase 4: Frontend Deployment

### Step 1: Update API Base URL

Edit `js/api.js`:

```javascript
// Change from:
const API_BASE = "http://localhost:3000/api";

// To:
const API_BASE = "https://bus-dot-tracker-api.onrender.com/api";
```

### Step 2: Deploy to Netlify

**Option A: Drag & Drop**
1. Go to https://app.netlify.com
2. Drag the `bus-dot-tracker` folder
3. Done!

**Option B: GitHub (Continuous Deployment)**
1. Push frontend code to GitHub repo
2. Connect to Netlify
3. Deploy settings:
   ```
   Build Command: (none)
   Publish Directory: /
   ```

### Step 3: Deploy to Vercel (Alternative)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   cd C:\Users\owner\Desktop\bus-dot-tracker
   vercel
   ```

3. **Follow prompts**

---

## Phase 5: Verification

### Test All Endpoints

```bash
# Drivers
curl https://YOUR-BACKEND-URL/api/drivers

# Vehicles
curl https://YOUR-BACKEND-URL/api/vehicles

# Trips
curl https://YOUR-BACKEND-URL/api/trips

# HOS Calculator
curl -X POST https://YOUR-BACKEND-URL/api/hos/calculate \
  -H "Content-Type: application/json" \
  -d '{"driver_id": 1, "trip_id": 1}'

# Timeline Generator
curl -X POST https://YOUR-BACKEND-URL/api/timeline/generate \
  -H "Content-Type: application/json" \
  -d '{"trip_id": 1}'

# Pay Calculator
curl -X POST https://YOUR-BACKEND-URL/api/pay/calculate \
  -H "Content-Type: application/json" \
  -d '{"driver_id": 1, "trip_id": 1, "revenue": 1800, "trip_type": "retail"}'
```

### Test Frontend

1. Open: `https://your-app.netlify.app`
2. Try all features:
   - Load trips list
   - Create new trip
   - Run HOS calculation
   - Generate timeline
   - Calculate pay

---

## Production Checklist

- [ ] ✅ **Database**: PostgreSQL on Neon/Supabase
- [ ] ✅ **Backend**: NestJS on Render
- [ ] ✅ **Environment Variables**: DATABASE_URL set
- [ ] ✅ **Migrations**: Deployed with `prisma migrate deploy`
- [ ] ✅ **Seed Data**: Database populated
- [ ] ✅ **CORS**: Configured for frontend domain
- [ ] ✅ **Frontend**: Deployed on Netlify/Vercel
- [ ] ✅ **API Base URL**: Updated in js/api.js
- [ ] ✅ **Health Check**: GET /api/drivers returns 200
- [ ] ✅ **HOS Engine**: Calculations working
- [ ] ✅ **Timeline Engine**: Generation working
- [ ] ✅ **Pay Engine**: Calculations working
- [ ] ✅ **SSL/HTTPS**: Enabled (automatic on all platforms)

---

## Environment Variables Reference

### Backend (.env or Render)

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Application
NODE_ENV="production"
PORT=3000

# Optional: JWT (future)
JWT_SECRET="your-secret-key"
```

### Frontend (js/api.js)

```javascript
const API_BASE = "https://YOUR-BACKEND-URL.onrender.com/api";
```

---

## Troubleshooting

### Backend Won't Start

**Check Render logs**:
- DATABASE_URL is set correctly
- Migrations ran successfully
- Build completed without errors

### CORS Errors

**Update main.ts**:
```typescript
app.enableCors({
  origin: ['https://your-frontend.netlify.app'],
  credentials: true,
});
```

### Database Connection Issues

**Verify**:
- Connection string includes `?sslmode=require`
- Database is active and not sleeping (Neon)
- Firewall rules allow connections

### Frontend Can't Reach Backend

**Check**:
- API_BASE URL is correct in js/api.js
- Backend is deployed and running
- CORS is configured
- Try in browser console: `await fetch('YOUR_API_URL/api/drivers')`

---

## Performance Optimization

### Backend

1. **Enable Caching**: Add Redis (future)
2. **Database Indexing**: Already configured in Prisma schema
3. **Connection Pooling**: Use connection poolers (Prisma automatically handles this)

### Frontend

1. **Minify Files**: Use build tools (future)
2. **CDN**: Netlify/Vercel handle this automatically
3. **Lazy Loading**: Load data on-demand (already doing this!)

---

## Security Best Practices

### Backend

- ✅ Environment variables for secrets
- ✅ CORS restrictions
- ✅ Input validation (DTOs)
- 🔜 Add authentication (JWT)
- 🔜 Rate limiting
- 🔜 Request logging

### Database

- ✅ SSL connections required
- ✅ Prepared statements (Prisma)
- ✅ Foreign key constraints
- 🔜 Regular backups (platform automatic)

---

## Monitoring

### Render

- **Dashboard**: View logs, metrics, deployments
- **Alerts**: Set up for downtime
- **Logs**: Real-time access to application logs

### Database

- **Neon Dashboard**: Connection stats, query performance
- **Supabase Dashboard**: Database size, active connections

### Frontend

- **Netlify Analytics**: Page views, bandwidth
- **Browser Console**: Monitor API calls (F12)

---

## Continuous Deployment

### Auto-Deploy on Git Push

**Render**: Enable in settings
**Netlify**: Automatic when connected to GitHub
**Vercel**: Automatic when connected to GitHub

---

## Cost Estimation

### Free Tier Limits

**Neon (Database)**:
- Free: 0.5GB storage, 10GB transfer/month
- Enough for: ~50,000 trips

**Render (Backend)**:
- Free: 750 hours/month (spins down after 15min idle)
- Good for: Development & testing

**Netlify/Vercel (Frontend)**:
- Free: 100GB bandwidth
- Plenty for: Production use

### Paid Options

**Scale up when you need**:
- Render: $7/month (always-on)
- Neon: $19/month (more storage)

---

## Next Steps

1. ✅ Deploy database (Neon/Supabase)
2. ✅ Deploy backend (Render)
3. ✅ Run migrations & seed
4. ✅ Update frontend with production API URL
5. ✅ Deploy frontend (Netlify/Vercel)
6. ✅ Test end-to-end
7. ✅ Monitor and optimize

**Your Bus DOT Hours Tracker is ready for the world!** 🚀
