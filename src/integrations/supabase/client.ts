import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://gcgrjydxgwosohmxjvfj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZ3JqeWR4Z3dvc29obXhqdmZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMDUwNjksImV4cCI6MjA2ODc4MTA2OX0.ZkrsF4pcvDSjQE5uyyKvQLFJPiFObAwlDUVMNUdgTkc";


export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});