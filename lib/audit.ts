// lib/audit.ts
// Audit logging helper for enterprise compliance
import { createSupabaseClient } from '@/lib/supabase-api';
import { logger } from '@/lib/logger';

export type AuditEvent = {
  tenantId?: string | null;
  userId?: string | null;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  metadata?: Record<string, any>;
  ipAddress?: string | null;
  userAgent?: string | null;
};

/**
 * Log an audit event to the database
 * This function is designed to never throw errors to prevent disrupting normal operations
 */
export async function logAuditEvent(event: AuditEvent): Promise<void> {
  try {
    const supabase = createSupabaseClient();
    const { error } = await supabase.from('audit_logs').insert({
      tenant_id: event.tenantId,
      user_id: event.userId,
      action: event.action,
      resource_type: event.resourceType,
      resource_id: event.resourceId,
      metadata: event.metadata || {},
      ip_address: event.ipAddress,
      user_agent: event.userAgent,
    });

    if (error) {
      logger.error('Failed to write audit log', error as Error, { event });
    }
  } catch (e) {
    // Do not crash app for logging failures
    logger.error('Audit logging exception', e as Error, { event });
  }
}

/**
 * Common audit actions for consistency
 */
export const AuditActions = {
  // User actions
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
  USER_DELETED: 'user_deleted',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  USER_PASSWORD_CHANGED: 'user_password_changed',
  USER_2FA_ENABLED: 'user_2fa_enabled',
  USER_2FA_DISABLED: 'user_2fa_disabled',

  // Course actions
  COURSE_CREATED: 'course_created',
  COURSE_UPDATED: 'course_updated',
  COURSE_DELETED: 'course_deleted',
  COURSE_PUBLISHED: 'course_published',
  COURSE_UNPUBLISHED: 'course_unpublished',

  // Enrollment actions
  ENROLLMENT_CREATED: 'enrollment_created',
  ENROLLMENT_COMPLETED: 'enrollment_completed',
  ENROLLMENT_CANCELLED: 'enrollment_cancelled',

  // HR actions
  EMPLOYEE_CREATED: 'employee_created',
  EMPLOYEE_UPDATED: 'employee_updated',
  EMPLOYEE_TERMINATED: 'employee_terminated',
  PAYROLL_PROCESSED: 'payroll_processed',
  LEAVE_APPROVED: 'leave_approved',
  LEAVE_DENIED: 'leave_denied',

  // Marketing actions
  CAMPAIGN_CREATED: 'campaign_created',
  CAMPAIGN_SENT: 'campaign_sent',
  CONTACT_IMPORTED: 'contact_imported',

  // Event actions
  EVENT_CREATED: 'event_created',
  EVENT_UPDATED: 'event_updated',
  EVENT_CANCELLED: 'event_cancelled',
  EVENT_REGISTRATION: 'event_registration',

  // SSO actions
  SSO_CONNECTION_CREATED: 'sso_connection_created',
  SSO_CONNECTION_UPDATED: 'sso_connection_updated',
  SSO_LOGIN: 'sso_login',

  // Security actions
  SECURITY_BREACH_ATTEMPT: 'security_breach_attempt',
  PERMISSION_DENIED: 'permission_denied',
  API_KEY_CREATED: 'api_key_created',
  API_KEY_REVOKED: 'api_key_revoked',

  // Data actions
  DATA_EXPORTED: 'data_exported',
  DATA_IMPORTED: 'data_imported',
  DATA_DELETED: 'data_deleted',

  // System actions
  SETTINGS_UPDATED: 'settings_updated',
  INTEGRATION_CONFIGURED: 'integration_configured',
  MIGRATION_RUN: 'migration_run',

  // Marketplace actions
  MARKETPLACE_CREATOR_APPLIED: 'marketplace_creator_applied',
  MARKETPLACE_CREATOR_APPROVED: 'marketplace_creator_approved',
  MARKETPLACE_CREATOR_REJECTED: 'marketplace_creator_rejected',
  MARKETPLACE_CREATOR_SUSPENDED: 'marketplace_creator_suspended',
  MARKETPLACE_PRODUCT_CREATED: 'marketplace_product_created',
  MARKETPLACE_PRODUCT_APPROVED: 'marketplace_product_approved',
  MARKETPLACE_PRODUCT_REJECTED: 'marketplace_product_rejected',
  MARKETPLACE_SALE_COMPLETED: 'marketplace_sale_completed',
  MARKETPLACE_PAYOUT_PROCESSED: 'marketplace_payout_processed',
  MARKETPLACE_WEBHOOK_FAILED: 'marketplace_webhook_failed',
} as const;

/**
 * Helper to extract IP and User Agent from Next.js request
 */
export function getRequestMetadata(
  req: Request | { headers: Headers; ip?: string }
) {
  const headers = req.headers;

  return {
    ipAddress:
      headers.get?.('x-forwarded-for')?.split(',')[0]?.trim() ||
      headers.get?.('x-real-ip') ||
      ('ip' in req ? req.ip : null) ||
      null,
    userAgent: headers.get?.('user-agent') || null,
  };
}

/**
 * Audit decorator for API routes
 * Usage: await auditedAction(req, 'user_created', async () => { ... })
 */
export async function auditedAction<T>(
  req: Request | { headers: Headers; ip?: string },
  action: string,
  resourceType: string | null,
  fn: () => Promise<T>,
  options?: {
    tenantId?: string;
    userId?: string;
    metadata?: Record<string, any>;
  }
): Promise<T> {
  const { ipAddress, userAgent } = getRequestMetadata(req);

  try {
    const result = await fn();

    // Log successful action
    await logAuditEvent({
      tenantId: options?.tenantId,
      userId: options?.userId,
      action,
      resourceType,
      resourceId:
        typeof result === 'object' && result && 'id' in result
          ? String(result.id)
          : null,
      metadata: options?.metadata,
      ipAddress,
      userAgent,
    });

    return result;
  } catch (error) { /* Error handled silently */ 
    // Log failed action
    await logAuditEvent({
      tenantId: options?.tenantId,
      userId: options?.userId,
      action: `${action}_failed`,
      resourceType,
      metadata: {
        ...options?.metadata,
        error: 'Operation failed',
      },
      ipAddress,
      userAgent,
    });

    throw error;
  }
}
