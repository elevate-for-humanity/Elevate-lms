/** @deprecated Use '@/lib/supabase/server' instead. */
// Server-only Supabase client (no session persistence)
import { createClient } from '@supabase/supabase-js';

export function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'Content-key';

  return createClient(url, key, {
    auth: {
      persistSession: false,
    },
  });
}
