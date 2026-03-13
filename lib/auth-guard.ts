
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
 * Require a fully-linked partner identity.
 * Verifies: auth user → profiles row → partner_users row → partners org.
 * Returns the partner context or redirects to an error page.
 *
 * Auto-heals a missing profiles row if the auth user exists
 * (covers the orphaned-identity crash-between-steps scenario).
 */
export async function requirePartnerIdentity() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) redirect('/login');

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect('/partner/login');

  // Check profiles row
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', user.id)
    .single();

  if (!profile) {
    // Auto-heal: create minimal profile from auth metadata
    const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Partner User';
    const { error: insertErr } = await supabase
      .from('profiles')
      .insert({ id: user.id, role: 'partner', full_name: fullName, email: user.email });

    if (insertErr) {
      logger.error('Failed to auto-heal missing profile', { userId: user.id, error: insertErr.message });
      redirect('/partner/login?error=identity');
    }
  }

  // Check partner_users mapping
  const { data: partnerUser } = await supabase
    .from('partner_users')
    .select('partner_id, role, partners:partner_id(id, name, city, state, status)')
    .eq('user_id', user.id)
    .single();

  if (!partnerUser || !partnerUser.partner_id) {
    logger.warn('Partner user has no partner_users mapping', { userId: user.id, email: user.email });
    redirect('/partner/login?error=no_partner');
  }

  const org = (partnerUser as any).partners;
  if (!org) {
    logger.warn('Partner org not found for partner_users row', { userId: user.id, partnerId: partnerUser.partner_id });
    redirect('/partner/login?error=no_partner');
  }

  return {
    user,
    profile: profile || { id: user.id, role: 'partner' as const, full_name: user.user_metadata?.full_name },
    partnerUser,
    org,
    partnerId: partnerUser.partner_id,
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
