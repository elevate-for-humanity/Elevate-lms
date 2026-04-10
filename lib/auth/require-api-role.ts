import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient, getAdminClient } from '@/lib/supabase/admin';
import type { UserRole } from '@/types/database';

export interface ApiAuthResult {
  user: { id: string; email: string };
  profile: { id: string; role: UserRole; full_name?: string; tenant_id?: string; is_active?: boolean };
  /** RLS-respecting client scoped to the authenticated user. */
  db: Awaited<ReturnType<typeof createClient>>;
  /** Service-role client for cross-tenant admin queries. Only use when RLS must be bypassed. */
  adminDb: ReturnType<typeof createAdminClient>;
}

/**
 * Role-enforced auth for API routes.
 *
 * Returns the authenticated user + profile if authorized,
 * or a NextResponse (401/403) if not. Callers must check:
 *
 *   const auth = await requireApiRole(['employer', 'admin', 'super_admin']);
 *   if (auth instanceof NextResponse) return auth;
 *   // auth.user, auth.profile, auth.db are now available
 *
 * - 401: unauthenticated, no profile, or deactivated account
 * - 403: authenticated but wrong role
 * - Never redirects — always returns JSON
 * - Role is read from profiles table (DB truth, not JWT claim)
 * - auth.db is the user-scoped RLS client (default for all queries)
 * - auth.adminDb is the service-role client (only for explicit admin operations)
 */
export async function requireApiRole(
  allowedRoles: UserRole[],
): Promise<ApiAuthResult | NextResponse> {
  const supabase = await createClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 },
    );
  }

  // Use admin client for profile lookup to bypass RLS on profiles table,
  // then hand the RLS-respecting client to the caller for data queries.
  // await getAdminClient() throws if SUPABASE_SERVICE_ROLE_KEY is missing — no fallback.
  const admin = await getAdminClient();
  const profileDb = admin;

  const { data: profile } = await profileDb
    .from('profiles')
    .select('id, role, full_name, tenant_id, is_active')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return NextResponse.json(
      { error: 'Unauthorized — no profile' },
      { status: 401 },
    );
  }

  // Deactivated accounts are denied regardless of role
  if (profile.is_active === false) {
    return NextResponse.json(
      { error: 'Account deactivated' },
      { status: 401 },
    );
  }

  if (!allowedRoles.includes(profile.role as UserRole)) {
    return NextResponse.json(
      { error: 'Forbidden', required_roles: allowedRoles, actual_role: profile.role },
      { status: 403 },
    );
  }

  return {
    user: { id: user.id, email: user.email || '' },
    profile: profile as ApiAuthResult['profile'],
    db: supabase,
    adminDb: admin,
  };
}
