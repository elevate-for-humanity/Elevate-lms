import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { jsonOk, jsonErr } from '@/lib/http/apiResponse';
import { auditLog, AuditAction, AuditEntity } from '@/lib/logging/auditLog';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  const params = await context.params;
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonErr('Unauthorized', 401);
    }

    // Get invite details via RPC (no enumeration)
    const { data: invites, error: inviteError } = await supabase.rpc(
      'get_org_invite_by_token',
      { p_token: params.token }
    );

    if (inviteError || !invites || invites.length === 0) {
      return jsonErr('Invalid or expired invitation', 404);
    }

    const invite = invites[0];

    // Verify invite is for this user's email
    if (invite.email.toLowerCase() !== user.email?.toLowerCase()) {
      return jsonErr('This invitation is for a different email address', 403);
    }

    // Check expiration
    if (new Date(invite.expires_at) < new Date()) {
      return jsonErr('This invitation has expired', 410);
    }

    // Check if already accepted
    if (invite.accepted_at) {
      return jsonErr('This invitation has already been accepted', 409);
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', invite.organization_id)
      .eq('user_id', user.id)
      .single();

    if (existingMember) {
      return jsonErr('You are already a member of this organization', 409);
    }

    // Accept invite: add to organization_members
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: invite.organization_id,
        user_id: user.id,
        role: invite.role || 'member',
      });

    if (memberError) {
      return jsonErr('Failed to accept invitation', 500);
    }

    // Mark invite as accepted
    const { error: updateError } = await supabase
      .from('org_invites')
      .update({ accepted_at: new Date().toISOString() })
      .eq('token', params.token);

    if (updateError) {
      // Don't fail - member was added successfully
    }

    // Audit log
    await auditLog({
      actorId: user.id,
      action: AuditAction.ORG_INVITE_ACCEPTED,
      entity: AuditEntity.INVITE,
      entityId: invite.id,
      metadata: {
        organization_id: invite.organization_id,
        organization_name: invite.organization_name,
        role: invite.role || 'member',
      },
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    });

    return jsonOk({
      message: 'Invitation accepted successfully',
      organizationId: invite.organization_id,
      organizationName: invite.organization_name,
    });
  } catch (error) { 
    return jsonErr('Internal server error', 500);
  }
}
