import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createUser, getUserByUsername, getUserById, verifyPassword } from './auth';
import { query, initializeDatabase } from './db';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize database on startup
initializeDatabase().catch(console.error);

// Replit Gemini AI Integration
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
console.log('AI Configured:', geminiApiKey ? 'YES' : 'NO');

// Use the Replit integration if GEMINI_API_KEY is not set but AI_INTEGRATIONS_GEMINI_API_KEY might be
const effectiveApiKey = geminiApiKey || process.env.AI_INTEGRATIONS_GEMINI_API_KEY || '';
const genAI = effectiveApiKey ? new GoogleGenerativeAI(effectiveApiKey) : null;

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

// Check username availability
app.get('/api/check-username', async (req: Request, res: Response) => {
  try {
    const { username } = req.query;
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Username required' });
    }
    
    const user = await getUserByUsername(username);
    res.json({ available: !user });
  } catch (error: any) {
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

// AI Proxy - Mysterious Name
app.post('/api/ai/mysterious-name', async (req: Request, res: Response) => {
  try {
    const prompt = "Generate a single mysterious RPG-style name (e.g., Kaelen, Vyr, Sylas). Just the name.";
    const response = await fetch('https://text.pollinations.ai/prompt/' + encodeURIComponent(prompt));
    const name = await response.text();
    res.json({ name: name.trim().split('\n')[0].replace(/[^a-zA-Z]/g, '') });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// AI Identity Creation
app.post('/api/ai/identity', async (req: Request, res: Response) => {
  try {
    const { manifesto } = req.body;
    const prompt = `Analyze this manifesto: "${manifesto}". Assign level 1 stats and a class. Be poetic. Response must be JSON: {"initialStats": {"intelligence": number, "physical": number, "spiritual": number, "social": number, "wealth": number, "class": "string"}, "reason": "poetic string"}`;
    const response = await fetch('https://text.pollinations.ai/prompt/' + encodeURIComponent(prompt) + '?json=true');
    const text = await response.text();
    const jsonMatch = text.match(/\{.*\}/s);
    if (jsonMatch) {
      res.json(JSON.parse(jsonMatch[0]));
    } else {
      res.json({ initialStats: { intelligence: 5, physical: 5, spiritual: 5, social: 5, wealth: 5, class: "Seeker" }, reason: "The void accepts your manifesto." });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// AI Quest
app.post('/api/ai/quest', async (req: Request, res: Response) => {
  try {
    const { stats } = req.body;
    const prompt = `Quest for ${stats.class} lvl ${stats.level}. Response must be JSON: {"text": "quest description", "difficulty": "B"}`;
    const response = await fetch('https://text.pollinations.ai/prompt/' + encodeURIComponent(prompt) + '?json=true');
    const text = await response.text();
    const jsonMatch = text.match(/\{.*\}/s);
    res.json(jsonMatch ? JSON.parse(jsonMatch[0]) : { text: "Master the void's silence", difficulty: "B" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// AI Feat Analysis
app.post('/api/ai/feat', async (req: Request, res: Response) => {
  try {
    const { feat } = req.body;
    const prompt = `Feat: ${feat}. Analyze this RPG achievement. Return JSON: {"xpGained": number, "statsIncreased": {"physical": number, "intelligence": number, "spiritual": number, "social": number, "wealth": number}, "systemMessage": "mystical response"}`;
    const response = await fetch('https://text.pollinations.ai/prompt/' + encodeURIComponent(prompt) + '?json=true');
    const text = await response.text();
    const jsonMatch = text.match(/\{.*\}/s);
    res.json(jsonMatch ? JSON.parse(jsonMatch[0]) : { xpGained: 50, statsIncreased: {}, systemMessage: "The void acknowledges your effort." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// AI Mirror Scenario
app.post('/api/ai/mirror/scenario', async (req: Request, res: Response) => {
  try {
    const { stats } = req.body;
    const prompt = `Create a psychological dilemma for a user with these stats: ${JSON.stringify(stats)}. Return JSON: {"situation": "string", "choiceA": "string", "choiceB": "string", "context": "string", "testedStat": "intelligence|physical|spiritual|social|wealth"}`;
    const response = await fetch('https://text.pollinations.ai/prompt/' + encodeURIComponent(prompt) + '?json=true');
    const text = await response.text();
    const jsonMatch = text.match(/\{.*\}/s);
    res.json(jsonMatch ? JSON.parse(jsonMatch[0]) : { situation: "The void beckons.", choiceA: "Step in", choiceB: "Step back", context: "A Choice", testedStat: "spiritual" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// AI Mirror Evaluation
app.post('/api/ai/mirror/evaluate', async (req: Request, res: Response) => {
  try {
    const { situation, choice } = req.body;
    const prompt = `Scenario: ${situation}. Choice: ${choice}. Evaluator result. Return JSON: {"outcome": "string", "statChange": {"statName": number}, "reward": {"name": "string", "description": "string", "rarity": "COMMON|RARE|LEGENDARY|MYTHIC", "effect": "string", "icon": "string"}}`;
    const response = await fetch('https://text.pollinations.ai/prompt/' + encodeURIComponent(prompt) + '?json=true');
    const text = await response.text();
    const jsonMatch = text.match(/\{.*\}/s);
    res.json(jsonMatch ? JSON.parse(jsonMatch[0]) : { outcome: "Fate is sealed.", statChange: {} });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// AI Advisor Chat
app.post('/api/ai/advisor', async (req: Request, res: Response) => {
  try {
    const { type, message } = req.body;
    const system = `You are a ${type} advisor. Keep it short, mystical, and practical.`;
    const prompt = `${system}\nUser: ${message}`;
    const response = await fetch('https://text.pollinations.ai/prompt/' + encodeURIComponent(prompt));
    const text = await response.text();
    res.json({ text });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// AI Daily Wisdom
app.get('/api/ai/wisdom', async (req: Request, res: Response) => {
  try {
    const prompt = "Generate a profound short philosophical quote. Return JSON: {\"text\": \"string\", \"author\": \"string\"}";
    const response = await fetch('https://text.pollinations.ai/prompt/' + encodeURIComponent(prompt) + '?json=true');
    const text = await response.text();
    const jsonMatch = text.match(/\{.*\}/s);
    res.json(jsonMatch ? JSON.parse(jsonMatch[0]) : { text: "Silence is the void's whisper.", author: "The Council" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// AI Image Generation (Artifacts)
app.post('/api/ai/image/artifact', async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const prompt = `Mystical pixel art RPG item, 32-bit style, sharp edges, vivid colors, solid black background, no transparency. Subject: ${name}. Context: ${description}. High contrast fantasy item.`;
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&model=flux&nologo=true`;
    res.json({ imageUrl });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

export default app;
