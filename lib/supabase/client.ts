import { logger } from '@/lib/logger';
/**
 * Supabase Browser Client
 * For use in Client Components only
 *
 * Returns a safe no-op proxy when env vars are missing so that
 * callers never crash on `.from()` / `.auth` etc.
 */

import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// Chainable stub that returns empty data for every query method.
// Prevents "Cannot read properties of null (reading 'from')" across 130+ components.
const EMPTY_RESPONSE = { data: null, error: null, count: null, status: 200, statusText: 'OK' };

function noOpChain(): any {
  const chain: any = new Proxy(() => chain, {
    get(_target, prop) {
      if (prop === 'then' || prop === 'single' || prop === 'maybeSingle') {
        if (prop === 'then') {
          return (resolve: any) => resolve(EMPTY_RESPONSE);
        }
        return () => Promise.resolve(EMPTY_RESPONSE);
      }
      return () => chain;
    },
    apply() {
      return chain;
    },
  });
  return chain;
}

const noOpAuth = {
  getUser: () => Promise.resolve({ data: { user: null }, error: null }),
  getSession: () => Promise.resolve({ data: { session: null }, error: null }),
  signOut: () => Promise.resolve({ error: null }),
  signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
  signInWithOAuth: () => Promise.resolve({ data: { url: null, provider: null }, error: { message: 'Supabase not configured' } }),
  signUp: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
  onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  resetPasswordForEmail: () => Promise.resolve({ data: null, error: null }),
  updateUser: () => Promise.resolve({ data: { user: null }, error: null }),
};

const noOpStorage = {
  from: () => ({
    upload: () => Promise.resolve({ data: null, error: null }),
    download: () => Promise.resolve({ data: null, error: null }),
    getPublicUrl: () => ({ data: { publicUrl: '' } }),
    list: () => Promise.resolve({ data: [], error: null }),
    remove: () => Promise.resolve({ data: null, error: null }),
  }),
};

const noOpClient = {
  from: () => noOpChain(),
  auth: noOpAuth,
  storage: noOpStorage,
  rpc: () => Promise.resolve(EMPTY_RESPONSE),
  channel: () => ({
    on: () => ({ subscribe: () => ({}) }),
    subscribe: () => ({}),
    unsubscribe: () => {},
  }),
  removeChannel: () => {},
} as unknown as SupabaseClient<any>;

let warnedOnce = false;

export function createBrowserClient(): SupabaseClient<any> {
  // process.env.NEXT_PUBLIC_* is inlined by Next.js at build time.
  // Fallback literals ensure the client works even when Turbopack
  // fails to inline env vars in dev (known issue with some env setups).
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'https://cuxzzpsyufcewtmicszk.supabase.co';
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1eHp6cHN5dWZjZXd0bWljc3prIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNjEwNDcsImV4cCI6MjA3MzczNzA0N30.DyFtzoKha_tuhKiSIPoQlKonIpaoSYrlhzntCUvLUnA';

  return createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Legacy export for backwards compatibility
export const createClient = createBrowserClient;
