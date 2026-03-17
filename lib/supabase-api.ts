/** @deprecated Use '@/lib/supabase/server' instead. */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// No-op client returned when Supabase is not configured.
// All queries resolve to { data: null, error: null } so callers
// don't crash in environments without credentials.
function makeNoOpClient(): SupabaseClient<any> {
  const noopQuery: any = new Proxy({}, {
    get: (_t, prop) => {
      if (prop === 'single' || prop === 'maybeSingle')
        return () => Promise.resolve({ data: null, error: null });
      if (prop === 'then')
        return (resolve: (v: any) => any) =>
          Promise.resolve(resolve({ data: null, error: null, count: 0 }));
      return () => noopQuery;
    },
  });
  return {
    from: () => noopQuery,
    rpc: () => Promise.resolve({ data: null, error: null }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: null }),
        download: () => Promise.resolve({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
  } as unknown as SupabaseClient<any>;
}

/**
 * Create a Supabase client for API routes.
 * Returns a no-op client when credentials are missing — never throws.
 *
 * @deprecated Import from '@/lib/supabase/server' or '@/lib/supabase/admin' instead.
 */
export function createSupabaseClient(): SupabaseClient<any> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return makeNoOpClient();
  }

  try {
    return createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  } catch {
    return makeNoOpClient();
  }
}
