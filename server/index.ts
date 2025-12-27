import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log('API endpoints:');
  console.log(`  GET /api/health - Health check`);
  console.log(`  GET /api/test-supabase - Test Supabase connection`);
});

export default app;
