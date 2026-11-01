import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getServerPublicSupabaseConfig } from '@/lib/supabase/public-config';
import { timedFetch } from '@/lib/supabase/timed-fetch';

export function isPublicSupabaseConfigured(): boolean {
  return getServerPublicSupabaseConfig() !== null;
}

export function createPublicClient() {
  const config = getServerPublicSupabaseConfig();
  if (!config) throw new Error('SUPABASE_CONFIGURATION_MISSING: Public database configuration is unavailable.');
  return createSupabaseClient(config.url, config.anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: timedFetch },
  });
}

export { createPublicClient as createClient };
