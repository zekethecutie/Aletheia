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

// AI Quest Generation
app.post('/api/ai/quest/generate', async (req: Request, res: Response) => {
  try {
    const { userId, stats, goals } = req.body;
    const system = `You are the Eye of Aletheia. Construct 2-5 real-world sacred trials for a ${stats.class}.
    GOALS: ${JSON.stringify(goals || [])}
    PROTOCOL: 
    1. Real-world actions only (no roleplay). This is for bettering the user's lifestyle.
    2. Difficulty must scale with user level (${stats.level}).
    3. Rewards must include a specific stat boost based on the action.
    Return JSON ONLY: { "quests": [{ "text": "string", "difficulty": "E-S", "xp_reward": number, "stat_reward": { "physical": number, ... }, "duration_hours": number }] }`;
    const response = await fetch('https://text.pollinations.ai/prompt/' + encodeURIComponent(system) + '?json=true');
    const text = await response.text();
    const jsonMatch = text.match(/\{.*\}/s);
    if (jsonMatch) {
      const { quests } = JSON.parse(jsonMatch[0]);
      for (const q of quests) {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + (q.duration_hours || 24));
        await query(
          'INSERT INTO quests (user_id, text, difficulty, xp_reward, stat_reward, expires_at) VALUES ($1, $2, $3, $4, $5, $6)',
          [userId, q.text, q.difficulty, q.xp_reward, JSON.stringify(q.stat_reward), expiresAt]
        );
      }
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Generation failed' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Fix Liking logic in posts
app.post('/api/posts/:id/toggle-like', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const postResult = await query('SELECT liked_by FROM posts WHERE id = $1', [id]);
    if (postResult.rows.length === 0) return res.status(404).json({ error: 'Post not found' });

    let likedBy = postResult.rows[0].liked_by || [];
    const isLiked = likedBy.includes(userId);

    if (isLiked) {
      likedBy = likedBy.filter((uid: string) => uid !== userId);
    } else {
      likedBy.push(userId);
    }

    await query('UPDATE posts SET liked_by = $1, resonance = $2 WHERE id = $3', [likedBy, likedBy.length, id]);
    res.json({ success: true, resonance: likedBy.length, isLiked: !isLiked });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/quests/:userId', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM quests WHERE user_id = $1 ORDER BY created_at DESC', [req.params.userId]);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/quests/:id/complete', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const questResult = await query('SELECT * FROM quests WHERE id = $1', [id]);
    if (questResult.rows.length === 0) return res.status(404).json({ error: 'Quest not found' });
    const quest = questResult.rows[0];

    await query('UPDATE quests SET completed = true WHERE id = $1', [id]);
    
    // Reward logic would happen here, usually client calls updateProfile after
    res.json({ success: true, reward: { xp: quest.xp_reward, stats: quest.stat_reward } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Identity Logic to include wealth
app.post('/api/ai/identity', async (req: Request, res: Response) => {
  try {
    const { manifesto } = req.body;
    const prompt = `CRITICAL SYSTEM PROTOCOL: You are the High Council of Aletheia, the final arbiters of soul-architecture. 
    Analyze the seeker's manifesto: "${manifesto}". 
    Your verdict must be spoken from the heights of the celestial spire—wise, mysterious, and absolute.
    Determine their character class and assign their starting attributes based on the depth of their intent.
    BE METICULOUS. Most seekers are found lacking; start them with 1-3 in most attributes.
    Attributes meaning:
    - Intelligence: Depth of perception.
    - Physical: Manifestation of will in the material.
    - Spiritual: Alignment with the unseen.
    - Social: Resonance within the collective frequency.
    - Wealth: Ability to transmute value.
    
    Response must be JSON ONLY: 
    {
      "initialStats": {
        "intelligence": number, 
        "physical": number, 
        "spiritual": number, 
        "social": number, 
        "wealth": number, 
        "class": "string",
        "health": number,
        "maxHealth": number,
        "resonance": number,
        "maxResonance": number
      }, 
      "reason": "A poetic, wise, and slightly cold verdict from the High Council."
    }`;
    const response = await fetch('https://text.pollinations.ai/prompt/' + encodeURIComponent(prompt) + '?json=true');
    const text = await response.text();
    const jsonMatch = text.match(/\{.*\}/s);
    if (jsonMatch) {
      res.json(JSON.parse(jsonMatch[0]));
    } else {
      res.json({ initialStats: { intelligence: 1, physical: 1, spiritual: 1, social: 1, wealth: 1, class: "Initiate", health: 10, maxHealth: 100, resonance: 10, maxResonance: 100 }, reason: "The void finds you lacking in definition. Begin as a shadow." });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// AI Advisor aware of quests
app.post('/api/ai/advisor', async (req: Request, res: Response) => {
  try {
    const { type, message, userId } = req.body;
    
    // Fetch active quests
    const questsResult = await query('SELECT text FROM quests WHERE user_id = $1 AND completed = false', [userId]);
    const activeQuests = questsResult.rows.map(q => q.text).join(', ');

    const system = `You are a ${type} advisor. Keep it short, mystical, and practical. 
    The user's active quests are: ${activeQuests || 'None'}.
    Always be aware of these objectives when providing guidance.`;
    
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
    const philosophers = ["Friedrich Nietzsche", "Franz Kafka", "Albert Camus", "Plato", "Aristotle", "Marcus Aurelius", "Socrates", "Arthur Schopenhauer"];
    const selected = philosophers[Math.floor(Math.random() * philosophers.length)];
    const prompt = `Generate a profound, short, and authentic quote from ${selected} or in his specific philosophical style. Return JSON: {"text": "string", "author": "${selected}"}`;
    const response = await fetch('https://text.pollinations.ai/prompt/' + encodeURIComponent(prompt) + '?json=true');
    const text = await response.text();
    const jsonMatch = text.match(/\{.*\}/s);
    res.json(jsonMatch ? JSON.parse(jsonMatch[0]) : { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" });
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

// AI Mirror Scenario
app.post('/api/ai/mirror/scenario', async (req: Request, res: Response) => {
  try {
    const { stats } = req.body;
    const prompt = `You are the Mirror of Aletheia. Generate a profound, wise moral dilemma representing real-world circumstances and compromises for a ${stats.class}. 
    PROTOCOL:
    1. No fantasy roleplay. Scenarios must be realistic, grounded in modern life, ethics, and career/social dynamics.
    2. Focus on true compromises and professional or personal integrity.
    3. It must test their ${['intelligence', 'physical', 'spiritual', 'social', 'wealth'][Math.floor(Math.random() * 5)]}.
    Return JSON ONLY: { "situation": "string", "choiceA": "string", "choiceB": "string", "testedStat": "string" }`;
    const response = await fetch('https://text.pollinations.ai/prompt/' + encodeURIComponent(prompt) + '?json=true');
    const text = await response.text();
    const jsonMatch = text.match(/\{.*\}/s);
    res.json(jsonMatch ? JSON.parse(jsonMatch[0]) : { situation: "You are offered a promotion that requires compromising your mentor's legacy.", choiceA: "Accept for the greater influence", choiceB: "Decline to honor the principle", testedStat: "social" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update achievement log logic
app.post('/api/achievements/calculate', async (req: Request, res: Response) => {
  try {
    const { text, userId } = req.body;
    const prompt = `Analyze this real-world feat: "${text}". 
    Evaluate its difficulty and impact on character stats.
    Return JSON: { "xpGained": number, "statsIncreased": { "physical": number, ... }, "systemMessage": "string" }`;
    const response = await fetch('https://text.pollinations.ai/prompt/' + encodeURIComponent(prompt) + '?json=true');
    const resText = await response.text();
    const jsonMatch = resText.match(/\{.*\}/s);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      // Save achievement to DB
      await query('INSERT INTO achievements (user_id, title, description, icon) VALUES ($1, $2, $3, $4)', 
        [userId, "Feat Manifested", text, "🔥"]);
      res.json(result);
    } else {
      res.status(500).json({ error: 'Failed to evaluate' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// AI Mirror Evaluation
app.post('/api/ai/mirror/evaluate', async (req: Request, res: Response) => {
  try {
    const { situation, choice } = req.body;
    const prompt = `Evaluate this choice in the Mirror: 
    Situation: ${situation}
    Choice: ${choice}
    Return JSON ONLY: { "outcome": "poetic description", "statChange": { "statName": number }, "reward": { "name": "string", "description": "string", "icon": "emoji", "rarity": "Common|Rare|Epic|Relic" } }`;
    const response = await fetch('https://text.pollinations.ai/prompt/' + encodeURIComponent(prompt) + '?json=true');
    const text = await response.text();
    const jsonMatch = text.match(/\{.*\}/s);
    res.json(jsonMatch ? JSON.parse(jsonMatch[0]) : { outcome: "The mirror ripples.", statChange: { spiritual: 1 } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Fix Post endpoint
app.post('/api/posts', async (req: Request, res: Response) => {
  try {
    const { author_id, content } = req.body;
    const result = await query(
      'INSERT INTO posts (author_id, content) VALUES ($1, $2) RETURNING *',
      [author_id, content]
    );
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/posts', async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT p.*, pr.display_name as username, pr.avatar_url, (pr.stats->>'class') as author_class 
      FROM posts p 
      LEFT JOIN profiles pr ON p.author_id = pr.id 
      ORDER BY p.created_at DESC 
      LIMIT 50
    `);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/achievements/:userId', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM achievements WHERE user_id = $1 ORDER BY unlocked_at DESC', [req.params.userId]);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/achievements', async (req: Request, res: Response) => {
  try {
    const { userId, title, description, icon } = req.body;
    const result = await query(
      'INSERT INTO achievements (user_id, title, description, icon) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, title, description, icon]
    );
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
app.get('/api/leaderboard', async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT id, username, avatar_url, stats, entropy 
      FROM profiles 
      ORDER BY (stats->>'level')::int DESC, entropy DESC 
      LIMIT 20
    `);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

export default app;
