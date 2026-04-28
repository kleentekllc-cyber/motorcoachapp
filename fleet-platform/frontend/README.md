# Fleet Frontend

Next.js + TypeScript + React

## Setup

1. Copy `.env.local.example` to `.env.local`
2. Set `NEXT_PUBLIC_API_BASE_URL` to your backend URL (default: http://localhost:4000)
3. Install dependencies: `npm install`
4. Start dev server: `npm run dev`

Frontend runs on http://localhost:3000

## Pages

- `/` - Home
- `/dashboard` - Main dashboard
- `/trips` - Trips management
- `/drivers` - Drivers management
- `/vehicles` - Vehicles management
- `/executive` - Executive overview

## Production Build

```bash
npm run build
npm start
```
