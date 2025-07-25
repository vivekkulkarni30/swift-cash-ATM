import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// 1. Read the URL and Key from secure environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 2. Check if the variables are loaded correctly
if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL or Key is missing from .env.local file");
}

// 3. Create the client using the secure variables
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
