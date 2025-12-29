import { Pool, PoolClient } from 'pg';
import crypto from 'crypto';

const pool = new Pool({
  connectionString: 'postgresql://postgres.yjxqvwyudhvfkzkaixax:aletheiatheinevitable@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

export const getClient = async (): Promise<PoolClient> => {
  return pool.connect();
};

// Initialize database schema on startup
export const initializeDatabase = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(255),
        avatar_url TEXT,
        cover_url TEXT,
        manifesto TEXT,
        origin_story TEXT,
        stats JSONB DEFAULT '{"level": 1, "xp": 0, "xpToNextLevel": 100, "intelligence": 1, "physical": 1, "spiritual": 1, "social": 1, "wealth": 1, "resonance": 10, "maxResonance": 100, "health": 10, "maxHealth": 100, "class": "Initiate"}',
        tasks JSONB DEFAULT '[]',
        inventory JSONB DEFAULT '[]',
        goals JSONB DEFAULT '[]',
        entropy INTEGER DEFAULT 0,
        following TEXT[] DEFAULT '{}',
        is_verified BOOLEAN DEFAULT FALSE,
        is_deactivated BOOLEAN DEFAULT FALSE,
        deactivated_until TIMESTAMP WITH TIME ZONE,
        pending_deletion_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS habits (
        id SERIAL PRIMARY KEY,
        user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        streak INTEGER DEFAULT 0,
        last_logged TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        author_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        resonance INTEGER DEFAULT 0,
        liked_by TEXT[] DEFAULT '{}',
        is_system_post BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        author_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL, -- 'RESONANCE', 'FOLLOW', 'SYSTEM_WARN', 'SYSTEM_BAN'
        sender_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        content TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        reporter_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
        target_user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
        target_post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        reason TEXT,
        ai_verdict TEXT,
        action_taken VARCHAR(50), -- 'NONE', 'WARN', 'BAN', 'DELETE'
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS quests (
        id SERIAL PRIMARY KEY,
        user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        difficulty VARCHAR(1) DEFAULT 'E',
        completed BOOLEAN DEFAULT FALSE,
        xp_reward INTEGER DEFAULT 100,
        stat_reward JSONB DEFAULT '{}',
        expires_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS achievements (
        id SERIAL PRIMARY KEY,
        user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
      CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
      CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
    `);
    console.log('Database schema initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};

export default pool;
