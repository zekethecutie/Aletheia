import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createUser, getUserByUsername, getUserById, verifyPassword } from './auth';
import { query, initializeDatabase } from './db';

import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize database on startup
initializeDatabase().catch(console.error);

// Register Object Storage routes
registerObjectStorageRoutes(app);

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
// Profile detail with reports/follow count
app.get('/api/profile/:id/detail', async (req: Request, res: Response) => {
  try {
    const profile = await getUserById(req.params.id);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    
    const followers = await query('SELECT COUNT(*) FROM profiles WHERE $1 = ANY(following)', [req.params.id]);
    res.json({ ...profile, followersCount: parseInt(followers.rows[0].count) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const user = await getUserByUsername(username);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const profile = await getUserById(user.id);
    
    // Check moderation status
    if (profile.is_deactivated && profile.deactivated_until && new Date() < new Date(profile.deactivated_until)) {
      return res.status(403).json({ error: `Signal suppressed. Deactivated until ${new Date(profile.deactivated_until).toLocaleString()}` });
    }
    if (profile.pending_deletion_at && new Date() < new Date(profile.pending_deletion_at)) {
      return res.status(403).json({ error: `Identity scheduled for eradication. Final sunset at ${new Date(profile.pending_deletion_at).toLocaleString()}` });
    }

    res.json({
      id: user.id,
      username: user.username,
      displayName: profile.display_name || user.username,
      avatarUrl: profile.avatar_url,
      coverUrl: profile.cover_url,
      stats: profile.stats,
      following: profile.following || []
    });
  } catch (error: any) {
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

// Fix Achievement analysis
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
      // Save to database
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

// Resonance (Like) with notification
app.post('/api/posts/like', async (req: Request, res: Response) => {
  try {
    const { post_id, user_id } = req.body;

    const postResult = await query('SELECT liked_by, author_id FROM posts WHERE id = $1', [post_id]);
    if (postResult.rows.length === 0) return res.status(404).json({ error: 'Post not found' });

    const post = postResult.rows[0];
    let likedBy = post.liked_by || [];
    const isLiked = likedBy.includes(user_id);

    if (isLiked) {
      likedBy = likedBy.filter((uid: string) => uid !== user_id);
    } else {
      likedBy.push(user_id);
      // Create notification for author
      if (post.author_id !== user_id) {
        await query(
          'INSERT INTO notifications (user_id, type, sender_id, post_id) VALUES ($1, $2, $3, $4)',
          [post.author_id, 'RESONANCE', user_id, post_id]
        );
      }
    }

    await query('UPDATE posts SET liked_by = $1, resonance = $2 WHERE id = $3', [likedBy, likedBy.length, post_id]);
    res.json({ success: true, resonance: likedBy.length, isLiked: !isLiked });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Comment logic with threading
app.post('/api/posts/:id/comments', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { author_id, content, parent_id } = req.body;
    const result = await query(
      'INSERT INTO comments (post_id, author_id, content, parent_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, author_id, content, parent_id]
    );
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/posts/:id/comments', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT c.*, p.display_name as username, p.avatar_url 
      FROM comments c
      LEFT JOIN profiles p ON c.author_id = p.id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
    `, [id]);
    res.json(result.rows);
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

// Notifications
app.get('/api/notifications/:userId', async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT n.*, p.username as sender_username, p.avatar_url as sender_avatar
      FROM notifications n
      LEFT JOIN profiles p ON n.sender_id = p.id
      WHERE n.user_id = $1
      ORDER BY n.created_at DESC
      LIMIT 50
    `, [req.params.userId]);
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

// Follow logic with notification
app.post('/api/profile/:id/follow', async (req: Request, res: Response) => {
  try {
    const { followerId } = req.body;
    const { id: targetId } = req.params;

    const result = await query('SELECT following FROM profiles WHERE id = $1', [followerId]);
    let following = result.rows[0].following || [];
    const isFollowing = following.includes(targetId);

    if (isFollowing) {
      following = following.filter((id: string) => id !== targetId);
    } else {
      following.push(targetId);
      // Create notification
      await query(
        'INSERT INTO notifications (user_id, type, sender_id) VALUES ($1, $2, $3)',
        [targetId, 'FOLLOW', followerId]
      );
    }

    await query('UPDATE profiles SET following = $1 WHERE id = $2', [following, followerId]);
    res.json({ success: true, isFollowing: !isFollowing });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Report and AI Moderation
app.post('/api/reports', async (req: Request, res: Response) => {
  try {
    const { reporterId, targetUserId, targetPostId, reason } = req.body;
    
    // 1. Log report
    const reportRes = await query(
      'INSERT INTO reports (reporter_id, target_user_id, target_post_id, reason) VALUES ($1, $2, $3, $4) RETURNING id',
      [reporterId, targetUserId, targetPostId, reason]
    );

    // 2. AI Investigation
    let targetContent = "";
    if (targetPostId) {
      const post = await query('SELECT content FROM posts WHERE id = $1', [targetPostId]);
      targetContent = post.rows[0]?.content || "";
    }

    const prompt = `You are the High Arbiter of Aletheia. Investigate this report:
    Reason: ${reason}
    Content: ${targetContent}
    
    Determine the severity. 
    - WARN: Minor violation. Sends a warning.
    - BAN: Serious violation. Deactivate account for 10 days.
    - DELETE: Extreme violation. Mark account for deletion in 3 days.
    - NONE: No violation found.

    Return JSON: { "action": "WARN|BAN|DELETE|NONE", "verdict": "Poetic explanation" }`;

    const aiRes = await fetch('https://text.pollinations.ai/prompt/' + encodeURIComponent(prompt) + '?json=true');
    const aiData = await aiRes.json() as any;
    const action = aiData.action || 'NONE';
    const verdict = aiData.verdict || "The void found no shadow here.";

    // 3. Apply action
    if (action === 'WARN') {
      await query(
        'INSERT INTO notifications (user_id, type, content) VALUES ($1, $2, $3)',
        [targetUserId, 'SYSTEM_WARN', `VERDICT: ${verdict}`]
      );
    } else if (action === 'BAN') {
      const banDate = new Date();
      banDate.setDate(banDate.getDate() + 10);
      await query(
        'UPDATE profiles SET is_deactivated = true, deactivated_until = $1 WHERE id = $2',
        [banDate, targetUserId]
      );
    } else if (action === 'DELETE') {
      const delDate = new Date();
      delDate.setDate(delDate.getDate() + 3);
      await query(
        'UPDATE profiles SET pending_deletion_at = $1 WHERE id = $2',
        [delDate, targetUserId]
      );
    }

    await query('UPDATE reports SET ai_verdict = $1, action_taken = $2 WHERE id = $3', [verdict, action, reportRes.rows[0].id]);

    res.json({ success: true, action, verdict });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// AI Habit Tracking
app.post('/api/habits/track', async (req: Request, res: Response) => {
  try {
    const { userId, habit, action } = req.body;
    const prompt = `You are the Sentinel of Habits. User performed: "${action}" for habit: "${habit}". 
    Evaluate if this action genuinely fulfills the habit's intent.
    Return JSON ONLY: { "success": boolean, "xp": number, "feedback": "string" }`;
    const response = await fetch('https://text.pollinations.ai/prompt/' + encodeURIComponent(prompt) + '?json=true');
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
const personalities: Record<string, string> = {
  'Mystic': 'You are the Moon-Eyed Mystic, focusing on emotional intelligence, intuition, and the depth of the subconscious. You speak in fluid, dream-like prose.',
  'Warrior': 'You are the Iron-Willed Vanguard. You value discipline, physical manifestation, and the courage to act. You speak with sharp, rhythmic intensity.',
  'Scholar': 'You are the Archivist of the Spire. You value logic, history, and the structure of reality. You speak with clinical, cold precision.'
};

app.post('/api/ai/advisor', async (req: Request, res: Response) => {
  try {
    const { type, message, userId } = req.body;
    const persona = personalities[type] || personalities['Scholar'];
    
    const questsResult = await query('SELECT text FROM quests WHERE user_id = $1 AND completed = false', [userId]);
    const activeQuests = questsResult.rows.map(q => q.text).join(', ');

    const system = `${persona}
    Active Objectives: ${activeQuests || 'None'}.
    Keep it short, wise, and aligned with your unique frequency.`;
    
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

// Cache to prevent repeat mirror scenarios
const mirrorScenarioCache: Record<string, any> = {};

// AI Mirror Scenario - with caching
app.post('/api/ai/mirror/scenario', async (req: Request, res: Response) => {
  try {
    const { stats } = req.body;
    const cacheKey = `${stats.class}_${new Date().toDateString()}`;
    if (mirrorScenarioCache[cacheKey]) {
      return res.json({ ...mirrorScenarioCache[cacheKey], fromCache: true });
    }
    
    const testedStats = ['intelligence', 'physical', 'spiritual', 'social', 'wealth'];
    const testedStat = testedStats[Math.floor(Math.random() * 5)];
    const prompt = `Generate a UNIQUE and challenging psychological scenario for a ${stats.class} testing their ${testedStat}. 
    Focus on moral dilemmas, ethical choices, and profound life-changing lessons. 
    The scenario should be realistic, deep, and intellectually stimulating.
    Return JSON: { "situation": "string", "choiceA": "string", "choiceB": "string", "testedStat": "${testedStat}" }`;
    const response = await fetch('https://text.pollinations.ai/prompt/' + encodeURIComponent(prompt) + '?json=true');
    const text = await response.text();
    const jsonMatch = text.match(/\{.*\}/s);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { situation: "A real challenge presents itself.", choiceA: "Path A", choiceB: "Path B", testedStat };
    mirrorScenarioCache[cacheKey] = result;
    res.json(result);
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

// AI Mirror Evaluation with actual stat changes
app.post('/api/ai/mirror/evaluate', async (req: Request, res: Response) => {
  try {
    const { situation, choice } = req.body;
    const prompt = `Analyze this choice in a mirror scenario.
    Situation: ${situation}
    Choice: ${choice}
    
    Evaluate the impact. 
    1. STAT CHANGES: Determine stat gains or losses (range -5 to +10).
    2. ARTIFACT: Describe a mystical artifact if one is earned.
    
    Return JSON: { 
      "outcome": "Poetic explanation of the result", 
      "statChange": { "physical": number, "intelligence": number, "spiritual": number, "social": number, "wealth": number },
      "reward": { "name": "string", "description": "string", "rarity": "COMMON|RARE|LEGENDARY|MYTHIC", "icon": "emoji", "effect": "string" }
    }`;
    
    const response = await fetch('https://text.pollinations.ai/prompt/' + encodeURIComponent(prompt) + '?json=true');
    const text = await response.text();
    const jsonMatch = text.match(/\{.*\}/s);
    if (jsonMatch) {
      let result = JSON.parse(jsonMatch[0]);
      // Apply RNG for artifact (30% chance)
      const rng = Math.random();
      if (rng > 0.3) {
        result.rewardType = 'STAT_ONLY';
        result.reward = null;
      } else {
        result.rewardType = 'ARTIFACT';
      }
      res.json(result);
    } else {
      res.status(500).json({ error: 'Evaluation failed' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// User Search
app.get('/api/search/users', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    const result = await query(
      "SELECT id, username, avatar_url, stats FROM profiles WHERE username ILIKE $1 LIMIT 10",
      [`%${q}%`]
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// CRUD for Posts
app.delete('/api/posts/:id', async (req: Request, res: Response) => {
  try {
    await query('DELETE FROM posts WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/posts/:id', async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    await query('UPDATE posts SET content = $1, updated_at = NOW() WHERE id = $2', [content, req.params.id]);
    res.json({ success: true });
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
