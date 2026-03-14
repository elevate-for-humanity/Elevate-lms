/**
 * @deprecated Use '@/lib/supabase/admin' or '@/lib/supabase/server' instead.
 * This file is kept for backward compatibility.
 */

/**
 * Lazy-loading Supabase clients for build-time compatibility
 * Prevents "supabaseUrl is required" errors during Next.js build
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let anonClient: SupabaseClient | null = null;
let adminClient: SupabaseClient | null = null;

/**
 * Get Supabase client with anon key (for client-side operations)
 */
export function getSupabaseAnon(): SupabaseClient | null {
  if (!anonClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    if (!url || !key) return null;
    anonClient = createClient(url, key);
  }
  return anonClient;
}

/**
 * Get Supabase admin client with service role key (for server-side operations)
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!adminClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!url || !key) return null;
    adminClient = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return adminClient;
}
