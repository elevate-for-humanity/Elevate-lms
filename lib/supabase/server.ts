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

// Returns a real Supabase client. Returns mockClient if env vars are missing.
// Never throws, never returns null — callers can safely use .auth and .from.
export async function createClient(): Promise<SupabaseClient<any>> {
  const config = getServerPublicSupabaseConfig();
  if (!config) {
    return mockClient;
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
    return mockClient;
  }
}

// Cookie-free client for public data reads (keeps pages statically renderable).
// Uses the anon key with no session — do NOT use for auth-gated queries.
// Returns mockClient if the Supabase constructor fails (e.g. during static prerender).
export function createPublicClient(): SupabaseClient<any> {
  const config = getServerPublicSupabaseConfig();
  if (!config) return mockClient;
  const { url: supabaseUrl, anonKey: supabaseAnonKey } = config;

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

// Re-export safeGetUser from shared for backward compatibility
export { safeGetUser } from '@/lib/supabase/shared';
