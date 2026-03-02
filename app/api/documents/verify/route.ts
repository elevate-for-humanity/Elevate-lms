import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { withErrorHandling, APIErrors } from '@/lib/api';
import { NextRequest, NextResponse } from 'next/server';
import { auditLog, AuditAction, AuditEntity } from '@/lib/logging/auditLog';
import { verifyDocument, rejectDocument } from '@/lib/documents';
import { 
  notifyDocumentRejected, 
  notifyDocumentVerified 
} from '@/lib/notifications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw APIErrors.unauthorized();
  }

  // Check if user is admin
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    throw APIErrors.forbidden('Only admins can verify documents');
  }

  const body = await request.json();
  const { documentId, action, rejectionReason, verificationNotes } = body;

  if (!documentId || !action) {
    throw APIErrors.validation('documentId, action', 'Document ID and action are required');
  }

  if (!['approve', 'reject'].includes(action)) {
    throw APIErrors.validation('action', 'Action must be "approve" or "reject"');
  }

  if (action === 'reject' && !rejectionReason) {
    throw APIErrors.validation('rejectionReason', 'Rejection reason is required when rejecting');
  }

  // Get document with user profile
  const { data: document, error: fetchError } = await db
    .from('documents')
    .select(`
      *,
      profiles:user_id (
        id,
        full_name,
        email
      )
    `)
    .eq('id', documentId)
    .single();

  if (fetchError || !document) {
    throw APIErrors.notFound('Document');
  }

  // Use library functions for verification (includes audit trail fields)
  let success: boolean;
  if (action === 'approve') {
    success = await verifyDocument(documentId, user.id, verificationNotes);
  } else {
    success = await rejectDocument(documentId, user.id, rejectionReason);
  }

  if (!success) {
    throw APIErrors.database('Failed to update document status');
  }

  // Audit log
  await auditLog({
    actorId: user.id,
    actorRole: profile.role,
    action: action === 'approve' ? AuditAction.DOCUMENT_VERIFIED : AuditAction.DOCUMENT_REJECTED,
    entity: AuditEntity.DOCUMENT,
    entityId: documentId,
    metadata: {
      document_type: document.document_type,
      user_id: document.user_id,
      owner_type: document.owner_type,
      owner_id: document.owner_id,
      ...(action === 'approve' && verificationNotes && { verification_notes: verificationNotes }),
      ...(action === 'reject' && { rejection_reason: rejectionReason }),
    },
  });

  // Check if all required docs are now verified (for apprentice enrollment)
  let enrollmentReady = false;
  if (action === 'approve' && document.document_type === 'photo_id') {
    // Check if this user has a pending enrollment that can now be approved
    const { data: pendingEnrollment } = await db
      .from('program_enrollments')
      .select('id, status')
      .eq('user_id', document.user_id)
      .eq('status', 'pending')
      .single();

    if (pendingEnrollment) {
      // Mark enrollment as ready for approval (docs verified)
      await db
        .from('program_enrollments')
        .update({
          docs_verified: true,
          docs_verified_at: new Date().toISOString(),
        })
        .eq('id', pendingEnrollment.id);

      enrollmentReady = true;
    }
  }

  // Send notification to document owner
  const ownerEmail = document.profiles?.email;
  const ownerName = document.profiles?.full_name || 'there';

  if (ownerEmail) {
    try {
      if (action === 'reject') {
        await notifyDocumentRejected(
          ownerEmail,
          ownerName,
          document.document_type,
          rejectionReason,
          documentId,
          document.user_id
        );
      } else {
        // Determine next step based on document type
        let nextStep = 'Your application is being reviewed.';
        if (document.document_type === 'photo_id') {
          nextStep = enrollmentReady 
            ? 'Your documents are verified! Your enrollment is ready for final approval.'
            : 'Your enrollment application is now ready for admin review.';
        } else if (['shop_license', 'barber_license'].includes(document.document_type)) {
          nextStep = 'Your host shop application is being reviewed.';
        } else if (['school_transcript', 'certificate', 'out_of_state_license'].includes(document.document_type)) {
          nextStep = 'Your transfer hours will be evaluated.';
        }

        await notifyDocumentVerified(
          ownerEmail,
          ownerName,
          document.document_type,
          nextStep
        );
      }
    } catch (notifyError) {
      // Log but don't fail the request
      logger.error('Failed to send notification:', notifyError);
    }
  }

  // Check if this approval completes employer onboarding
  let employerActivated = false;
  if (action === 'approve' && document.user_id) {
    try {
      const { data: profile } = await db
        .from('profiles')
        .select('role')
        .eq('id', document.user_id)
        .single();

      if (profile?.role === 'employer') {
        const { tryAutoActivate } = await import('@/lib/employer/check-onboarding-complete');
        employerActivated = await tryAutoActivate(db, document.user_id);
      }
    } catch {
      // Non-fatal
    }
  }

  return NextResponse.json({
    success: true,
    enrollmentReady,
    employerActivated,
    document: {
      id: documentId,
      status: action === 'approve' ? 'verified' : 'rejected',
    },
  });
});
