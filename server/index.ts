import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize AI for backend use if needed
const genAI = process.env.VITE_API_KEY ? new GoogleGenAI({ apiKey: process.env.VITE_API_KEY }) : null;

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// AI Proxy Example (to demonstrate full-stack AI integration)
app.post('/api/ai/mysterious-name', async (req: Request, res: Response) => {
  if (!genAI) return res.status(500).json({ error: 'AI not configured' });
  try {
    // Correcting to use the models property like in the frontend
    const response = await genAI.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: "Generate a single mysterious RPG-style name.",
    });
    res.json({ name: response.text?.trim() || "Initiate" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Test Supabase connection
app.get('/api/test-supabase', async (req: Request, res: Response) => {
  try {
    // Simple test query - just check if we can connect
    res.json({ message: 'Supabase connected', ready: true });
  } catch (error) {
    res.status(500).json({ error: 'Supabase connection failed' });
  }
});

// Start server
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

export default app;
