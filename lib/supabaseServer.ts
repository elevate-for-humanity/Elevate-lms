/** @deprecated Use '@/lib/supabase/server' instead. */
import { createClient } from '@supabase/supabase-js';

export function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Return a no-op client rather than crashing the lambda on cold start
    return createClient('https://placeholder.supabase.co', 'placeholder', {
      auth: { persistSession: false }
    });
  }

  return createClient(url, key, {
    auth: { persistSession: false }
  });
}

// Alias for compatibility with existing API routes
export function getSupabaseServerClient() {
  return supabaseServer();
}
