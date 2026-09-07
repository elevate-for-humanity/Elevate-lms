import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { sendEmail } from '@/lib/email';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { auditedMutation } from '@/lib/audit/transactional';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
    const auth = await apiRequireAdmin(request);
    if (auth.error) return auth.error;

    const db = await requireAdminClient();

    const { documentId, action, rejectionReason } = await request.json();

    if (!documentId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (action === 'reject' && !String(rejectionReason || '').trim()) {
      return NextResponse.json({ error: 'A rejection reason is required' }, { status: 400 });
    }

    const status = action === 'approve' ? 'approved' : 'rejected';
    // `status` is the workflow state, while `verification_status` has its own
    // database contract: pending | verified | rejected.
    const verificationStatus = action === 'approve' ? 'verified' : 'rejected';

    const { data: updatedDoc, error: updateError } = await auditedMutation({
      table: 'documents',
      operation: 'update',
      rowData: {
        status,
        verification_status: verificationStatus,
        verified: action === 'approve',
        verified_by: action === 'approve' ? auth.id : null,
        verified_at: action === 'approve' ? new Date().toISOString() : null,
        reviewed_by: auth.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: action === 'reject' ? rejectionReason : null,
      },
      filter: { id: documentId },
      audit: {
        action: 'api:post:/api/admin/documents/review',
        actorId: auth.id,
        targetType: 'documents',
        targetId: documentId,
        metadata: { decision: action },
      },
    });

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
    }

    // Fetch document record
    const { data: document } = await db
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .maybeSingle();

    if (!document) {
      return NextResponse.json({ success: true, document: updatedDoc });
    }

    // Hydrate profile separately (documents.user_id has no FK to profiles)
    const { data: docUserProfile } = document.user_id
      ? await db
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', document.user_id)
          .maybeSingle()
      : { data: null };
    const userProfile = docUserProfile as any;
    const studentUserId = document.user_id;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl;

    // The authoritative audit row was committed atomically by auditedMutation.
    // Legacy telemetry must never turn a successful review into a false failure.
    try {
      await logAdminAudit({
        action: AdminAction.DOCUMENT_REVIEWED,
        actorId: auth.id,
        entityType: 'documents',
        entityId: documentId,
        metadata: { decision: action, file_name: document.file_name, student_user_id: studentUserId },
        req: request,
      });
    } catch {
      // Non-fatal: the transactional audit above is the compliance record.
    }

    if (userProfile?.email) {
      try {
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
      } catch {
        // Notification delivery is best-effort and must not roll back or mask review success.
      }
    }

    // Check if this approval completes employer onboarding
    let employerActivated = false;
    if (action === 'approve' && studentUserId) {
      try {
        const { data: ownerProfile } = await db
          .from('profiles')
          .select('role')
          .eq('id', studentUserId)
          .maybeSingle();

        if (db && ownerProfile?.role === 'employer') {
          const { tryAutoActivate } = await import('@/lib/employer/check-onboarding-complete');
          employerActivated = await tryAutoActivate(db, studentUserId);
        }
      } catch {
        // Non-fatal
      }
    }

    return NextResponse.json({ success: true, document, employerActivated });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/admin/documents/review', _POST, { critical: true });
