import { createClient } from '@/lib/supabase/server';

import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';

import { auditMutation } from '@/lib/api/withAudit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { auditedMutation } from '@/lib/audit/transactional';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (
      !profile ||
      (profile.role !== 'admin' && profile.role !== 'super_admin')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { verificationId, action, rejectionReason, adminId } =
      await request.json();

    if (!verificationId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const status = action === 'approve' ? 'approved' : 'rejected';

    const { error: updateError } = await auditedMutation({
      table: 'id_verifications',
      operation: 'update',
      rowData: {
        status,
        verified_by: adminId,
        verified_at: new Date().toISOString(),
        rejection_reason: action === 'reject' ? rejectionReason : null,
      },
      filter: { id: verificationId },
      audit: {
        action: 'api:post:/api/admin/verifications/review',
        actorId: user.id,
        targetType: 'id_verifications',
        targetId: verificationId,
        metadata: { decision: action },
      },
    });

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update verification' },
        { status: 500 }
      );
    }

    // Fetch verification record
    const { data: verification } = await supabase
      .from('id_verifications')
      .select('*')
      .eq('id', verificationId)
      .single();

    if (!verification) {
      return NextResponse.json({ success: true });
    }

    // Hydrate profile separately (user_id → auth.users, no FK to profiles)
    const { data: verifProfile } = verification.user_id
      ? await supabase.from('profiles').select('id, full_name, email').eq('id', verification.user_id).maybeSingle()
      : { data: null };

    await logAdminAudit({
      action: AdminAction.VERIFICATION_REVIEWED,
      actorId: user.id,
      entityType: 'id_verifications',
      entityId: verificationId,
      metadata: { decision: action, user_id: verification.user_id },
      req: request,
    });

    const userProfile = verifProfile as any;
    if (userProfile?.email) {
      await sendEmail({
        to: userProfile.email,
        subject: `ID Verification ${status === 'approved' ? 'Approved' : 'Rejected'}`,
        html: `
          <h2>Identity Verification Update</h2>
          <p>Your identity verification has been ${status}.</p>
          ${status === 'rejected' ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
          <p>Login to view details: <a href="${process.env.NEXT_PUBLIC_SITE_URL}/verify-identity">View Verification</a></p>
        `,
      });
    }

    return NextResponse.json({ success: true, verification });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/admin/verifications/review', _POST, { critical: true });
