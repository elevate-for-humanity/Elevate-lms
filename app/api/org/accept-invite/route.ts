/**
 * POST /api/org/accept-invite  — accept an invitation by token
 * GET  /api/org/accept-invite?token=  — fetch invite details for display
 *
 * Invite table: org_invites (canonical).
 * On acceptance: inserts into organization_users (status='active'),
 * binds profile.organization_id, optionally enrolls into cohort,
 * then marks invite accepted_at.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { bindUserToOrg } from '@/lib/org/bindUserToOrg';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// ─── GET — fetch invite details for the accept-invite landing page ────────────

async function _GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'public');
  if (rateLimited) return rateLimited;

  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  if (!token) return safeError('Missing token', 400);

  const db = createAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  try {
    const { data: invite, error } = await db
      .from('org_invites')
      .select(`
        email,
        role,
        expires_at,
        organizations:organization_id ( name )
      `)
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (error) return safeInternalError(error, 'GET /api/org/accept-invite select');
    if (!invite) return safeError('Invalid or expired invitation', 404);

    return NextResponse.json({
      invite: {
        email:             invite.email,
        role:              invite.role,
        expires_at:        invite.expires_at,
        organization_name: (invite.organizations as any)?.name ?? '',
      },
    });
  } catch (err) {
    return safeInternalError(err, 'GET /api/org/accept-invite');
  }
}

// ─── POST — accept the invitation ────────────────────────────────────────────

async function _POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'auth');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return safeError('Unauthorized', 401);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return safeError('Invalid JSON', 400);
  }

  const { token } = body;
  if (!token) return safeError('Missing token', 400);

  const db = createAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  try {
    // Fetch invite — must be non-expired and not yet accepted
    const { data: invite, error: inviteError } = await db
      .from('org_invites')
      .select('id, organization_id, email, role, cohort_id, expires_at, accepted_at')
      .eq('token', token)
      .maybeSingle();

    if (inviteError) return safeInternalError(inviteError, 'POST /api/org/accept-invite fetch');
    if (!invite)     return safeError('Invalid or expired invitation', 404);

    if (invite.accepted_at) {
      return safeError('This invitation has already been accepted', 409);
    }

    if (new Date(invite.expires_at) < new Date()) {
      return safeError('This invitation has expired', 410);
    }

    // Already a member?
    const { data: existing } = await db
      .from('organization_users')
      .select('id')
      .eq('organization_id', invite.organization_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      return safeError('You are already a member of this organization', 409);
    }

    // Add to organization_users
    const { error: memberError } = await db
      .from('organization_users')
      .insert({
        organization_id: invite.organization_id,
        user_id:         user.id,
        role:            invite.role,
        status:          'active',
      });

    if (memberError) return safeInternalError(memberError, 'POST /api/org/accept-invite insert member');

    // Bind profile.organization_id
    await bindUserToOrg(supabase, user.id, invite.organization_id);

    // Optional cohort enrollment
    if (invite.cohort_id) {
      await db
        .from('cohort_enrollments')
        .upsert(
          {
            cohort_id:         invite.cohort_id,
            learner_id:        user.id,
            enrollment_status: 'active',
            enrolled_at:       new Date().toISOString(),
          },
          { onConflict: 'cohort_id,learner_id' }
        );
    }

    // Mark accepted
    await db
      .from('org_invites')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invite.id);

    return NextResponse.json({
      success:        true,
      organizationId: invite.organization_id,
      role:           invite.role,
    });
  } catch (err) {
    return safeInternalError(err, 'POST /api/org/accept-invite');
  }
}

export const GET  = withApiAudit('/api/org/accept-invite', _GET);
export const POST = withApiAudit('/api/org/accept-invite', _POST);
