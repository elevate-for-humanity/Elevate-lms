import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { timedFetch } from '@/lib/supabase/timed-fetch';

/**
 * Cookie-free, least-privilege client used only to prove newly issued login
 * credentials before they are delivered. It intentionally uses the anon key.
 */
export function createCredentialVerifier(): SupabaseClient<any> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    throw new Error('Supabase credential verification is not configured');
  }

  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: timedFetch },
  });
}
