// POST /api/org/invite/[inviteId]/resend — resend an org invitation email
// Refreshes the expiry to 7 days from now and re-sends the invite email.
// Auth: org_admin or higher for the invite's organization.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getOrgContext } from '@/lib/org/getOrgContext';
import { requireOrgAccess } from '@/lib/auth/org-guard';
import { sendOrgInviteEmail } from '@/lib/email/sendOrgInviteEmail';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  const rateLimited = await applyRateLimit(request, 'contact');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return safeError('Unauthorized', 401);

  const { inviteId } = await params;

  const db = await getAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  // Fetch invite
  const { data: invite, error: fetchError } = await db
    .from('org_invites')
    .select('id, email, role, token, organization_id, accepted_at')
    .eq('id', inviteId)
    .maybeSingle();

  if (fetchError) return safeInternalError(fetchError, 'POST /api/org/invite/[inviteId]/resend fetch');
  if (!invite) return safeError('Invitation not found', 404);
  if (invite.accepted_at) return safeError('Invitation has already been accepted', 409);

  // Require org_admin for the invite's org
  try {
    await requireOrgAccess(request, invite.organization_id, 'org_admin');
  } catch (res) {
    return res as NextResponse;
  }

  // Refresh expiry
  const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { error: updateError } = await db
    .from('org_invites')
    .update({ expires_at: newExpiry })
    .eq('id', inviteId);

  if (updateError) return safeInternalError(updateError, 'POST /api/org/invite/[inviteId]/resend update');

  // Re-send email if SendGrid is configured
  if (process.env.SENDGRID_API_KEY) {
    try {
      const { data: org } = await db
        .from('organizations')
        .select('name')
        .eq('id', invite.organization_id)
        .maybeSingle();

      const { data: inviterProfile } = await db
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();

      const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/accept-invite?token=${invite.token}`;

      await sendOrgInviteEmail({
        to: invite.email,
        inviteUrl,
        organizationName: org?.name ?? 'your organization',
        inviterName: inviterProfile?.full_name ?? undefined,
      });
    } catch {
      // Email failure is non-fatal — invite expiry was already refreshed
    }
  }

  return NextResponse.json({ ok: true });
}
