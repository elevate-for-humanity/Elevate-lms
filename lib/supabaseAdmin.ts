/** @deprecated Use canonical clients: @/lib/supabase/client, @/lib/supabase/server, @/lib/supabase/admin */
// lib/supabaseAdmin.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy initialization to prevent build-time errors
let _supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (_supabaseAdmin) return _supabaseAdmin;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // Return a no-op client — never throw on cold start
    _supabaseAdmin = createClient('https://placeholder.supabase.co', 'placeholder', {
      auth: { persistSession: false },
    });
    return _supabaseAdmin;
  }

  _supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  });

  return _supabaseAdmin;
}

// Export a proxy that lazily initializes
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return getSupabaseAdmin()[prop as keyof SupabaseClient];
  },
});
