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
- `VITE_GEMINI_API_KEY`: Gemini API key (auto-configured via Replit AI Integrations)
- `VITE_GEMINI_BASE_URL`: Gemini API base URL (auto-configured via Replit AI Integrations)

## Running the App
- Development: `npm run dev` (runs on port 5000)
- Build: `npm run build`
- Preview: `npm run preview`

## Dependencies
- React 18 with TypeScript
- Vite 5 (build tool)
- @google/genai (Gemini AI)
- @supabase/supabase-js (Backend)
- Tailwind CSS (via CDN)

## Recent Changes
- 2025-12-27: Upgraded to Replit Gemini AI Integration
  - Integrated Replit's native Gemini AI service (no API key management needed)
  - Updated geminiService.ts to use gemini-2.5-flash (text) and gemini-2.5-flash-image (images)
  - Environment variables now auto-configured: VITE_GEMINI_API_KEY and VITE_GEMINI_BASE_URL
  - Backend integration modules available in .replit_integration_files/ for future server development
  - Previous: Used VITE_API_KEY with gemini-1.5-flash models
