import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Standard Supabase Server Client
 */
export async function createClient() {
  let cookieStore;
  try {
    cookieStore = await cookies();
  } catch {
    // cookies() called outside request context (build/static generation)
    // Return a minimal client that won't crash
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return []; },
          setAll() { /* no-op */ },
        },
      }
    );
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    }
  );
}

/**
 * Service Role Client - Bypass RLS for administrative tasks.
 */
export async function createSupabaseServerClient() {
  const { createClient: createBaseClient } = await import('@supabase/supabase-js');
  return createBaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/**
 * Public Client - No-auth client for public data.
 * Returns a minimal mock client if Supabase env vars are missing.
 */
export async function createPublicClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Return minimal mock for build/CI
    return {
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        eq: () => Promise.resolve({ data: [], error: null }),
      }),
    } as any;
  }

  try {
    const { createClient: createBaseClient } = await import('@supabase/supabase-js');
    return createBaseClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  } catch {
    // Return minimal mock on error
    return {
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        eq: () => Promise.resolve({ data: [], error: null }),
      }),
    } as any;
  }
}

/**
 * Check if Supabase is correctly configured in the environment.
 */
export function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/**
 * Safely extract user from Supabase auth response.
 */
export function safeGetUser(authRes: any): { id: string; email?: string | null } | null {
  return authRes?.data?.user ?? null;
}
