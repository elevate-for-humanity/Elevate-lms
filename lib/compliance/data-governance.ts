/**
 * lib/compliance/data-governance.ts
 *
 * PLATFORM DATA GOVERNANCE POLICY
 * ================================
 * Elevate for Humanity is a workforce development and community training platform.
 * It is NOT a state eligibility determination system.
 *
 * RULE: No data submitted through this platform is automatically forwarded
 * to any government agency, state system, or external benefits authority.
 *
 * All intake flows route to Elevate internal review first.
 * Any external submission requires:
 *   - Manual admin review
 *   - Explicit approval with audit log entry
 *   - Formal agency agreement on file
 *   - Documented consent from the participant
 *
 * This module provides:
 *   1. A runtime guard (assertNoAutoSubmit) that throws if activated without
 *      explicit human approval — preventing accidental enabling of external calls.
 *   2. Consent/disclosure language for all intake forms.
 *   3. Sensitive data classification constants.
 *   4. Audit log helpers for document access.
 */

import { logger } from '@/lib/logger';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The ONLY recipient for all platform intake notifications.
 * External agencies receive NOTHING automatically.
 */
export const ELEVATE_INTAKE_EMAIL = 'elevate4humanityedu@gmail.com';

/**
 * Sensitive data categories that require encrypted storage,
 * restricted access, and audit logging.
 */
export const SENSITIVE_DATA_CATEGORIES = [
  'ssn',
  'ssn_last_4',
  'income',
  'benefits_status',
  'snap_status',
  'tanf_status',
  'medicaid_status',
  'justice_involved',
  'immigration_status',
  'education_records',
  'employment_history',
  'bank_account',
] as const;

export type SensitiveDataCategory = (typeof SENSITIVE_DATA_CATEGORIES)[number];

/**
 * Document types that require audit logging on every access.
 */
export const AUDITED_DOCUMENT_TYPES = [
  'ein_letter',
  'w9',
  'workers_comp',
  'liability_insurance',
  'barbershop_license',
  'salon_license',
  'supervisor_license',
  'mou',
  'wioa_application',
  'snap_documentation',
  'income_verification',
  'id_document',
] as const;

export type AuditedDocumentType = (typeof AUDITED_DOCUMENT_TYPES)[number];

// ─────────────────────────────────────────────────────────────────────────────
// Runtime guard — blocks any auto-submission to external agencies
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Call this at the top of ANY function that would transmit data externally
 * to a government agency or state system.
 *
 * This throws unless:
 *   - ELEVATE_EXTERNAL_SUBMIT_ENABLED=true is set in env (requires ops sign-off)
 *   - AND the caller passes the approved submission token
 *
 * HOW TO AUTHORIZE A SUBMISSION (requires change control approval):
 *   1. Open a change control ticket in your project tracker
 *   2. Get sign-off from legal, compliance, and Elevate leadership
 *   3. Set ELEVATE_EXTERNAL_SUBMIT_ENABLED=true on the specific deployment
 *   4. Pass { approvalToken: process.env.EXTERNAL_SUBMIT_TOKEN } to this call
 *   5. Log the submission in audit_logs immediately
 */
export function assertNoAutoSubmit(
  context: string,
  opts?: { approvalToken?: string },
): void {
  const enabled = process.env.ELEVATE_EXTERNAL_SUBMIT_ENABLED === 'true';
  const tokenValid =
    opts?.approvalToken &&
    process.env.EXTERNAL_SUBMIT_TOKEN &&
    opts.approvalToken === process.env.EXTERNAL_SUBMIT_TOKEN;

  if (enabled && tokenValid) {
    // Authorized — log and allow
    logger.warn(`[GOVERNANCE] External submission authorized: ${context}`);
    return;
  }

  logger.error(
    `[GOVERNANCE] BLOCKED automatic external submission attempt: ${context}. ` +
      `This platform routes all intake through Elevate internal review. ` +
      `See lib/compliance/data-governance.ts for authorization procedure.`,
  );
  throw new Error(
    `AUTO_SUBMIT_BLOCKED: ${context}. ` +
      `All submissions must route through Elevate intake first. ` +
      `See lib/compliance/data-governance.ts for the change control process.`,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Consent / disclosure language
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Standard compliance disclosure for intake forms.
 * Render this on every form that collects benefits, income, or
 * government-program eligibility information.
 */
export const INTAKE_COMPLIANCE_DISCLOSURE = {
  heading: 'How We Handle Your Information',
  body: [
    `Submitting this form sends your information to ${PLATFORM_DEFAULTS.orgName} for internal review only.`,
    'Your documents and eligibility information are NOT automatically forwarded to any government agency, state system, or external benefits authority.',
    'Any submission to a government program (WIOA, SNAP E&T, WRG, FSSA, etc.) requires your explicit consent and is processed manually by Elevate staff.',
    'Your information is stored securely and accessible only to authorized Elevate personnel.',
  ],
  footerNote:
    'Questions about data handling? Contact us at elevate4humanityedu@gmail.com',
} as const;

/**
 * Shorter one-line notice for form footers and upload confirmations.
 */
export const INTAKE_SHORT_NOTICE =
  'Submission does not automatically transmit documents to government agencies. ' +
  'All documents are reviewed by Elevate staff first.';

// ─────────────────────────────────────────────────────────────────────────────
// Document access audit helper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Log access to a sensitive document in audit_logs.
 * Call this whenever an admin views or downloads a sensitive document.
 *
 * @param supabase  Admin Supabase client
 * @param actorId   User ID of the person accessing the document
 * @param docType   Document type (from AUDITED_DOCUMENT_TYPES)
 * @param docId     Storage path or record ID of the document
 * @param action    'view' | 'download' | 'approve' | 'reject' | 'delete'
 */
export async function logDocumentAccess(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/admin').requireAdminClient>>,
  actorId: string,
  docType: AuditedDocumentType | string,
  docId: string,
  action: 'view' | 'download' | 'approve' | 'reject' | 'delete',
): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('audit_logs').insert({
      actor_id: actorId,
      action: `document.${action}`,
      resource_type: 'document',
      resource_id: docId,
      metadata: { doc_type: docType, action },
    });
  } catch (err) {
    // Audit log failure must never block the main operation — log and continue
    logger.error('[GOVERNANCE] Failed to write document audit log:', err);
  }
}
