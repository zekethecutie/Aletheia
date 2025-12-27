# Aletheia App - Full Stack

## Overview
Aletheia is a mystical RPG-styled personal development application. Full-stack architecture with React frontend, Express backend, and Supabase database.

## Project Structure
```
/
├── src/                   # React Frontend
│   ├── components/        # Reusable UI components
│   ├── services/          # External service integrations
│   ├── utils/             # Helper utilities
│   ├── views/             # Page views/screens
│   ├── App.tsx
│   ├── index.tsx
│   └── types.ts
├── server/                # Express Backend
│   ├── index.ts          # Main server file
│   └── tsconfig.json
├── supabase-schema.sql   # Database schema
├── vite.config.ts        # Frontend build config
├── package.json
└── replit.md
```

## Setup Instructions

### 1. Environment Variables
Create `.env` file in root (use `.env.example` as template):
```bash
VITE_API_KEY=your_free_gemini_api_key
PORT=3001
SUPABASE_URL=https://yjxqvwyudhvfkzkaixax.supabase.co
SUPABASE_ANON_KEY=sb_publishable_ZBnRdLQurXmLcAey93aBQg_au2EEvut
```

Get free Gemini API key at: https://ai.google.dev

### 2. Database Setup
Run the SQL from `supabase-schema.sql` in Supabase SQL Editor to create tables and enable RLS.

### 3. Running the App
```bash
# Frontend only (dev)
npm run dev

# Backend only
npm run server

# Both (requires concurrently)
npm run dev:full
```

## Stack
- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: Supabase (PostgreSQL) + RLS
- **AI**: Google Gemini (Free tier)
- **Authentication**: Supabase Auth

## API Endpoints

### Health
- `GET /api/health` - Server health check

### Supabase
- `GET /api/test-supabase` - Test database connection

## Features
- User authentication and profiles
- Real-time character stats and progression
- AI-powered advisor chat (Oracle, Strategist, Titan, Mystic)
- Mirror scenarios for decision-making
- Quest generation and tracking
- Post/feed system with resonance
- Artifact inventory system
- Leaderboards and hierarchy

## Development Notes
- Frontend runs on port 5000 (Vite)
- Backend runs on port 3001 (Express)
- CORS enabled for frontend-backend communication
- RLS policies ensure data privacy and security

## For APK Deployment
When building for mobile APK:
1. Build frontend: `npm run build`
2. Frontend assets ready in `dist/`
3. API available at backend URL for mobile app
4. Database handles all persistence via Supabase

## Recent Changes
- 2025-12-27: Full-stack setup
  - Created Express backend server
  - Added Supabase RLS policies and schema
  - Updated package.json with backend dependencies
  - Reverted to free Gemini API (VITE_API_KEY)
  - Fixed NavBar Hierarchy button navigation
