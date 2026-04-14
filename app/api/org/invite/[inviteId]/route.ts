// DELETE /api/org/invite/[inviteId] — revoke a pending org invitation
// Auth: org_admin or higher for the invite's organization.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getOrgContext } from '@/lib/org/getOrgContext';
import { requireOrgAccess } from '@/lib/auth/org-guard';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return safeError('Unauthorized', 401);

  const { inviteId } = await params;

  const db = await getAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  // Fetch invite to verify org ownership before deleting
  const { data: invite, error: fetchError } = await db
    .from('org_invites')
    .select('id, organization_id')
    .eq('id', inviteId)
    .maybeSingle();

  if (fetchError) return safeInternalError(fetchError, 'DELETE /api/org/invite/[inviteId] fetch');
  if (!invite) return safeError('Invitation not found', 404);

  // Require org_admin for the invite's org
  try {
    await requireOrgAccess(request, invite.organization_id, 'org_admin');
  } catch (res) {
    return res as NextResponse;
  }

  const { error: deleteError } = await db
    .from('org_invites')
    .delete()
    .eq('id', inviteId);

  if (deleteError) return safeInternalError(deleteError, 'DELETE /api/org/invite/[inviteId] delete');

  return NextResponse.json({ ok: true });
}
