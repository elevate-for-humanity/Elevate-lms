import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { auditedMutation } from '@/lib/audit/transactional';

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await db
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

    const { documentId, action, rejectionReason, adminId } =
      await request.json();

    if (!documentId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const status = action === 'approve' ? 'approved' : 'rejected';

    const { data: updatedDoc, error: updateError } = await auditedMutation({
      table: 'documents',
      operation: 'update',
      rowData: {
        status,
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        rejection_reason: action === 'reject' ? rejectionReason : null,
      },
      filter: { id: documentId },
      audit: {
        action: 'api:post:/api/admin/documents/review',
        actorId: user.id,
        targetType: 'documents',
        targetId: documentId,
        metadata: { decision: action },
      },
    });

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update document' },
        { status: 500 }
      );
    }

    // Fetch joined profile data for email notifications
    const { data: document } = await db
      .from('documents')
      .select(`*, profiles:user_id (id, full_name, email)`)
      .eq('id', documentId)
      .single();

    if (!document) {
      return NextResponse.json({ success: true, document: updatedDoc });
    }

    const userProfile = document.profiles as any;
    const studentUserId = document.user_id;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

    await logAdminAudit({
      action: AdminAction.DOCUMENT_REVIEWED,
      actorId: user.id,
      entityType: 'documents',
      entityId: documentId,
      metadata: { decision: action, file_name: document.file_name, student_user_id: studentUserId },
      req: request,
    });

    if (userProfile?.email) {
      await sendEmail({
        to: userProfile.email,
        subject: `Document ${status === 'approved' ? 'Approved' : 'Rejected'} - ${document.file_name}`,
        html: `
          <h2>Document Review Update</h2>
          <p>Your document <strong>${document.file_name}</strong> has been ${status}.</p>
          ${status === 'rejected' ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
          <p>Login to view details: <a href="${siteUrl}/lms/documents">View Documents</a></p>
        `,
      });
    }

    return NextResponse.json({ success: true, document });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/admin/documents/review', _POST, { critical: true });
