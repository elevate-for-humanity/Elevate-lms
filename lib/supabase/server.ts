import { timedFetch } from '@/lib/supabase/timed-fetch';
import { logger } from '@/lib/logger';
import { withSupabaseAuthCookieDomain } from '@/lib/supabase/auth-cookie-domain';
import { resolveServerSupabaseEnv } from '@/lib/supabase/server-env';
import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

// Supabase fetch with a hard timeout to prevent cold-start hangs on slow container starts.
// Mock client that returns empty data - prevents crashes when Supabase isn't configured
const mockQueryBuilder = {
  select: () => mockQueryBuilder,
  insert: () => mockQueryBuilder,
  update: () => mockQueryBuilder,
  delete: () => mockQueryBuilder,
  eq: () => mockQueryBuilder,
  neq: () => mockQueryBuilder,
  gt: () => mockQueryBuilder,
  gte: () => mockQueryBuilder,
  lt: () => mockQueryBuilder,
  lte: () => mockQueryBuilder,
  like: () => mockQueryBuilder,
  ilike: () => mockQueryBuilder,
  is: () => mockQueryBuilder,
  in: () => mockQueryBuilder,
  contains: () => mockQueryBuilder,
  containedBy: () => mockQueryBuilder,
  not: () => mockQueryBuilder,
  or: () => mockQueryBuilder,
  filter: () => mockQueryBuilder,
  match: () => mockQueryBuilder,
  textSearch: () => mockQueryBuilder,
  order: () => mockQueryBuilder,
  limit: () => mockQueryBuilder,
  range: () => mockQueryBuilder,
  single: () => Promise.resolve({ data: null, error: null }),
  maybeSingle: () => Promise.resolve({ data: null, error: null }),
  then: (resolve: any) => resolve({ data: null, error: null, count: 0 }),
};

const mockClient = {
  from: () => mockQueryBuilder,
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    signOut: () => Promise.resolve({ error: null }),
  },
  storage: {
    from: () => ({
      upload: () => Promise.resolve({ data: null, error: null }),
      download: () => Promise.resolve({ data: null, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
    }),
  },
  rpc: () => Promise.resolve({ data: null, error: null }),
} as unknown as SupabaseClient<any>;

// Returns a real Supabase client. Throws if env vars are missing — misconfiguration
// must be caught immediately, not silently swallowed by a mock.
export async function createClient(): Promise<SupabaseClient<any>> {
  const resolved = resolveServerSupabaseEnv();
  if (!resolved) {
    throw new Error(
      '[Supabase] Missing or placeholder NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
        'Set real Supabase credentials in the deployment secret group (not build-placeholder).',
    );
  }

  const { url: supabaseUrl, anonKey: supabaseAnonKey } = resolved;

  try {
    const cookieStore = await cookies();

    const client = createServerClient(supabaseUrl, supabaseAnonKey, {
      global: { fetch: timedFetch },
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
                ? withSupabaseAuthCookieDomain(options)
                : options;
              cookieStore.set(name, value, cookieOptions);
            });
          } catch {
            // Server Component - cookies are read-only
          }
        },
      },
    });

    // Intercept refresh token errors to prevent infinite retry loops.
    // When a refresh token has already been used (e.g., from parallel requests or
    // a race condition), Supabase throws "Invalid Refresh Token: Already Used".
    // We catch this, sign out the user, and return a clean client state.
    const originalGetUser = client.auth.getUser.bind(client.auth);
    client.auth.getUser = async () => {
      try {
        return await originalGetUser();
      } catch (error: any) {
        if (
          error?.message?.includes('refresh_token_already_used') ||
          error?.message?.includes('Invalid Refresh Token') ||
          error?.code === 'refresh_token_already_used'
        ) {
          // Clear the stale session and return null user
          await client.auth.signOut().catch(() => {});
          return { data: { user: null }, error: null };
        }
        throw error;
      }
    };

    const originalGetSession = client.auth.getSession.bind(client.auth);
    client.auth.getSession = async () => {
      try {
        return await originalGetSession();
      } catch (error: any) {
        if (
          error?.message?.includes('refresh_token_already_used') ||
          error?.message?.includes('Invalid Refresh Token') ||
          error?.code === 'refresh_token_already_used'
        ) {
          await client.auth.signOut().catch(() => {});
          return { data: { session: null }, error: null };
        }
        throw error;
      }
    };

    return client;
  } catch (error) {
    // cookies() throws during static prerender — this is expected and handled.
    // Only log in development; at build time this fires for every static page
    // and produces hundreds of noisy error lines in the build log.
    if (process.env.NODE_ENV === 'development') {
      logger.error('[Supabase Server] Failed to create client:', error);
    }
    return mockClient;
  }
}

// Cookie-free client for public data reads (keeps pages statically renderable).
// Uses the anon key with no session — do NOT use for auth-gated queries.
// Returns mockClient if the Supabase constructor fails (e.g. during static prerender).
export function createPublicClient(): SupabaseClient<any> {
  const resolved = resolveServerSupabaseEnv();
  if (!resolved) {
    return mockClient;
  }

  const { url: supabaseUrl, anonKey: supabaseAnonKey } = resolved;

  try {
    return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: { fetch: timedFetch },
    });
  } catch {
    // Supabase client constructor can fail during static prerendering
    return mockClient;
  }
}

// createAdminClient was previously re-exported here for backward compatibility.
// All call sites have been migrated to import requireAdminClient() directly from
// '@/lib/supabase/admin'. This re-export is intentionally removed to prevent
// new code from bypassing the deprecation boundary.

// Backward-compatible alias for existing imports.
export const createSupabaseServerClient = createClient;
