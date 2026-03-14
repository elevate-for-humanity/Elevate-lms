/** @deprecated Use '@/lib/supabase/server' instead. */
import { createClient } from '@supabase/supabase-js';

export function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(url, key, {
    auth: { persistSession: false }
  });
}

// Alias for compatibility with existing API routes
export function getSupabaseServerClient() {
  return supabaseServer();
}
