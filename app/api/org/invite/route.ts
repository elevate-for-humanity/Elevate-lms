/**
 * POST /api/org/invite  — create an org invitation
 * GET  /api/org/invite  — list pending invitations for the actor's org
 *
 * Auth: org_admin or org_owner (via requireOrgAccess).
 * Invite table: org_invites (canonical — do not use org_invitations).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getOrgContext } from '@/lib/org/getOrgContext';
import { requireOrgAccess } from '@/lib/auth/org-guard';
import { sendOrgInviteEmail } from '@/lib/email/sendOrgInviteEmail';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import * as crypto from 'node:crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function _POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'contact');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return safeError('Unauthorized', 401);

  let ctx;
  try {
    ctx = await getOrgContext(supabase, user.id);
  } catch {
    return safeError('No organization found for this user', 403);
  }

  // Require org_admin or higher
  try {
    await requireOrgAccess(req, ctx.organization_id, 'org_admin');
  } catch (res) {
    return res as NextResponse;
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return safeError('Invalid JSON', 400);
  }

  const { email, role, organization_id, cohort_id } = body;

  if (!email || !role) {
    return safeError('Missing required fields: email, role', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();
  const targetOrgId = organization_id || ctx.organization_id;

  // org_admin can only invite to their own org
  if (targetOrgId !== ctx.organization_id) {
    return safeError('Cannot invite to a different organization', 403);
  }

  const db = createAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  try {
    // Duplicate pending invite check
    const { data: pendingInvite } = await db
      .from('org_invites')
      .select('id')
      .eq('email', normalizedEmail)
      .eq('organization_id', targetOrgId)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (pendingInvite) {
      return safeError('A pending invitation already exists for this email', 409);
    }

    // Existing member check
    const { data: existingProfile } = await db
      .from('profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingProfile) {
      const { data: existingMembership } = await db
        .from('organization_users')
        .select('id')
        .eq('organization_id', targetOrgId)
        .eq('user_id', existingProfile.id)
        .maybeSingle();

      if (existingMembership) {
        return safeError('User is already a member of this organization', 409);
      }
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: invite, error: inviteError } = await db
      .from('org_invites')
      .insert({
        email:           normalizedEmail,
        role,
        token,
        organization_id: targetOrgId,
        created_by:      user.id,
        expires_at:      expiresAt,
        cohort_id:       cohort_id ?? null,
      })
      .select('id, email, role, expires_at')
      .single();

    if (inviteError) return safeInternalError(inviteError, 'POST /api/org/invite insert');

    const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/accept-invite?token=${token}`;

    if (process.env.SENDGRID_API_KEY) {
      const { data: inviterProfile } = await db
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();

      await sendOrgInviteEmail({
        to:               normalizedEmail,
        inviteUrl,
        organizationName: ctx.organization.name,
        inviterName:      inviterProfile?.full_name ?? undefined,
      });
    }

    return NextResponse.json({
      invite,
      invite_url:  inviteUrl,
      email_sent:  !!process.env.SENDGRID_API_KEY,
    });
  } catch (err) {
    return safeInternalError(err, 'POST /api/org/invite');
  }
}

async function _GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return safeError('Unauthorized', 401);

  let ctx;
  try {
    ctx = await getOrgContext(supabase, user.id);
  } catch {
    return safeError('No organization found for this user', 403);
  }

  try {
    await requireOrgAccess(req, ctx.organization_id, 'org_admin');
  } catch (res) {
    return res as NextResponse;
  }

  const db = createAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  try {
    const { data: invites, error } = await db
      .from('org_invites')
      .select('id, email, role, cohort_id, expires_at, created_at, accepted_at')
      .eq('organization_id', ctx.organization_id)
      .order('created_at', { ascending: false });

    if (error) return safeInternalError(error, 'GET /api/org/invite select');

    return NextResponse.json({ invites });
  } catch (err) {
    return safeInternalError(err, 'GET /api/org/invite');
  }
}

export const GET  = withApiAudit('/api/org/invite', _GET);
export const POST = withApiAudit('/api/org/invite', _POST);
