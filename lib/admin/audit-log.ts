/**
 * Centralized admin audit logging.
 *
 * All admin write operations MUST call logAdminAudit() after a successful
 * mutation.  The function inserts into `admin_audit_events` which is:
 *   - RLS-protected (INSERT via service_role only, SELECT for admins)
 *   - Immutable (no UPDATE/DELETE policies)
 *
 * Usage:
 *   import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';
 *
 *   await logAdminAudit({
 *     action: AdminAction.ROLE_CHANGED,
 *     actorId: adminUser.id,
 *     entityType: 'profiles',
 *     entityId: targetUserId,
 *     metadata: { new_role: 'admin', previous_role: 'student' },
 *     req,                       // optional — extracts IP + user-agent
 *   });
 */

import { getAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

// ── Action constants ────────────────────────────────────────────────────
// Typed enum prevents typos and enables grep-ability across the codebase.

export const AdminAction = {
  // Identity & access
  ROLE_CHANGED: 'role.changed',
  SSO_CONFIG_CREATED: 'sso.config_created',

  // Document & verification review
  DOCUMENT_REVIEWED: 'document.reviewed',
  VERIFICATION_REVIEWED: 'verification.reviewed',
  CERTIFICATION_REVIEWED: 'certification.reviewed',
  SHOP_DOC_REVIEWED: 'shop_doc.reviewed',

  // Applications & enrollment
  APPLICATION_APPROVED: 'application.approved',
  APPLICATION_STATUS_CHANGED: 'application.status_changed',
  ENROLLMENT_ACCESS_GRANTED: 'enrollment.access_granted',
  ENROLLMENT_JOB_UPDATED: 'enrollment.job_updated',
  BULK_GRADES_UPDATED: 'grades.bulk_updated',
  EXTERNAL_PROGRESS_UPDATED: 'external_progress.updated',
  SHOP_PLACEMENT_ASSIGNED: 'shop.placement_assigned',

  // WIOA & WOTC (federally sensitive)
  WIOA_ELIGIBILITY_VERIFIED: 'wioa.eligibility_verified',
  WOTC_APPLICATION_CREATED: 'wotc.application_created',
  WOTC_APPLICATION_UPDATED: 'wotc.application_updated',
  WOTC_APPLICATION_DELETED: 'wotc.application_deleted',

  // Exam results
  EXAM_RESULT_PASSED: 'exam.result_passed',
  EXAM_RESULT_FAILED: 'exam.result_failed',

  // Licenses
  LICENSE_CREATED: 'license.created',
  LICENSE_SUSPENDED: 'license.suspended',
  LICENSE_REACTIVATED: 'license.reactivated',
  LICENSE_REVOKED: 'license.revoked',
  LICENSE_FEATURES_UPDATED: 'license.features_updated',
  LICENSE_REQUEST_REVIEWED: 'license_request.reviewed',

  // Bulk / import
  BULK_IMPORT_EXECUTED: 'import.bulk_executed',

  // Programs & modules
  PROGRAM_CREATED: 'program.created',
  PROGRAM_UPDATED: 'program.updated',
  PROGRAM_DELETED: 'program.deleted',
  MODULE_CREATED: 'module.created',
  MODULE_UPDATED: 'module.updated',
  MODULE_DELETED: 'module.deleted',

  // Program holders
  PROGRAM_HOLDER_UPDATED: 'program_holder.updated',
  MOU_STATUS_CHANGED: 'mou.status_changed',
  MOU_COUNTERSIGNED: 'mou.countersigned',

  // Grants
  GRANT_CREATED: 'grant.created',
  GRANT_UPDATED: 'grant.updated',
  GRANT_DELETED: 'grant.deleted',
  GRANT_APPLICATION_CREATED: 'grant.application_created',
  GRANT_APPLICATION_UPDATED: 'grant.application_updated',

  // Financial
  PROMO_CODE_CREATED: 'promo_code.created',
  PROMO_CODE_UPDATED: 'promo_code.updated',
  PROMO_CODE_DELETED: 'promo_code.deleted',
  INCENTIVE_CREATED: 'incentive.created',
  TAX_APPLICATION_CREATED: 'tax_application.created',

  // Marketplace
  PRODUCT_APPROVED: 'product.approved',
  PRODUCT_REJECTED: 'product.rejected',

  // Affiliates
  AFFILIATE_CREATED: 'affiliate.created',

  // CRM
  CRM_DEAL_CREATED: 'crm.deal_created',
  CRM_APPOINTMENT_CREATED: 'crm.appointment_created',
  CRM_FOLLOWUP_CREATED: 'crm.followup_created',
  CRM_FOLLOWUP_UPDATED: 'crm.followup_updated',

  // Content & courses
  CAREER_COURSE_UPDATED: 'career_course.updated',
  CAREER_MODULE_UPDATED: 'career_module.updated',
  COURSE_DEFINITIONS_SYNCED: 'course_definitions.synced',
  LESSON_VIDEO_GENERATED: 'lesson.video_generated',
  VIDEO_UPLOADED: 'video.uploaded',

  // LMS — high-risk lesson and course lifecycle actions
  // These are the actions that can corrupt learner-facing content if done wrong.
  LESSON_CREATED:          'lesson.created',
  LESSON_UPDATED:          'lesson.updated',
  LESSON_DELETED:          'lesson.deleted',
  LESSON_PUBLISHED:        'lesson.published',
  LESSON_UNPUBLISHED:      'lesson.unpublished',
  COURSE_PUBLISHED:        'course.published',
  COURSE_UNPUBLISHED:      'course.unpublished',
  COURSE_SEED_RUN:         'course.seed_run',
  BULK_CONTENT_GENERATED:  'course.bulk_content_generated',
  BULK_LESSON_CLEANUP:     'course.bulk_lesson_cleanup',

  // Operations
  INTAKE_CREATED: 'intake.created',
  NEXT_STEPS_UPDATED: 'next_steps.updated',
  REMINDER_SENT: 'reminder.sent',
  SCRIPT_DEVIATION_LOGGED: 'script.deviation_logged',
  CONTACTS_SETUP: 'contacts.setup',
  SHOP_GEOCODED: 'shop.geocoded',
  JOB_CREATED: 'job.created',
  JOB_RETRIED: 'job.retried',
  HOURS_TRANSFER_PROCESSED: 'hours.transfer_processed',
  ENROLLMENT_POLICIES_FIXED: 'enrollment.policies_fixed',

  // Copilot / AI
  COPILOT_DEPLOYED: 'copilot.deployed',
  COPILOT_UPDATED: 'copilot.updated',
  COPILOT_DELETED: 'copilot.deleted',

  // Internal review
  INBOX_STATUS_UPDATED: 'inbox.status_updated',
  PARTNER_INQUIRY_REVIEWED: 'partner_inquiry.reviewed',
} as const;

export type AdminActionType = (typeof AdminAction)[keyof typeof AdminAction];

// ── Sentinel UUID for bulk/non-entity operations ────────────────────────
// Used when there is no single target entity (e.g. bulk import, policy fix).
export const BULK_ENTITY_ID = '00000000-0000-0000-0000-000000000000';

// ── Types ───────────────────────────────────────────────────────────────

export interface AdminAuditParams {
  action: AdminActionType;
  actorId: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  /** Pass the incoming Request to auto-extract IP + user-agent. */
  req?: Request | { headers: Headers };
}

// ── Core function ───────────────────────────────────────────────────────

/**
 * Insert an immutable audit record into admin_audit_events.
 *
 * Designed to never throw — a logging failure must not break the
 * business operation that triggered it.
 */
export async function logAdminAudit(params: AdminAuditParams): Promise<void> {
  try {
    const db = await getAdminClient();
    if (!db) {
      logger.error('[AdminAudit] No admin client available — audit event dropped', undefined, {
        action: params.action,
        actorId: params.actorId,
      });
      return;
    }

    const meta: Record<string, unknown> = { ...(params.metadata ?? {}) };

    // Attach request context when available
    if (params.req) {
      const headers = params.req.headers;
      meta._ip =
        headers.get?.('x-forwarded-for')?.split(',')[0]?.trim() ||
        headers.get?.('x-real-ip') ||
        undefined;
      meta._ua = headers.get?.('user-agent') || undefined;
    }

    const { error } = await db.from('admin_audit_events').insert({
      action: params.action,
      actor_user_id: params.actorId,
      target_type: params.entityType,
      target_id: params.entityId,
      metadata: meta,
    });

    if (error) {
      logger.error('[AdminAudit] Insert failed', error as unknown as Error, {
        action: params.action,
        actorId: params.actorId,
        entityType: params.entityType,
        entityId: params.entityId,
      });
    }
  } catch (e) {
    // Never crash the caller
    logger.error('[AdminAudit] Unexpected error', e as Error, {
      action: params.action,
    });
  }
}
