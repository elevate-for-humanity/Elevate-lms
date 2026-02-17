
// =====================================================
// SERVER-SIDE AUTH GUARDS - MANDATORY FOR ALL PROTECTED ROUTES
// =====================================================

import { createServerSupabaseClient } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { logger } from '@/lib/logger';

/**
 * Require authentication for server components and API routes
 * Throws error if no session, redirects if in page context
 */
export async function requireAuth() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    logger.warn('Unauthorized access attempt - Supabase not configured');
    redirect('/login');
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    logger.warn('Unauthorized access attempt');
    redirect('/login');
  }

  // Get session for backward compatibility (tokens, etc.)
  const { data: { session } } = await supabase.auth.getSession();
  return session || { user, access_token: '', refresh_token: '', expires_in: 0, token_type: 'bearer' as const } as any;
}

/**
 * Get current session without throwing
 * Returns null if no session
 */
export async function getAuthSession() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Get current user with profile data
 */
export async function getCurrentUser() {
  const session = await requireAuth();

  const supabase = await createServerSupabaseClient();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error || !profile) {
    logger.error('Failed to load user profile', { userId: session.user.id, error });
    throw new Error('Profile not found');
  }

  return {
    ...session.user,
    profile,
  };
}

/**
 * API route auth guard
 * Returns 401 if no session
 */
export async function requireAuthAPI() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: { session } } = await supabase.auth.getSession();
  return session || { user, access_token: '', refresh_token: '', expires_in: 0, token_type: 'bearer' as const } as any;
}
