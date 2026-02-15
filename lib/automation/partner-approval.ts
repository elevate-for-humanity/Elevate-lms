import { logger } from '@/lib/logger';
/**
 * Partner/Shop Auto-Approval
 * Automatically approves partners when all required documents pass validation
 */

import { createClient } from '@supabase/supabase-js';
// Document processing moved to Netlify function
import {
  REQUIRED_DOCUMENTS,
  areAllDocumentsAccepted,
  getMissingDocuments,
  calculatePartnerStatus,
  PartnerDocument,
  getRequiredDocuments,
} from '@/lib/partner/types';

export interface PartnerApprovalResult {
  success: boolean;
  approved: boolean;
  status: 'active' | 'submitted' | 'draft' | 'restricted';
  missing_documents: string[];
  pending_documents: string[];
  failed_documents: string[];
  decision_id?: string;
  review_queue_id?: string;
  error?: string;
}

/**
 * Get Supabase admin client
 */
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials');
  return createClient(url, key);
}

/**
 * Check and potentially auto-approve a partner
 */
export async function checkPartnerApproval(
  partnerId: string,
  programId: string = 'barber_apprenticeship',
  state: string = 'IN'
): Promise<PartnerApprovalResult> {
  const supabase = getSupabaseAdmin();
  
  try {
    // 1. Get partner info
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('*')
      .eq('id', partnerId)
      .single();
    
    if (partnerError || !partner) {
      return {
        success: false,
        approved: false,
        status: 'draft',
        missing_documents: [],
        pending_documents: [],
        failed_documents: [],
        error: 'Partner not found',
      };
    }
    
    // 2. Get partner documents
    const { data: documents, error: docsError } = await supabase
      .from('partner_documents')
      .select('*')
      .eq('partner_id', partnerId);
    
    if (docsError) {
      return {
        success: false,
        approved: false,
        status: 'draft',
        missing_documents: [],
        pending_documents: [],
        failed_documents: [],
        error: 'Failed to fetch documents',
      };
    }
    
    const partnerDocs: PartnerDocument[] = (documents || []).map((d: any) => ({
      id: d.id,
      partner_id: d.partner_id,
      document_type: d.document_type,
      file_url: d.file_url,
      status: d.status,
      uploaded_at: d.uploaded_at,
      reviewed_at: d.reviewed_at,
      reviewed_by: d.reviewed_by,
      expiration_date: d.expiration_date,
      notes: d.notes,
    }));
    
    // 3. Get required documents for this program/state
    const requiredDocs = getRequiredDocuments(programId, state);
    
    // 4. Categorize documents
    const missing = getMissingDocuments(partnerDocs, programId, state);
    const pending = partnerDocs.filter(d => d.status === 'pending').map(d => d.document_type);
    const failed = partnerDocs.filter(d => d.status === 'rejected').map(d => d.document_type);
    const accepted = partnerDocs.filter(d => d.status === 'accepted');
    
    // 5. Check MOU status
    const { data: mouStatus } = await supabase
      .from('program_holders')
      .select('mou_status')
      .eq('partner_id', partnerId)
      .single();
    
    const mouSigned = mouStatus?.mou_status === 'fully_executed';
    
    // 6. Get ruleset
    const { data: ruleset } = await supabase
      .from('automation_rulesets')
      .select('rules, version')
      .eq('rule_type', 'partner_approval')
      .eq('is_active', true)
      .single();
    
    const rules = ruleset?.rules || {
      required_docs: ['shop_license', 'partner_mou'],
      license_must_be_valid: true,
      mou_must_be_signed: true,
    };
    
    // 7. Validate license expiration
    const licenseDoc = accepted.find(d => d.document_type === 'shop_license');
    let licenseValid = true;
    if (rules.license_must_be_valid && licenseDoc?.expiration_date) {
      licenseValid = new Date(licenseDoc.expiration_date) > new Date();
    }
    
    // 8. Determine if can auto-approve
    const allDocsAccepted = areAllDocumentsAccepted(partnerDocs, programId, state);
    const mouOk = !rules.mou_must_be_signed || mouSigned;
    const canAutoApprove = allDocsAccepted && mouOk && licenseValid && missing.length === 0 && failed.length === 0;
    
    // 9. Calculate status
    const status = calculatePartnerStatus(partnerDocs);
    
    // 10. Create decision record
    const reasonCodes: string[] = [];
    if (!allDocsAccepted) reasonCodes.push('DOCS_NOT_ACCEPTED');
    if (!mouOk) reasonCodes.push('MOU_NOT_SIGNED');
    if (!licenseValid) reasonCodes.push('LICENSE_EXPIRED');
    if (missing.length > 0) reasonCodes.push('MISSING_DOCS');
    if (failed.length > 0) reasonCodes.push('FAILED_DOCS');
    if (canAutoApprove) reasonCodes.push('ALL_REQUIREMENTS_MET');
    
    const { data: decisionRecord } = await supabase
      .from('automated_decisions')
      .insert({
        subject_type: 'partner',
        subject_id: partnerId,
        decision: canAutoApprove ? 'approved' : 'needs_review',
        reason_codes: reasonCodes,
        input_snapshot: {
          program_id: programId,
          state,
          documents: partnerDocs.map(d => ({ type: d.document_type, status: d.status })),
          mou_signed: mouSigned,
          license_valid: licenseValid,
        },
        ruleset_version: ruleset?.version || '1.0.0',
        actor: 'system',
      })
      .select()
      .single();
    
    // 11. Update partner status if approved
    if (canAutoApprove) {
      await supabase
        .from('partners')
        .update({
          status: 'active',
          approved_at: new Date().toISOString(),
          auto_approved: true,
        })
        .eq('id', partnerId);
    }
    
    // 12. Add to review queue if not approved
    let reviewQueueId: string | undefined;
    if (!canAutoApprove && (pending.length > 0 || missing.length > 0)) {
      const { data: queueItem } = await supabase
        .from('review_queue')
        .insert({
          queue_type: 'partner_docs_review',
          subject_type: 'partner',
          subject_id: partnerId,
          priority: failed.length > 0 ? 3 : 5,
          reasons: reasonCodes,
          metadata: {
            program_id: programId,
            state,
            missing: missing,
            pending: pending,
            failed: failed,
          },
        })
        .select()
        .single();
      
      reviewQueueId = queueItem?.id;
    }
    
    // 13. Audit log
    await supabase.from('audit_logs').insert({
      actor_id: null,
      event_type: canAutoApprove ? 'partner_auto_approved' : 'partner_review_required',
      resource_type: 'partner',
      resource_id: partnerId,
      metadata: {
        program_id: programId,
        state,
        reason_codes: reasonCodes,
      },
    });
    
    return {
      success: true,
      approved: canAutoApprove,
      status: canAutoApprove ? 'active' : status,
      missing_documents: missing,
      pending_documents: pending,
      failed_documents: failed,
      decision_id: decisionRecord?.id,
      review_queue_id: reviewQueueId,
    };
  } catch (error) {
    logger.error('Partner approval error:', error);
    return {
      success: false,
      approved: false,
      status: 'draft',
      missing_documents: [],
      pending_documents: [],
      failed_documents: [],
      error: 'Operation failed',
    };
  }
}

/**
 * Process a newly uploaded partner document and check for auto-approval
 */
export async function processPartnerDocument(
  partnerId: string,
  documentId: string,
  programId: string = 'barber_apprenticeship',
  state: string = 'IN'
): Promise<PartnerApprovalResult> {
  // Document processing moved to Netlify function
  // For now, skip automatic processing and require manual review
  return {
    success: true,
    approved: false,
    status: 'submitted',
    missing_documents: [],
    pending_documents: [documentId],
    failed_documents: [],
    review_queue_id: undefined,
  };
  
  /* Original code - requires evidence-processor which uses Tesseract
  const docResult = await processDocument(documentId);
  
  if (!docResult.success) {
    return {
      success: false,
      approved: false,
      status: 'submitted',
      missing_documents: [],
      pending_documents: [],
      failed_documents: [],
      error: docResult.error,
    };
  }
  */
  
  // 2. If document passed, update partner_documents status
  const supabase = getSupabaseAdmin();
  
  if (docResult.decision?.decision === 'approved') {
    await supabase
      .from('partner_documents')
      .update({
        status: 'accepted',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', documentId);
  } else if (docResult.decision?.decision === 'rejected') {
    await supabase
      .from('partner_documents')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        notes: docResult.extraction?.validation_errors?.join(', '),
      })
      .eq('id', documentId);
  }
  
  // 3. Check if partner can now be auto-approved
  return checkPartnerApproval(partnerId, programId, state);
}
