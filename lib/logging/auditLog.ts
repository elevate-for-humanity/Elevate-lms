import { logger } from '@/lib/logger';
import { requireAdminClient } from '@/lib/supabase/admin';

export interface AuditLogEntry {
  actorId?: string;
  actorRole?: string;
  tenantId?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
}

/**
 * Canonical general-purpose writer for the immutable audit_logs table.
 *
 * audit_logs canonical columns are:
 * user_id, tenant_id, role, action, resource_type, resource_id, details,
 * ip_address, user_agent, success.
 *
 * Older actor_id/target_type/target_id/metadata columns remain database
 * compatibility fields and should not receive new application writes.
 */
export async function auditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = await requireAdminClient();

    const { error } = await supabase.from('audit_logs').insert({
      user_id: entry.actorId ?? null,
      tenant_id: entry.tenantId ?? null,
      role: entry.actorRole ?? null,
      action: entry.action,
      resource_type: entry.entity,
      resource_id: entry.entityId ?? null,
      details: entry.metadata || {},
      ip_address: entry.ipAddress ?? null,
      user_agent: entry.userAgent ?? null,
      success: entry.success ?? true,
    });

    if (error) {
      logger.error('[auditLog] Failed to insert audit log:', error);
    }
  } catch (error) {
    // Audit logging must not break the primary transaction path.
    logger.error('[auditLog] Exception:', error);
  }
}

/**
 * Common audit actions for consistency
 */
export const AuditAction = {
  // User actions
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',

  // Organization actions
  ORG_CREATED: 'ORG_CREATED',
  ORG_UPDATED: 'ORG_UPDATED',
  ORG_DELETED: 'ORG_DELETED',
  ORG_MEMBER_ADDED: 'ORG_MEMBER_ADDED',
  ORG_MEMBER_REMOVED: 'ORG_MEMBER_REMOVED',
  ORG_INVITE_SENT: 'ORG_INVITE_SENT',
  ORG_INVITE_ACCEPTED: 'ORG_INVITE_ACCEPTED',

  // Case/Enrollment actions
  CASE_CREATED: 'CASE_CREATED',
  CASE_UPDATED: 'CASE_UPDATED',
  CASE_STATUS_CHANGED: 'CASE_STATUS_CHANGED',
  ENROLLMENT_CREATED: 'ENROLLMENT_CREATED',
  ENROLLMENT_STATUS_CHANGED: 'ENROLLMENT_STATUS_CHANGED',
  ENROLLMENT_COMPLETED: 'ENROLLMENT_COMPLETED',
  PLACEMENT_CREATED: 'placement_created',
  PLACEMENT_STATUS_UPDATED: 'placement_status_updated',
  WIOA_OUTCOMES_EXPORTED: 'wioa_outcomes_exported',

  // Signature actions
  SIGNATURE_ADDED: 'SIGNATURE_ADDED',
  SIGNATURE_REQUESTED: 'SIGNATURE_REQUESTED',
  ALL_SIGNATURES_COMPLETE: 'ALL_SIGNATURES_COMPLETE',

  // Task actions
  TASK_CREATED: 'TASK_CREATED',
  TASK_ASSIGNED: 'TASK_ASSIGNED',
  TASK_COMPLETED: 'TASK_COMPLETED',
  TASK_OVERDUE: 'TASK_OVERDUE',

  // Milestone actions
  MILESTONE_REACHED: 'MILESTONE_REACHED',
  MILESTONE_CREATED: 'MILESTONE_CREATED',

  // Student actions
  STUDENT_ENROLLED: 'STUDENT_ENROLLED',
  STUDENT_UNENROLLED: 'STUDENT_UNENROLLED',
  STUDENT_GRADUATED: 'STUDENT_GRADUATED',
  STUDENT_DATA_EXPORTED: 'STUDENT_DATA_EXPORTED',

  // Course actions
  COURSE_CREATED: 'COURSE_CREATED',
  COURSE_UPDATED: 'COURSE_UPDATED',
  COURSE_DELETED: 'COURSE_DELETED',
  COURSE_PUBLISHED: 'COURSE_PUBLISHED',
  COURSE_UNPUBLISHED: 'COURSE_UNPUBLISHED',

  // Financial actions
  PAYMENT_PROCESSED: 'PAYMENT_PROCESSED',
  REFUND_ISSUED: 'REFUND_ISSUED',
  LICENSE_PURCHASED: 'LICENSE_PURCHASED',
  LICENSE_PROVISIONED: 'LICENSE_PROVISIONED',
  LICENSE_REVOKED: 'LICENSE_REVOKED',

  // Compliance actions
  HOURS_LOGGED: 'HOURS_LOGGED',
  HOURS_APPROVED: 'HOURS_APPROVED',
  HOURS_REJECTED: 'HOURS_REJECTED',
  HOURS_VERIFIED: 'HOURS_VERIFIED',
  DOCUMENT_UPLOADED: 'DOCUMENT_UPLOADED',
  DOCUMENT_DELETED: 'DOCUMENT_DELETED',
  DOCUMENT_VERIFIED: 'DOCUMENT_VERIFIED',
  FERPA_CONSENT_GRANTED: 'FERPA_CONSENT_GRANTED',
  FERPA_CONSENT_REVOKED: 'FERPA_CONSENT_REVOKED',

  // Admin actions
  SETTINGS_UPDATED: 'SETTINGS_UPDATED',
  ROLE_CHANGED: 'ROLE_CHANGED',
  PERMISSIONS_UPDATED: 'PERMISSIONS_UPDATED',
  DATA_EXPORTED: 'DATA_EXPORTED',
  DATA_DELETED: 'DATA_DELETED',
} as const;

/**
 * Common entity types for consistency
 */
export const AuditEntity = {
  USER: 'user',
  PROFILE: 'profile',
  ORGANIZATION: 'organization',
  STUDENT: 'student',
  COURSE: 'course',
  ENROLLMENT: 'enrollment',
  ENROLLMENT_CASE: 'enrollment_case',
  CERTIFICATE: 'certificate',
  PAYMENT: 'payment',
  LICENSE: 'license',
  HOURS: 'apprentice_hour_logs',
  DOCUMENT: 'document',
  SIGNATURE: 'apprentice_agreements',
  TASK: 'case_tasks',
  MILESTONE: 'milestone',
  SETTINGS: 'settings',
  INVITE: 'org_invite',
  APPLICATION: 'applications',
  PLACEMENT_RECORD: 'placement_record',
  CASE_MANAGER_REPORT: 'case_manager_report',
} as const;
