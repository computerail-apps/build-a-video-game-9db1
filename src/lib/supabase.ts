import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Only throws when actually used without config, so apps that don't need
// Supabase never pay for a missing-env crash at import time.
export const supabase = url && anonKey ? createClient(url, anonKey) : (null as unknown as ReturnType<typeof createClient>);

export function requireSupabase() {
  if (!url || !anonKey) {
    throw new Error('Supabase is not configured for this app (missing VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY).');
  }
  return supabase;
}
