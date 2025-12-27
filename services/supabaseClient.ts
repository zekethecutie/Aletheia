import { createClient } from '@supabase/supabase-js';

// Project Credentials
const PROJECT_URL = 'https://yjxqvwyudhvfkzkaixax.supabase.co';
const ANON_KEY = 'sb_publishable_ZBnRdLQurXmLcAey93aBQg_au2EEvut';

// Initialize Client
export const supabase = createClient(PROJECT_URL, ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});