/**
 * Admin Auth Callback
 * Handles OAuth callbacks through the server Supabase client so the exchanged
 * session is written to the shared .elevateforhumanity.org auth cookies.
 */
import { NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { validateRedirect } from '@/lib/auth/validate-redirect';
import { normalizeRoles, ADMIN_ROLES } from '@/lib/rbac/role-matrix';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const requestedNext = requestUrl.searchParams.get('next');
  const next = validateRedirect(requestedNext, '/dashboard');

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL('/login?error=auth_unavailable', requestUrl.origin));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_oauth_code', requestUrl.origin));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(new URL('/login?error=oauth_failed', requestUrl.origin));
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle();

  if (profileError || !profile?.role) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL('/login?error=profile_unavailable', requestUrl.origin));
  }

  const { data: roleRows } = await supabase
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', data.user.id);

  const secondaryRoles = (roleRows ?? [])
    .map((row) => (row as { roles?: { name?: unknown } | null }).roles?.name)
    .filter((role): role is string => typeof role === 'string');
  const effectiveRoles = normalizeRoles([profile.role, ...secondaryRoles]);
  const allowed = effectiveRoles.some((role) => ADMIN_ROLES.includes(role));

  if (!allowed) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL('/login?error=forbidden', requestUrl.origin));
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
