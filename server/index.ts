import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createUser, getUserByUsername, getUserById, verifyPassword } from './auth';
import { query } from './db';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const genAI = process.env.VITE_API_KEY ? new GoogleGenAI({ apiKey: process.env.VITE_API_KEY }) : null;

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Register
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { username, password, manifesto, stats, originStory } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const existing = await getUserByUsername(username);
    if (existing) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const user = await createUser(username, password);
    
    await query(
      `UPDATE profiles SET 
        manifesto = $1,
        origin_story = $2,
        stats = $3,
        display_name = $4,
        updated_at = NOW()
       WHERE id = $5`,
      [manifesto, originStory, JSON.stringify(stats), username, user.id]
    );

    res.json({ id: user.id, username: user.username });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = await getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const profile = await getUserById(user.id);
    res.json({
      id: user.id,
      username: user.username,
      displayName: profile.display_name || user.username,
      avatarUrl: profile.avatar_url,
      coverUrl: profile.cover_url,
      manifesto: profile.manifesto,
      originStory: profile.origin_story,
      stats: profile.stats,
      tasks: profile.tasks,
      inventory: profile.inventory,
      entropy: profile.entropy,
      following: profile.following
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get profile
app.get('/api/profile/:id', async (req: Request, res: Response) => {
  try {
    const profile = await getUserById(req.params.id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(profile);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update profile
app.post('/api/profile/:id/update', async (req: Request, res: Response) => {
  try {
    const { stats, tasks, inventory, entropy, following, avatarUrl, coverUrl } = req.body;
    
    await query(
      `UPDATE profiles SET 
        stats = COALESCE($1, stats),
        tasks = COALESCE($2, tasks),
        inventory = COALESCE($3, inventory),
        entropy = COALESCE($4, entropy),
        following = COALESCE($5, following),
        avatar_url = COALESCE($6, avatar_url),
        cover_url = COALESCE($7, cover_url),
        updated_at = NOW()
       WHERE id = $8`,
      [
        stats ? JSON.stringify(stats) : null,
        tasks ? JSON.stringify(tasks) : null,
        inventory ? JSON.stringify(inventory) : null,
        entropy,
        following ? following : null,
        avatarUrl,
        coverUrl,
        req.params.id
      ]
    );

    const profile = await getUserById(req.params.id);
    res.json(profile);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// AI Proxy
app.post('/api/ai/mysterious-name', async (req: Request, res: Response) => {
  if (!genAI) {
    return res.status(500).json({ error: 'AI not configured' });
  }
  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: "Generate a single mysterious RPG-style name.",
    });
    const name = response.text?.trim() || "Initiate";
    res.json({ name });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// AI Quest
app.post('/api/ai/quest', async (req: Request, res: Response) => {
  if (!genAI) return res.status(500).json({ error: 'AI not configured' });
  try {
    const { prompt } = req.body;
    const response = await genAI.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
    });
    const text = response.text || "";
    const jsonMatch = text.match(/\{.*\}/s);
    if (jsonMatch) {
      res.json(JSON.parse(jsonMatch[0]));
    } else {
      res.json({ text: "Master the void's silence", difficulty: "B" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

export default app;
