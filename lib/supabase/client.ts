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
import { getBrowserPublicSupabaseConfig } from '@/lib/supabase/public-config';

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
  signInWithPassword: () =>
    Promise.resolve({
      data: { user: null, session: null },
      error: { message: 'Supabase not configured' },
    }),
  signInWithOAuth: () =>
    Promise.resolve({
      data: { url: null, provider: null },
      error: { message: 'Supabase not configured' },
    }),
  signUp: () =>
    Promise.resolve({
      data: { user: null, session: null },
      error: { message: 'Supabase not configured' },
    }),
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

let cachedClient: SupabaseClient<any> | null = null;
let cachedConfigKey: string | null = null;

/** Call after runtime config is injected (hydrate or head script). */
export function resetSupabaseBrowserClientCache(): void {
  cachedClient = null;
  cachedConfigKey = null;
  warnedOnce = false;
}

export function createBrowserClient(): SupabaseClient<any> {
  const publicConfig = getBrowserPublicSupabaseConfig();
  const supabaseUrl = publicConfig?.url;
  const supabaseAnonKey = publicConfig?.anonKey;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (!warnedOnce) {
      logger.error(
        '[Supabase Browser] Auth is misconfigured (missing or placeholder NEXT_PUBLIC_SUPABASE_*). Login and client actions will not work.',
      );
      warnedOnce = true;
    }
    return noOpClient;
  }

  const configKey = `${supabaseUrl}:${supabaseAnonKey.slice(0, 12)}`;
  if (cachedClient && cachedConfigKey === configKey) {
    return cachedClient;
  }

  try {
    const client = createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey);
    cachedClient = client;
    cachedConfigKey = configKey;

    // Silently clear stale sessions when the refresh token is invalid or expired.
    // Without this, Supabase logs "Invalid Refresh Token: Refresh Token Not Found"
    // as an unhandled error every time a user with an old session cookie visits
    // any page — it's expected browser behaviour, not an application error.
    client.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED' && !session) {
        // Refresh succeeded but returned no session — sign out to clear cookies
        client.auth.signOut().catch(() => {});
      }
      // Handle case where refresh token was already used (parallel requests)
      if (event === 'TOKEN_REFRESHED' && session === null) {
        client.auth.signOut().catch(() => {});
      }
    });

    // Also wrap getUser for consistency
    const originalGetUser = client.auth.getUser.bind(client.auth);
    client.auth.getUser = async () => {
      const result = await originalGetUser();
      if (
        result.error &&
        (result.error.message?.includes('refresh_token_already_used') ||
          result.error.code === 'refresh_token_already_used')
      ) {
        await client.auth.signOut().catch(() => {});
        return { data: { user: null }, error: null };
      }
      return result;
    };

    // Intercept token refresh errors by wrapping getSession — Supabase fires
    // these synchronously on client init when the stored refresh token is stale.
    const originalGetSession = client.auth.getSession.bind(client.auth);
    client.auth.getSession = async () => {
      const result = await originalGetSession();
      if (
        result.error &&
        (result.error.message?.includes('Refresh Token Not Found') ||
          result.error.message?.includes('Invalid Refresh Token') ||
          result.error.message?.includes('refresh_token_not_found') ||
          result.error.message?.includes('refresh_token_already_used') ||
          result.error.code === 'refresh_token_already_used')
      ) {
        // Stale cookie — clear it silently so the user gets a clean anonymous state
        await client.auth.signOut().catch(() => {});
        return { data: { session: null }, error: null };
      }
      return result;
    };

    return client;
  } catch {
    return noOpClient;
  }
}

// Legacy export for backwards compatibility
export const createClient = createBrowserClient;
