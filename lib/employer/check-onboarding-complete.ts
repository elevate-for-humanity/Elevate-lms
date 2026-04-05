import { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

/**
 * Required document types for employer onboarding activation.
 * Each must be uploaded AND approved before auto-activation triggers.
 *
 * "uploaded" = file exists in documents table
 * "approved" = document status is 'approved' (admin-verified)
 *
 * This prevents activation of employers with:
 * - Wrong GL limits on COI
 * - Invalid workers comp
 * - Mismatched business name on EIN
 * - Unsigned MOU
 */
const REQUIRED_DOC_TYPES = [
  'coi_general_liability',
  'coi_workers_comp',
  'business_license',
  'ein_verification',
  'supervisor_designation',
  'employer_mou',
];

interface DocStatus {
  type: string;
  uploaded: boolean;
  approved: boolean;
}

interface OnboardingStatus {
  complete: boolean;
  missing: string[];
  pendingReview: string[];
  docStatuses: DocStatus[];
  hasHiringNeeds: boolean;
  hasMOU: boolean;
  hasAllDocsApproved: boolean;
}

/**
 * Check if an employer has completed all onboarding requirements.
 * Requires documents to be APPROVED, not just uploaded.
 */
export async function checkOnboardingComplete(
  db: SupabaseClient,
  employerId: string
): Promise<OnboardingStatus> {
  const { data: onboarding } = await db
    .from('employer_onboarding')
    .select('status, hiring_needs')
    .eq('employer_id', employerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Get documents with their approval status
  const { data: documents } = await db
    .from('documents')
    .select('document_type, status')
    .eq('user_id', employerId);

  const { data: agreements } = await db
    .from('license_agreement_acceptances')
    .select('agreement_type')
    .eq('user_id', employerId);

  const docMap = new Map<string, string>();
  for (const doc of documents || []) {
    // Keep the highest status per type (approved > pending > rejected)
    const existing = docMap.get(doc.document_type);
    if (!existing || doc.status === 'approved') {
      docMap.set(doc.document_type, doc.status);
    }
  }

  const signedAgreements = new Set((agreements || []).map((a: any) => a.agreement_type));
  const hasHiringNeeds = !!onboarding?.hiring_needs;

  // MOU can be satisfied by either a signed agreement or an approved uploaded document
  const hasMOU =
    signedAgreements.has('employer_agreement') ||
    docMap.get('employer_mou') === 'approved';

  const missing: string[] = [];
  const pendingReview: string[] = [];
  const docStatuses: DocStatus[] = [];

  if (!hasHiringNeeds) missing.push('hiring_needs');
  if (!hasMOU) {
    if (docMap.has('employer_mou') || signedAgreements.has('employer_agreement')) {
      pendingReview.push('employer_mou');
    } else {
      missing.push('employer_mou');
    }
  }

  for (const docType of REQUIRED_DOC_TYPES) {
    if (docType === 'employer_mou') {
      docStatuses.push({ type: docType, uploaded: hasMOU || docMap.has(docType), approved: hasMOU });
      continue;
    }

    const status = docMap.get(docType);
    const uploaded = !!status;
    const approved = status === 'approved';

    docStatuses.push({ type: docType, uploaded, approved });

    if (!uploaded) {
      missing.push(docType);
    } else if (!approved) {
      pendingReview.push(docType);
    }
  }

  const hasAllDocsApproved = REQUIRED_DOC_TYPES.every((t) => {
    if (t === 'employer_mou') return hasMOU;
    return docMap.get(t) === 'approved';
  });

  return {
    complete: hasHiringNeeds && hasMOU && hasAllDocsApproved,
    missing,
    pendingReview,
    docStatuses,
    hasHiringNeeds,
    hasMOU,
    hasAllDocsApproved,
  };
}

/**
 * Auto-activate an employer if ALL onboarding requirements are met
 * AND all documents are admin-approved.
 *
 * Only transitions from 'approved' or 'onboarding_in_progress' → 'active'.
 * Sends the Welcome to Elevate email on activation.
 * Logs the activation event to audit_logs for regulator defensibility.
 *
 * Returns true if the employer was activated.
 */
export async function tryAutoActivate(
  db: SupabaseClient,
  employerId: string
): Promise<boolean> {
  const { data: onboarding } = await db
    .from('employer_onboarding')
    .select('id, status, contact_name, contact_email, business_name')
    .eq('employer_id', employerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!onboarding) return false;
  if (!['approved', 'onboarding_in_progress'].includes(onboarding.status)) return false;

  const status = await checkOnboardingComplete(db, employerId);

  if (!status.complete) {
    // Move to onboarding_in_progress if they've started uploading
    if (onboarding.status === 'approved' && (status.docStatuses.some(d => d.uploaded) || status.hasHiringNeeds)) {
      await db
        .from('employer_onboarding')
        .update({ status: 'onboarding_in_progress', updated_at: new Date().toISOString() })
        .eq('id', onboarding.id);
    }
    return false;
  }

  // All requirements met AND all documents approved — activate
  const { error } = await db
    .from('employer_onboarding')
    .update({
      status: 'active',
      activated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', onboarding.id);

  if (error) {
    logger.error('Failed to auto-activate employer', { employerId, error });
    return false;
  }

  // Audit log — regulator-defensible activation record
  try {
    await db.from('audit_logs').insert({
      actor_id: employerId,
      actor_role: 'system',
      action: 'employer_auto_activated',
      resource_type: 'employer_onboarding',
      resource_id: onboarding.id,
      after_state: {
        business_name: onboarding.business_name,
        activation_method: 'auto_all_docs_approved',
        docs_verified: status.docStatuses.filter(d => d.approved).map(d => d.type),
        hiring_needs: status.hasHiringNeeds,
        mou_signed: status.hasMOU,
      },
    });
  } catch {
    // Non-fatal
  }

  logger.info('Employer auto-activated', {
    employerId,
    businessName: onboarding.business_name,
    method: 'all_documents_approved',
  });

  // Send Welcome to Elevate email
  try {
    const { getTemplate } = await import('@/lib/notifications/templates');
    const template = getTemplate('employer_activated', {
      contact_name: onboarding.contact_name,
      business_name: onboarding.business_name,
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
    await fetch(`${siteUrl}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.CRON_SECRET ?? '',
      },
      body: JSON.stringify({
        to: onboarding.contact_email,
        subject: template.subject,
        html: template.html,
      }),
    });
  } catch (err) {
    logger.error('Failed to send activation email', err instanceof Error ? err : undefined);
  }

  return true;
}
