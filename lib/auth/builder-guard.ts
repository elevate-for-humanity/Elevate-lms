/**
 * lib/auth/builder-guard.ts
 *
 * Authorization guard for program/course builder routes.
 *
 * Platform admins (admin, admin, staff) can access any org's content.
 * Org members (org_owner, org_admin, program_manager, editor) can only access
 * their own org's content.
 *
 * Usage:
 *   const access = await builderGuard(request, programOrgId);
 *   if (access.error) return access.error;
 *   // access.user, access.orgId, access.isPlatformAdmin
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export type BuilderAccess =
  | {
      error: null;
      user: { id: string; email: string };
      orgId: string | null;
      isPlatformAdmin: boolean;
    }
  | {
      error: NextResponse;
    };

const PLATFORM_ADMIN_ROLES = ['admin', 'staff'] as const;
const BUILDER_ORG_ROLES = [
  'org_owner',
  'org_admin',
  'program_manager',
  'editor',
  'reviewer',
] as const;

/**
 * Guards a builder route.
 *
 * @param request  - Incoming request
 * @param resourceOrgId - org_id of the resource being accessed (null = platform-owned)
 *
 * Platform admins pass regardless of resourceOrgId.
 * Org members pass only if their org_id matches resourceOrgId.
 */
export async function builderGuard(
  request: NextRequest,
  resourceOrgId: string | null,
): Promise<BuilderAccess> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const db = await requireAdminClient();
  if (!db) {
    return { error: NextResponse.json({ error: 'Service unavailable' }, { status: 503 }) };
  }

  // Check platform role first
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const isPlatformAdmin = PLATFORM_ADMIN_ROLES.includes(profile?.role as any);

  if (isPlatformAdmin) {
    return {
      error: null,
      user: { id: user.id, email: user.email! },
      orgId: resourceOrgId,
      isPlatformAdmin: true,
    };
  }

  // Not a platform admin — check org membership
  if (!resourceOrgId) {
    // Platform-owned resource — org members cannot access
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  const { data: membership } = await db
    .from('organization_users')
    .select('role, status')
    .eq('org_id', resourceOrgId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership || membership.status !== 'active') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  if (!BUILDER_ORG_ROLES.includes(membership.role as any)) {
    return { error: NextResponse.json({ error: 'Insufficient role' }, { status: 403 }) };
  }

  logger.info('[builder-guard] org member access granted', {
    userId: user.id,
    orgId: resourceOrgId,
    role: membership.role,
  });

  return {
    error: null,
    user: { id: user.id, email: user.email! },
    orgId: resourceOrgId,
    isPlatformAdmin: false,
  };
}
