import { logger } from '@/lib/logger';
/**
 * Supabase Browser Client
 * For use in Client Components only
 *
 * Requires real configuration; connection failures must never look like empty data.
 */

import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getBrowserPublicSupabaseConfig } from '@/lib/supabase/public-config';
import { getBrowserAuthFetch } from '@/lib/supabase/browser-auth-fetch';

// @supabase/ssr returns a cached browser client. Install listeners and wrappers
// once per client, rather than stacking another auth layer on every render.
const initializedBrowserClients = new WeakSet<SupabaseClient<any>>();

export function createBrowserClient(): SupabaseClient<any> {
  // process.env.NEXT_PUBLIC_* is inlined by Next.js at build time.
  // Fallback literals ensure the client works even when Turbopack
  // fails to inline env vars in dev (known issue with some env setups).
  const config = getBrowserPublicSupabaseConfig();
  const supabaseUrl = config?.url;
  const supabaseAnonKey = config?.anonKey;

  const misconfigured =
    !supabaseUrl ||
    !supabaseAnonKey ||
    supabaseAnonKey === 'placeholder' ||
    supabaseUrl.includes('placeholder');

  if (misconfigured) {
    throw new Error('SUPABASE_CONFIGURATION_MISSING: Database connection configuration is unavailable.');
  }

  try {
    const hostname = typeof window === 'undefined' ? '' : window.location.hostname;
    const sharedPortalSession =
      hostname === 'elevateforhumanity.org' || hostname.endsWith('.elevateforhumanity.org');
    const client = createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey, {
      global: { fetch: getBrowserAuthFetch(supabaseUrl) },
      cookieOptions: sharedPortalSession
        ? {
            domain: '.elevateforhumanity.org',
            path: '/',
            secure: true,
            sameSite: 'lax',
          }
        : { path: '/', sameSite: 'lax' },
    });

    if (initializedBrowserClients.has(client)) return client;

    // Silently clear stale sessions when the refresh token is invalid or expired.
    // Without this, Supabase logs "Invalid Refresh Token: Refresh Token Not Found"
    // as an unhandled error every time a user with an old session cookie visits
    // any page — it's expected browser behaviour, not an application error.
    client.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED' && !session) {
        // Refresh succeeded but returned no session — sign out to clear cookies
        client.auth.signOut({ scope: 'local' }).catch(() => {});
      }
    });

    // Intercept token refresh errors by wrapping getSession — Supabase fires
    // these synchronously on client init when the stored refresh token is stale.
    const originalGetSession = client.auth.getSession.bind(client.auth);
    client.auth.getSession = async () => {
      const result = await originalGetSession();
      if (
        result.error &&
        (result.error.message?.includes('Refresh Token Not Found') ||
          result.error.message?.includes('Invalid Refresh Token') ||
          result.error.message?.includes('refresh_token_not_found'))
      ) {
        // Stale cookie — clear it silently so the user gets a clean anonymous state
        await client.auth.signOut({ scope: 'local' }).catch(() => {});
        return { data: { session: null }, error: null };
      }
      return result;
    };

    initializedBrowserClients.add(client);
    return client;
  } catch (error) {
    logger.error('[Supabase Browser] Client initialization failed', error);
    throw error;
  }
}

// Legacy export for backwards compatibility
export const createClient = createBrowserClient;

// No-op cache reset for dynamic config updates (called from public-config.ts)
export function resetSupabaseBrowserClientCache(): void {
  // The SSR SDK owns the browser singleton; retain it and its refresh backoff.
  // This function exists for API compatibility
}
