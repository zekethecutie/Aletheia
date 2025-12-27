import { Pool, PoolClient } from 'pg';
import crypto from 'crypto';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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
        avatar_url VARCHAR(512),
        cover_url VARCHAR(512),
        manifesto TEXT,
        origin_story TEXT,
        stats JSONB DEFAULT '{"level": 1, "xp": 0, "xpToNextLevel": 100, "intelligence": 5, "physical": 5, "spiritual": 5, "social": 5, "wealth": 5, "resonance": 100, "maxResonance": 100, "health": 100, "maxHealth": 100, "class": "Seeker"}',
        tasks JSONB DEFAULT '[]',
        inventory JSONB DEFAULT '[]',
        entropy INTEGER DEFAULT 0,
        following TEXT[] DEFAULT '{}',
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
      CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
    `);
    console.log('Database schema initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};

export default pool;
