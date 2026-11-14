import { createClient } from '@supabase/supabase-js';

/**
 * The admin API authorizes the operation and issues an object-scoped token.
 * Transferring that object must not wait on the unrelated browser auth session.
 * This client never reads or changes the portal's persisted session.
 */
export function createSignedUploadClient(config: { url: string; anonKey: string }) {
  return createClient(config.url, config.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
