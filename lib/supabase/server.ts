import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Standard Supabase Server Client
 */
export async function createClient() {
  const cookieStore = await cookies();

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
 */
export async function createPublicClient() {
  const { createClient: createBaseClient } = await import('@supabase/supabase-js');
  return createBaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
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
