/**
 * lib/auth/org-guard.ts
 *
 * Canonical org-scoped route protection.
 *
 * Role vocabulary matches organization_users.role constraint:
 *   report_viewer → instructor → reviewer → org_admin → org_owner
 *
 * Usage in an API route:
 *
 *   try {
 *     const actor = await requireOrgAccess(request, orgId, 'org_admin');
 *   } catch (res) {
 *     return res as NextResponse;
 *   }
 *
 * Platform admins (profiles.is_platform_admin = true) bypass org membership
 * checks and receive org_owner-level access to any org.
 *
 * This is the only place role hierarchy is defined. Do not duplicate it.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// ─── Role vocabulary ──────────────────────────────────────────────────────────
// Must match the CHECK constraint on organization_users.role.
// Order is lowest → highest privilege.

export type OrgRole =
  | 'report_viewer'
  | 'instructor'
  | 'reviewer'
  | 'org_admin'
  | 'org_owner';

export const ORG_ROLE_HIERARCHY: OrgRole[] = [
  'report_viewer',
  'instructor',
  'reviewer',
  'org_admin',
  'org_owner',
];

export interface OrgActor {
  userId:          string;
  orgId:           string;
  role:            OrgRole;
  isPlatformAdmin: boolean;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function roleLevel(role: OrgRole): number {
  return ORG_ROLE_HIERARCHY.indexOf(role);
}

function meetsMinRole(actual: OrgRole, min: OrgRole): boolean {
  return roleLevel(actual) >= roleLevel(min);
}

// ─── requireOrgAccess ─────────────────────────────────────────────────────────

/**
 * Verifies the session user belongs to `orgId` with at least `minRole`.
 * Throws a NextResponse (401 or 403) on failure — callers must catch and return it:
 *
 *   try {
 *     const actor = await requireOrgAccess(request, orgId, 'org_admin');
 *   } catch (res) {
 *     return res as NextResponse;
 *   }
 */
export async function requireOrgAccess(
  request: NextRequest,
  orgId:   string,
  minRole: OrgRole = 'report_viewer'
): Promise<OrgActor> {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();

  if (authErr || !user) {
    throw NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = createAdminClient();
  if (!db) {
    throw NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  // Platform admins bypass org membership — treated as org_owner everywhere
  const { data: profile } = await db
    .from('profiles')
    .select('is_platform_admin')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.is_platform_admin === true) {
    return { userId: user.id, orgId, role: 'org_owner', isPlatformAdmin: true };
  }

  // Resolve org membership — status column added by migration 20260328000001
  const { data: membership, error: memberErr } = await db
    .from('organization_users')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (memberErr || !membership) {
    throw NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const role = membership.role as OrgRole;

  if (!meetsMinRole(role, minRole)) {
    throw NextResponse.json(
      { error: `Requires ${minRole} or higher` },
      { status: 403 }
    );
  }

  return { userId: user.id, orgId, role, isPlatformAdmin: false };
}

// ─── getSessionOrg ────────────────────────────────────────────────────────────

/**
 * Returns the first active org for the current session user.
 * Useful for single-org portals where the org is implicit in the session.
 * Returns null if the user has no active org membership.
 */
export async function getSessionOrg(
  request: NextRequest
): Promise<{ orgId: string; role: OrgRole } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const db = createAdminClient();
  if (!db) return null;

  const { data } = await db
    .from('organization_users')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return { orgId: data.organization_id, role: data.role as OrgRole };
}

// ─── assertOrgRole ────────────────────────────────────────────────────────────

/**
 * Lightweight role check for Server Components (not API routes).
 * Returns true if the user has at least `minRole` in `orgId`.
 */
export async function assertOrgRole(
  userId:  string,
  orgId:   string,
  minRole: OrgRole = 'report_viewer'
): Promise<boolean> {
  const db = createAdminClient();
  if (!db) return false;

  const { data: profile } = await db
    .from('profiles')
    .select('is_platform_admin')
    .eq('id', userId)
    .maybeSingle();

  if (profile?.is_platform_admin === true) return true;

  const { data: membership } = await db
    .from('organization_users')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (!membership) return false;

  return meetsMinRole(membership.role as OrgRole, minRole);
}
