import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { getOrgContext } from '@/lib/org/getOrgContext';
import { sendOrgInviteEmail } from '@/lib/email/sendOrgInviteEmail';
import * as crypto from 'node:crypto';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ctx = await getOrgContext(supabase, user.id);

    // Only org_admin and super_admin can invite
    if (!['org_admin', 'super_admin'].includes(ctx.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { email, role, organization_id } = body;

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: email, role' },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Use current org if not specified
    const targetOrgId = organization_id || ctx.organization_id;

    // Verify user has permission for target org
    if (targetOrgId !== ctx.organization_id && ctx.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Cannot invite to different organization' },
        { status: 403 }
      );
    }

    // Check if there's already a pending invite for this email
    const { data: pendingInvite } = await supabase
      .from('org_invites')
      .select('id')
      .eq('email', normalizedEmail)
      .eq('organization_id', targetOrgId)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (pendingInvite) {
      return NextResponse.json(
        { error: 'Invite already pending for this email' },
        { status: 409 }
      );
    }

    // Check if invited email already has an account and is a member
    const { data: invitedProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    if (invitedProfile) {
      // User exists - check if already a member
      const { data: existingMembership } = await supabase
        .from('organization_users')
        .select('id')
        .eq('organization_id', targetOrgId)
        .eq('user_id', invitedProfile.id)
        .single();

      if (existingMembership) {
        return NextResponse.json(
          { error: 'User already member of organization' },
          { status: 409 }
        );
      }
    }

    // Generate secure token
    const token = crypto.randomUUID();

    // Create invite
    const { data: invite, error: inviteError } = await supabase
      .from('org_invites')
      .insert({
        email: normalizedEmail,
        role,
        token,
        organization_id: targetOrgId,
        created_by: user.id,
        expires_at: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
      })
      .select()
      .single();

    if (inviteError) {
      throw inviteError;
    }

    const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/accept-invite?token=${token}`;

    // Send email if RESEND_API_KEY is configured
    if (process.env.RESEND_API_KEY) {
      const { data: inviterProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      await sendOrgInviteEmail({
        to: normalizedEmail,
        inviteUrl,
        organizationName: ctx.organization.name,
        inviterName: inviterProfile?.full_name || undefined,
      });
    }

    return NextResponse.json({
      invite,
      message: 'Invite created successfully',
      invite_url: inviteUrl,
      email_sent: !!process.env.RESEND_API_KEY,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        err:
          ('Internal server error') ||
          'Failed to create invite',
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ctx = await getOrgContext(supabase, user.id);

    // Only org_admin and super_admin can view invites
    if (!['org_admin', 'super_admin'].includes(ctx.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { data: invites, error } = await supabase
      .from('org_invites')
      .select('*')
      .eq('organization_id', ctx.organization_id)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ invites });
  } catch (err: any) {
    return NextResponse.json(
      {
        err:
          ('Internal server error') ||
          'Failed to fetch invites',
      },
      { status: 500 }
    );
  }
}
