import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { query } from './db';
import { hashPassword } from './auth';
import crypto from 'crypto';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

import { initializeDatabase } from './db';
initializeDatabase().catch(err => console.error('Database initialization failed:', err));

app.use(cors());
app.use(express.json());

// Placeholder GET for testing
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Auth Routes
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { username, password, manifesto, stats, originStory } = req.body;
    const cleanUsername = username.trim().toLowerCase();
    
    const result = await query(
      'SELECT id FROM profiles WHERE LOWER(username) = LOWER($1)',
      [cleanUsername]
    );
    if (result.rows.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const id = crypto.randomUUID();
    const passwordHash = await hashPassword(password);

    const newUserResult = await query(
      'INSERT INTO profiles (id, username, password_hash, manifesto, origin_story, stats, entropy, following, goals) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, username',
      [
        id, 
        cleanUsername, 
        passwordHash, 
        manifesto, 
        originStory, 
        JSON.stringify(stats), 
        0, 
        '{}', 
        '[]'
      ]
    );

    const user = newUserResult.rows[0];
    res.json({ success: true, user: { id: user.id, username: user.username } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const cleanUsername = username.trim().toLowerCase();
    const result = await query('SELECT * FROM profiles WHERE LOWER(username) = LOWER($1)', [cleanUsername]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Identity not found in the void.' });
    }

    const user = result.rows[0];
    
    // Check if password matches
    const { verifyPassword } = await import('./auth');
    const isValid = await verifyPassword(password, user.password_hash);
    
    if (!isValid) {
      return res.status(401).json({ error: 'The key does not match the designation.' });
    }

    res.json({ 
      success: true, 
      user: { 
        id: user.id, 
        username: user.username,
        stats: typeof user.stats === 'string' ? JSON.parse(user.stats) : user.stats,
        manifesto: user.manifesto,
        originStory: user.origin_story,
        avatarUrl: user.avatar_url,
        coverUrl: user.cover_url,
        goals: typeof user.goals === 'string' ? JSON.parse(user.goals) : (user.goals || []),
        following: typeof user.following === 'string' ? JSON.parse(user.following) : (user.following || [])
      } 
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Profile Routes
app.get('/api/profile/:id', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM profiles WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const profile = result.rows[0];
    res.json({
      id: profile.id,
      username: profile.username,
      isVerified: profile.is_verified,
      created_at: profile.created_at,
      stats: typeof profile.stats === 'string' ? JSON.parse(profile.stats) : profile.stats,
      tasks: typeof profile.tasks === 'string' ? JSON.parse(profile.tasks) : (profile.tasks || []),
      inventory: typeof profile.inventory === 'string' ? JSON.parse(profile.inventory) : (profile.inventory || []),
      manifesto: profile.manifesto,
      origin_story: profile.origin_story,
      avatar_url: profile.avatar_url,
      cover_url: profile.cover_url,
      entropy: profile.entropy,
      following: typeof profile.following === 'string' ? JSON.parse(profile.following) : (profile.following || [])
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/profile/:id/update', async (req: Request, res: Response) => {
  try {
    const { stats, tasks, inventory, avatarUrl, coverUrl, entropy, following } = req.body;
    await query(
      'UPDATE profiles SET stats = $1, tasks = $2, inventory = $3, avatar_url = $4, cover_url = $5, entropy = $6, following = $7 WHERE id = $8',
      [
        JSON.stringify(stats), 
        JSON.stringify(tasks || []), 
        JSON.stringify(inventory || []), 
        avatarUrl, 
        coverUrl, 
        entropy || 0, 
        JSON.stringify(following || []), 
        req.params.id
      ]
    );

    const profileResult = await query('SELECT * FROM profiles WHERE id = $1', [req.params.id]);
    const profile = profileResult.rows[0];
    res.json({
      ...profile,
      stats: typeof profile.stats === 'string' ? JSON.parse(profile.stats) : profile.stats,
      tasks: typeof profile.tasks === 'string' ? JSON.parse(profile.tasks) : (profile.tasks || []),
      inventory: typeof profile.inventory === 'string' ? JSON.parse(profile.inventory) : (profile.inventory || []),
      following: typeof profile.following === 'string' ? JSON.parse(profile.following) : (profile.following || [])
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/check-username', async (req: Request, res: Response) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: 'Username required' });
    const result = await query('SELECT id FROM profiles WHERE LOWER(username) = LOWER($1)', [String(username).trim()]);
    console.log(`Checking availability for: ${username}, Available: ${result.rows.length === 0}`);
    res.json({ available: result.rows.length === 0 });
  } catch (error: any) {
    console.error('Username check error:', error);
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
    
    const userQuests = await query('SELECT * FROM quests WHERE user_id = $1 AND completed = false', [userId]);
    if (userQuests.rows.length >= 5) {
      return res.json({ success: true, message: "Your spirit is already laden with trials. Complete them first." });
    }

    const system = `You are the Eye of Aletheia, a supreme self-development architecture. 
    Construct 3 real-world sacred trials for a ${stats.class} level ${stats.level}.
    GOALS: ${JSON.stringify(goals || [])}
    
    CRITICAL PROTOCOLS:
    1. ACTIONS: ONLY real-world self-improvement actions (e.g., "Complete a 30-min deep work session", "Run 3km", "Meditate for 15 mins").
    2. UTILITY: Each quest must directly contribute to the user's evolution.
    3. DIFFICULTY: E (Easy) to S (Supreme).
    4. Return JSON ONLY: { "quests": [{ "text": "string", "difficulty": "E-S", "xp_reward": number, "stat_reward": { "physical": number, "intelligence": number, "spiritual": number, "social": number, "wealth": number }, "duration_hours": number }] }`;
    
    const response = await fetch('https://text.pollinations.ai/prompt/' + encodeURIComponent(system) + '?json=true');
    const text = await response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const { quests: generatedQuests } = JSON.parse(jsonMatch[0]);
      
      for (const q of generatedQuests) {
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

// Achievement analysis
app.post('/api/achievements/calculate', async (req: Request, res: Response) => {
  try {
    const { text, userId, stats } = req.body;
    const prompt = `You are the Chronicler of Aletheia. Analyze this real-world achievement: "${text}". 
    Evaluate its impact on a ${stats.class} at level ${stats.level}.
    Return JSON ONLY: { "xpGained": number, "statsIncreased": { "physical": number, "intelligence": number, "spiritual": number, "social": number, "wealth": number }, "systemMessage": "string" }`;
    const response = await fetch('https://text.pollinations.ai/prompt/' + encodeURIComponent(prompt) + '?json=true');
    const resText = await response.text();
    const jsonMatch = resText.match(/\{.*\}/s);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      await query('INSERT INTO achievements (user_id, title, description, icon) VALUES ($1, $2, $3, $4)', 
        [userId, "Great Feat Logged", text, "🏆"]);
      res.json(result);
    } else {
      res.status(500).json({ error: 'Evaluation failed' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Posts
app.post('/api/posts/like', async (req: Request, res: Response) => {
  try {
    const { post_id, user_id } = req.body;
    const postResult = await query('SELECT liked_by, author_id FROM posts WHERE id = $1', [post_id]);
    if (postResult.rows.length === 0) return res.status(404).json({ error: 'Post not found' });

    const post = postResult.rows[0];
    let likedBy = post.liked_by || [];
    const isLiked = likedBy.includes(user_id);

    if (isLiked) {
      likedBy = likedBy.filter((id: string) => id !== user_id);
    } else {
      likedBy.push(user_id);
    }

    await query('UPDATE posts SET liked_by = $1 WHERE id = $2', [JSON.stringify(likedBy), post_id]);
    res.json({ success: true, isLiked: !isLiked, resonance: likedBy.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/posts', async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT p.*, pr.username, pr.avatar_url, pr.stats, pr.cover_url, 
             (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
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

app.post('/api/posts', async (req: Request, res: Response) => {
  try {
    const { author_id, content } = req.body;
    const result = await query(
      'INSERT INTO posts (author_id, content, liked_by) VALUES ($1, $2, $3) RETURNING *',
      [author_id, content, JSON.stringify([])]
    );
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Artifact Image Generation
app.post('/api/ai/image/artifact', async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const prompt = `Mystical pixel art RPG item, 32-bit style, sharp edges, vivid colors, solid black background, no transparency. Subject: ${name}. Context: ${description}. High contrast fantasy item.`;
    
    // Using Flux model via Pollinations for high quality mystical items
    const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=512&height=512&seed=${Math.floor(Math.random() * 1000000)}&model=flux`;
    
    res.json({ imageUrl });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Quests
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
    res.json({ success: true, reward: { xp: quest.xp_reward, stats: quest.stat_reward } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/quests/create', async (req: Request, res: Response) => {
  try {
    const { user_id, text, stats } = req.body;
    if (!user_id || !text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const system = `You are the Eye of Aletheia. Analyze this manual quest directive: "${text}". 
    Evaluate its difficulty (E-S) and appropriate rewards for a ${stats.class} level ${stats.level}.
    Return JSON ONLY: { "difficulty": "E-S", "xp_reward": number, "stat_reward": { "physical": number, "intelligence": number, "spiritual": number, "social": number, "wealth": number } }`;
    
    const aiResponse = await fetch('https://text.pollinations.ai/prompt/' + encodeURIComponent(system) + '?json=true');
    const aiText = await aiResponse.text();
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    
    let difficulty = 'C';
    let xp_reward = 100;
    let stat_reward = {};

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      difficulty = parsed.difficulty || 'C';
      xp_reward = parsed.xp_reward || 100;
      stat_reward = parsed.stat_reward || {};
    }

    await query(
      'INSERT INTO quests (user_id, text, difficulty, xp_reward, stat_reward) VALUES ($1, $2, $3, $4, $5)',
      [user_id, text, difficulty, xp_reward, JSON.stringify(stat_reward)]
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Habits
app.post('/api/habits', async (req: Request, res: Response) => {
  try {
    const { user_id, name } = req.body;
    const result = await query(
      'INSERT INTO habits (user_id, name, streak) VALUES ($1, $2, $3) RETURNING *',
      [user_id, name, 0]
    );
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/habits/:userId', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM habits WHERE user_id = $1', [req.params.userId]);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/habits/track', async (req: Request, res: Response) => {
  try {
    const { user_id, habit_id, action } = req.body;
    const habitResult = await query('SELECT * FROM habits WHERE id = $1 AND user_id = $2', [habit_id, user_id]);
    if (habitResult.rows.length === 0) return res.status(404).json({ error: 'Habit not found' });

    const habit = habitResult.rows[0];
    const newStreak = (habit.streak || 0) + 1;
    const xpReward = 50 * (1 + Math.floor(newStreak / 7));

    await query('UPDATE habits SET streak = $1 WHERE id = $2', [newStreak, habit_id]);
    res.json({ success: true, feedback: `Great work! ${action}`, xp: xpReward });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Notifications
app.get('/api/notifications/:userId', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC', [req.params.userId]);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/notifications/:id/read', async (req: Request, res: Response) => {
  try {
    await query('UPDATE notifications SET is_read = true WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mirror Scenario
app.post('/api/ai/mirror/scenario', async (req: Request, res: Response) => {
  try {
    const { stats } = req.body;
    const prompt = `Generate a moral dilemma for a ${stats.class} character. Return JSON ONLY: { "situation": "string", "choiceA": "string", "choiceB": "string", "testedStat": "string" }`;
    const response = await fetch('https://text.pollinations.ai/prompt/' + encodeURIComponent(prompt) + '?json=true');
    const text = await response.text();
    const jsonMatch = text.match(/\{.*\}/s);
    if (jsonMatch) {
      res.json(JSON.parse(jsonMatch[0]));
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// AI Proxy - Analyze Identity
app.post('/api/ai/analyze-identity', async (req: Request, res: Response) => {
  try {
    const { manifesto } = req.body;
    const system = `You are the Eye of Aletheia. Analyze this initiate's manifesto: "${manifesto}".
    Determine their starting stats based on their intent.
    Return JSON ONLY: { "initialStats": { "intelligence": number, "physical": number, "spiritual": number, "social": number, "wealth": number }, "reason": "A one-sentence mystical verdict" }
    Stats should sum to 15, with minimum 1 per category.`;
    
    const response = await fetch('https://text.pollinations.ai/prompt/' + encodeURIComponent(system) + '?json=true');
    const text = await response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      res.json(JSON.parse(jsonMatch[0]));
    } else {
      res.status(500).json({ error: 'Analysis failed' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

export default app;
