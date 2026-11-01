import { getServerPublicSupabaseConfig } from '@/lib/supabase/public-config';
import { createBrowserAuthFetch } from '@/lib/supabase/browser-auth-fetch';
import { timedFetch } from '@/lib/supabase/timed-fetch';
import { logger } from '@/lib/logger';
import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies, headers } from 'next/headers';
import { sessionCookieOptions } from '@/lib/auth/session-cookie-options';
import type { SupabaseClient } from '@supabase/supabase-js';

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return getServerPublicSupabaseConfig() !== null;
}

export async function createClient(): Promise<SupabaseClient<any>> {
  const config = getServerPublicSupabaseConfig();
  if (!config) {
    throw new Error('SUPABASE_CONFIGURATION_MISSING: Server database configuration is unavailable.');
  }

  const { url: supabaseUrl, anonKey: supabaseAnonKey } = config;

  try {
    const cookieStore = await cookies();
    const hostname = (await headers()).get('host') ?? '';

    return createServerClient(supabaseUrl, supabaseAnonKey, {
      global: { fetch: createBrowserAuthFetch(supabaseUrl, { fetchImpl: timedFetch }) },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Scope auth cookies to the root domain so the session is shared
              // across all elevateforhumanity.org subdomains.
              // Only apply to Supabase auth tokens — leave other cookies alone.
              const isAuthCookie = name.startsWith('sb-') && name.includes('-auth-token');
              const cookieOptions = isAuthCookie
                ? sessionCookieOptions(options, hostname)
                : options;
              cookieStore.set(name, value, cookieOptions);
            });
          } catch {
            // Server Component - cookies are read-only
          }
        },
      },
    });
  } catch (error) {
    // cookies() throws during static prerender — this is expected and handled.
    // Only log in development; at build time this fires for every static page
    // and produces hundreds of noisy error lines in the build log.
    if (process.env.NODE_ENV === 'development') {
      logger.error('[Supabase Server] Failed to create client:', error);
    }
    throw error;
  }
}

// Cookie-free client for public data reads (keeps pages statically renderable).
// Uses the anon key with no session — do NOT use for auth-gated queries.
// Configuration and initialization failures propagate to the caller.
export function createPublicClient(): SupabaseClient<any> {
  const config = getServerPublicSupabaseConfig();
  if (!config) throw new Error('SUPABASE_CONFIGURATION_MISSING: Public database configuration is unavailable.');
  const { url: supabaseUrl, anonKey: supabaseAnonKey } = config;

  try {
    return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: { fetch: timedFetch },
    });
  } catch (error) {
    logger.error('[Supabase Public] Client initialization failed', error);
    throw error;
  }
}

// createAdminClient was previously re-exported here for backward compatibility.
// All call sites have been migrated to import requireAdminClient() directly from
// '@/lib/supabase/admin'. This re-export is intentionally removed to prevent
// new code from bypassing the deprecation boundary.

// Backward-compatible alias for existing imports.
export const createSupabaseServerClient = createClient;

// Re-export safeGetUser from shared for backward compatibility
export { safeGetUser } from '@/lib/supabase/shared';
