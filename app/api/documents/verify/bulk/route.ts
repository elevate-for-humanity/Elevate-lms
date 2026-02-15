import { createClient } from '@/lib/supabase/server';
import { withErrorHandling, APIErrors } from '@/lib/api';
import { NextRequest, NextResponse } from 'next/server';
import { auditLog, AuditAction, AuditEntity } from '@/lib/logging/auditLog';
import { verifyDocument, rejectDocument, canEvaluateTransfer } from '@/lib/documents';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface BulkVerifyRequest {
  documentIds: string[];
  action: 'approve' | 'reject';
  rejectionReason?: string;
  verificationNotes?: string;
}

/**
 * Bulk document verification endpoint.
 * After verification, triggers downstream automation where applicable:
 * - Transfer docs verified: auto-run transfer evaluation
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw APIErrors.unauthorized();
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    throw APIErrors.forbidden('Only admins can verify documents');
  }

  const body: BulkVerifyRequest = await request.json();
  const { documentIds, action, rejectionReason, verificationNotes } = body;

  if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
    throw APIErrors.validation('documentIds', 'At least one document ID is required');
  }

  if (!['approve', 'reject'].includes(action)) {
    throw APIErrors.validation('action', 'Action must be "approve" or "reject"');
  }

  if (action === 'reject' && !rejectionReason) {
    throw APIErrors.validation('rejectionReason', 'Rejection reason is required when rejecting');
  }

  const results: Array<{
    documentId: string;
    success: boolean;
    error?: string;
    triggeredAutomation?: string;
  }> = [];

  // Process each document
  for (const documentId of documentIds) {
    try {
      // Get document details
      const { data: document, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (fetchError || !document) {
        results.push({ documentId, success: false, error: 'Document not found' });
        continue;
      }

      // Perform verification/rejection
      let success: boolean;
      if (action === 'approve') {
        success = await verifyDocument(documentId, user.id, verificationNotes);
      } else {
        success = await rejectDocument(documentId, user.id, rejectionReason!);
      }

      if (!success) {
        results.push({ documentId, success: false, error: 'Failed to update document' });
        continue;
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
          bulk_operation: true,
          ...(action === 'approve' && verificationNotes && { verification_notes: verificationNotes }),
          ...(action === 'reject' && { rejection_reason: rejectionReason }),
        },
      });

      // Trigger downstream automation for approved transfer docs
      let triggeredAutomation: string | undefined;
      if (action === 'approve') {
        const transferDocTypes = ['school_transcript', 'certificate', 'out_of_state_license', 'employment_verification'];
        
        if (transferDocTypes.includes(document.document_type)) {
          // Check if there are pending transfer requests for this user
          const { data: pendingTransfers } = await supabase
            .from('hour_transfer_requests')
            .select('id, source_type, status')
            .eq('submitted_by', document.user_id)
            .eq('status', 'requires_manual_review');

          if (pendingTransfers && pendingTransfers.length > 0) {
            // Check if docs are now verified for each transfer
            for (const transfer of pendingTransfers) {
              const sourceType = (transfer.source_type || 'work_experience') as TransferSourceType;
              const canEvaluate = await canEvaluateTransfer(document.user_id, sourceType);
              
              if (canEvaluate.allowed) {
                // Update transfer status to pending (ready for evaluation)
                await supabase
                  .from('hour_transfer_requests')
                  .update({
                    status: 'pending',
                    docs_verified: true,
                    docs_verified_at: new Date().toISOString(),
                  })
                  .eq('id', transfer.id);
                
                triggeredAutomation = 'transfer_ready_for_evaluation';
              }
            }
          }
        }
      }

      results.push({
        documentId,
        success: true,
        ...(triggeredAutomation && { triggeredAutomation }),
      });
    } catch (error: any) {
      results.push({
        documentId,
        success: false,
        error: error.message || 'Unknown error',
      });
    }
  }

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  return NextResponse.json({
    success: failCount === 0,
    processed: documentIds.length,
    successCount,
    failCount,
    results,
    message: `${successCount} document(s) ${action === 'approve' ? 'verified' : 'rejected'}${failCount > 0 ? `, ${failCount} failed` : ''}`,
  });
});
