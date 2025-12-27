# Aletheia App - Full Stack

## Overview
Aletheia is a mystical RPG-styled personal development application. Now with complete full-stack setup using React frontend, Express backend, and PostgreSQL database hosted on Replit.

## Architecture
- **Frontend**: React 18 + Vite + TypeScript on port 5000
- **Backend**: Node.js + Express + TypeScript on port 3001
- **Database**: Replit PostgreSQL with persistent storage
- **Authentication**: Secure password hashing with crypto (PBKDF2)

## Key Features
- User registration with username availability checking
- Secure password-based authentication
- Profile persistence in PostgreSQL
- User stats, inventory, and tasks tracked in database
- AI-powered advisor chat integration
- Post/feed system with resonance tracking
- Character progression and leaderboards

## Database Schema
- `profiles` table: User accounts with stats, inventory, tasks, manifesto
- `posts` table: Feed posts with resonance (likes) tracking

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login with username/password
- `GET /api/check-username` - Check username availability

### Profiles
- `GET /api/profile/:id` - Get user profile
- `POST /api/profile/:id/update` - Update user profile (stats, inventory, tasks, etc.)

### AI Integration
- `POST /api/ai/mysterious-name` - Generate random mystical name
- `POST /api/ai/quest` - Generate AI quests

## Running the Application

### Development
Both servers run automatically:
- Frontend: http://localhost:5000
- Backend: http://localhost:3001
- API proxy: Vite proxies /api requests to backend

### Building for Production
```bash
npm run build  # Creates optimized frontend bundle
npm run server # Runs production backend
```

## Environment Variables
Automatically configured by Replit:
- `DATABASE_URL` - PostgreSQL connection string
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`
- `VITE_API_KEY` - Google Gemini API key (optional)

## Data Persistence
All user data is persisted in the PostgreSQL database:
- User accounts and profiles
- Character stats and progression
- Inventory items and tasks
- Posts and social interactions
- Following relationships

Data survives application restarts and is backed by Replit's managed PostgreSQL.

## Recent Changes (2025-12-27)
- Migrated from Supabase to Replit PostgreSQL
- Created Express backend with authentication endpoints
- Implemented password hashing with crypto
- Set up Vite proxy for API requests
- Fixed account creation and database persistence
- All data now stored in local PostgreSQL database
