# Aletheia App

## Overview
Aletheia is a mystical RPG-styled personal development application built with React, Vite, and TypeScript. It uses Supabase for backend services and Google Gemini AI for generating personalized content.

## Project Structure
```
/
├── components/         # Reusable UI components
│   ├── modals/        # Modal dialogs
│   ├── Header.tsx
│   ├── Icons.tsx
│   └── NavBar.tsx
├── services/          # External service integrations
│   ├── geminiService.ts    # Google Gemini AI integration
│   └── supabaseClient.ts   # Supabase client
├── utils/             # Helper utilities
├── views/             # Page views/screens
├── App.tsx            # Main app component
├── index.tsx          # Entry point
├── index.html         # HTML template
├── types.ts           # TypeScript type definitions
├── vite.config.ts     # Vite configuration
└── tsconfig.json      # TypeScript configuration
```

## Environment Variables
- `VITE_API_KEY`: Google Gemini API key (required for AI features) - Get free at: https://ai.google.dev

## Running the App
- Development: `npm run dev` (runs on port 5000)
- Build: `npm run build`
- Preview: `npm run preview`

## Dependencies
- React 18 with TypeScript
- Vite 5 (build tool)
- @google/genai (Gemini AI) - Free tier available
- @supabase/supabase-js (Backend)
- Tailwind CSS (via CDN)

## Recent Changes
- 2025-12-27: Reverted to free Gemini API, fixed nav bar
  - Using free Google Gemini API (VITE_API_KEY)
  - Fixed Hierarchy button to show System/Leaderboard view instead of Explore
  - Ready for full-stack development for APK
