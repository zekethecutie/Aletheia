import crypto from 'crypto';
import { query } from './db';

const SALT_ROUNDS = 10;

export const hashPassword = async (password: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}$${derivedKey.toString('hex')}`);
    });
  });
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (!hash || !hash.includes('$')) {
      resolve(false);
      return;
    }
    const [salt, key] = hash.split('$');
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(key === derivedKey.toString('hex'));
    });
  });
};

export const createUser = async (username: string, password: string) => {
  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  const result = await query(
    'INSERT INTO profiles (id, username, password_hash) VALUES ($1, $2, $3) RETURNING id, username',
    [id, username.toLowerCase(), passwordHash]
  );
  return result.rows[0];
};

export const getUserByUsername = async (username: string) => {
  const result = await query(
    'SELECT * FROM profiles WHERE username = $1',
    [username.toLowerCase()]
  );
  return result.rows[0];
};

export const getUserById = async (id: string) => {
  const result = await query(
    'SELECT id, username, display_name, avatar_url, cover_url, manifesto, origin_story, stats, tasks, inventory, entropy, following, is_deactivated, deactivated_until, pending_deletion_at FROM profiles WHERE id = $1',
    [id]
  );
  return result.rows[0];
};
