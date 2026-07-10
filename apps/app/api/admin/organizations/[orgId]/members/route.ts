/**
 * GET  /api/admin/organizations/[orgId]/members
 *   Lists members of an org with their roles.
 *
 * POST /api/admin/organizations/[orgId]/members
 *   Adds a user to an org by email or user_id.
 *   Body: { email?: string; user_id?: string; role: OrgRole }
 *   Returns: { ok, member: { id, user_id, role } }
 *
 * DELETE /api/admin/organizations/[orgId]/members
 *   Removes a user from an org.
 *   Body: { user_id: string }
 *
 * Roles: org_owner | org_admin | instructor | reviewer | report_viewer
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const dynamic = 'force-dynamic';

const ORG_ROLES = ['org_owner', 'org_admin', 'instructor', 'reviewer', 'report_viewer'] as const;
type OrgRole = (typeof ORG_ROLES)[number];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const rl = await applyRateLimit(request, 'api');
  if (rl) return rl;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { orgId } = await params;
  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const { data, error } = await db
    .from('organization_users')
    .select('id, user_id, role, status, created_at, profiles(email, full_name)')
    .eq('org_id', orgId)
    .order('created_at');

  if (error) return safeInternalError(error, 'Failed to list members');
  return NextResponse.json({ ok: true, members: data ?? [] });
}

const addSchema = z
  .object({
    email: z.string().email().optional(),
    user_id: z.string().uuid().optional(),
    role: z.enum(ORG_ROLES),
  })
  .refine((d) => d.email || d.user_id, { message: 'email or user_id required' });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const rl = await applyRateLimit(request, 'strict');
  if (rl) return rl;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { orgId } = await params;
  let body: z.infer<typeof addSchema>;
  try {
    body = addSchema.parse(await request.json());
  } catch {
    return safeError('email or user_id, and role required', 400);
  }

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  // Verify org exists
  const { data: org } = await db.from('organizations').select('id').eq('id', orgId).maybeSingle();
  if (!org) return safeError('Organization not found', 404);

  // Resolve user_id from email if needed
  let userId = body.user_id;
  if (!userId && body.email) {
    const { data: profile } = await db
      .from('profiles')
      .select('id')
      .eq('email', body.email)
      .maybeSingle();
    if (!profile) return safeError(`No user found with email '${body.email}'`, 404);
    userId = profile.id;
  }

  // Upsert — update role if already a member
  const { data: member, error } = await db
    .from('organization_users')
    .upsert(
      { org_id: orgId, user_id: userId, role: body.role, status: 'active' },
      { onConflict: 'org_id,user_id' },
    )
    .select('id, user_id, role, status')
    .single();

  if (error) return safeInternalError(error, 'Failed to add member');
  return NextResponse.json({ ok: true, member }, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const rl = await applyRateLimit(request, 'strict');
  if (rl) return rl;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { orgId } = await params;
  const body = await request.json().catch(() => ({}));
  if (!body.user_id) return safeError('user_id required', 400);

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const { error } = await db
    .from('organization_users')
    .delete()
    .eq('org_id', orgId)
    .eq('user_id', body.user_id);

  if (error) return safeInternalError(error, 'Failed to remove member');
  return NextResponse.json({ ok: true });
}
