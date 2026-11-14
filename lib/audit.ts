// lib/audit.ts
// Central audit logging helper. Audit failures never interrupt business operations.
import { getAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

let auditFailureCount = 0;
let auditSuccessCount = 0;

export function getAuditTelemetry() {
  return { auditSuccessCount, auditFailureCount };
}

async function onAuditFailure(context: string, error: unknown, event: Record<string, unknown>) {
  auditFailureCount++;
  const errorMessage = error instanceof Error ? error.message : String(error);
  const failureRecord = {
    level: 'AUDIT_WRITE_FAILURE',
    timestamp: new Date().toISOString(),
    context,
    error: errorMessage,
  };

  logger.error(JSON.stringify({ ...failureRecord, event }));
  logger.error(context, error instanceof Error ? error : new Error(errorMessage), { event });

  try {
    const fallbackClient = await getAdminClient();
    if (fallbackClient) {
      void Promise.resolve(
        fallbackClient.from('audit_failures').insert({
          context,
          error_message: errorMessage,
          original_event: event,
        }),
      ).catch(() => undefined);
    }
  } catch {
    // stderr/application logging above remains the fallback.
  }

  if (typeof globalThis.process !== 'undefined') {
    try {
      const { appendFileSync } = require('node:fs');
      appendFileSync('/tmp/audit-fallback.jsonl', JSON.stringify({ ...failureRecord, event }) + '\n');
    } catch {
      // Edge/serverless runtimes may not expose a writable filesystem.
    }
  }
}

function onAuditSuccess() {
  auditSuccessCount++;
}

export type AuditEvent = {
  tenantId?: string | null;
  userId?: string | null;
  /** Legacy callers used actor_id; normalize it into user_id at this boundary. */
  actor_id?: string | null;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  metadata?: Record<string, any>;
  ipAddress?: string | null;
  userAgent?: string | null;
};

const PII_METADATA_KEYS = new Set([
  'email',
  'user_email',
  'created_emails',
  'anonymized_email',
  'phone',
  'phone_number',
  'mobile',
  'ssn',
  'ssn_hash',
  'ssn_last4',
  'ssn_last_4',
  'date_of_birth',
  'dob',
  'address',
  'address_line1',
  'address_line2',
  'street_address',
  'full_name',
  'first_name',
  'last_name',
  'name',
  'tax_id',
  'itin',
  'ein',
  'bank_account',
  'routing_number',
  'account_number',
  'driver_license',
  'state_id',
  'government_id',
  'file_path',
  'file_url',
  'document_url',
  'signed_url',
  'password',
  'temp_password',
  'temporary_password',
]);

function sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (PII_METADATA_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeMetadata(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export async function logAuditEvent(event: AuditEvent): Promise<void> {
  const payload = {
    tenant_id: event.tenantId,
    user_id: event.userId ?? event.actor_id ?? null,
    action: event.action,
    resource_type: event.resourceType,
    resource_id: event.resourceId,
    metadata: sanitizeMetadata(event.metadata || {}),
    ip_address: event.ipAddress,
    user_agent: event.userAgent,
  };

  try {
    const supabase = await getAdminClient();
    if (!supabase) {
      void onAuditFailure(
        'logAuditEvent: admin client unavailable (key absent)',
        new Error('No admin client'),
        payload,
      );
      return;
    }

    const { error } = await supabase.from('audit_logs').insert(payload);
    if (error) {
      void onAuditFailure('logAuditEvent: DB insert rejected', error, payload);
    } else {
      onAuditSuccess();
    }
  } catch (error) {
    void onAuditFailure('logAuditEvent: exception', error, payload);
  }
}

export const AuditActions = {
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
  USER_DELETED: 'user_deleted',
  USER_ROLE_CHANGED: 'user_role_changed',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  USER_PASSWORD_CHANGED: 'user_password_changed',
  USER_2FA_ENABLED: 'user_2fa_enabled',
  USER_2FA_DISABLED: 'user_2fa_disabled',
  COURSE_CREATED: 'course_created',
  COURSE_UPDATED: 'course_updated',
  COURSE_DELETED: 'course_deleted',
  COURSE_PUBLISHED: 'course_published',
  COURSE_UNPUBLISHED: 'course_unpublished',
  LESSON_CREATED: 'lesson_created',
  LESSON_UPDATED: 'lesson_updated',
  LESSON_DELETED: 'lesson_deleted',
  QUIZ_CREATED: 'quiz_created',
  QUIZ_UPDATED: 'quiz_updated',
  QUIZ_DELETED: 'quiz_deleted',
  MODULE_CREATED: 'module_created',
  MODULE_UPDATED: 'module_updated',
  MODULE_DELETED: 'module_deleted',
  PROGRAM_CREATED: 'program_created',
  PROGRAM_UPDATED: 'program_updated',
  PROGRAM_DELETED: 'program_deleted',
  ENROLLMENT_CREATED: 'enrollment_created',
  ENROLLMENT_UPDATED: 'enrollment_updated',
  ENROLLMENT_COMPLETED: 'enrollment_completed',
  ENROLLMENT_CANCELLED: 'enrollment_cancelled',
  ENROLLMENT_DELETED: 'enrollment_deleted',
  LICENSE_CREATED: 'license_created',
  LICENSE_UPDATED: 'license_updated',
  LICENSE_REQUEST_UPDATED: 'license_request_updated',
  GRANT_OPPORTUNITY_CREATED: 'grant_opportunity_created',
  GRANT_OPPORTUNITY_UPDATED: 'grant_opportunity_updated',
  GRANT_OPPORTUNITY_DELETED: 'grant_opportunity_deleted',
  GRANT_APPLICATION_CREATED: 'grant_application_created',
  GRANT_APPLICATION_UPDATED: 'grant_application_updated',
  TAX_APPLICATION_CREATED: 'tax_application_created',
  WOTC_APPLICATION_CREATED: 'wotc_application_created',
  WOTC_APPLICATION_UPDATED: 'wotc_application_updated',
  WOTC_APPLICATION_DELETED: 'wotc_application_deleted',
  PAYROLL_RECORD_UPDATED: 'payroll_record_updated',
  TRANSFER_HOURS_UPDATED: 'transfer_hours_updated',
  PROGRAM_HOLDER_UPDATED: 'program_holder_updated',
  PROGRAM_HOLDER_VERIFIED: 'program_holder_verified',
  PROGRAM_HOLDER_DOC_REVIEWED: 'program_holder_doc_reviewed',
  PROGRAM_HOLDER_BANKING_UPDATED: 'program_holder_banking_updated',
  PARTNER_INQUIRY_UPDATED: 'partner_inquiry_updated',
  AFFILIATE_CREATED: 'affiliate_created',
  EMPLOYEE_CREATED: 'employee_created',
  EMPLOYEE_UPDATED: 'employee_updated',
  EMPLOYEE_TERMINATED: 'employee_terminated',
  PAYROLL_PROCESSED: 'payroll_processed',
  LEAVE_APPROVED: 'leave_approved',
  LEAVE_DENIED: 'leave_denied',
  CAMPAIGN_CREATED: 'campaign_created',
  CAMPAIGN_SENT: 'campaign_sent',
  CONTACT_IMPORTED: 'contact_imported',
  EVENT_CREATED: 'event_created',
  EVENT_UPDATED: 'event_updated',
  EVENT_CANCELLED: 'event_cancelled',
  EVENT_REGISTRATION: 'event_registration',
  SSO_CONNECTION_CREATED: 'sso_connection_created',
  SSO_CONNECTION_UPDATED: 'sso_connection_updated',
  SSO_LOGIN: 'sso_login',
  SECURITY_BREACH_ATTEMPT: 'security_breach_attempt',
  PERMISSION_DENIED: 'permission_denied',
  API_KEY_CREATED: 'api_key_created',
  API_KEY_REVOKED: 'api_key_revoked',
  DATA_EXPORTED: 'data_exported',
  DATA_IMPORTED: 'data_imported',
  DATA_DELETED: 'data_deleted',
  SETTINGS_UPDATED: 'settings_updated',
  INTEGRATION_CONFIGURED: 'integration_configured',
  MIGRATION_RUN: 'migration_run',
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
  EXTERNAL_MODULE_UPDATED: 'external_module_updated',
  GRADE_UPDATED: 'grade_updated',
  INTEGRATION_UPDATED: 'integration_updated',
  INCENTIVE_CREATED: 'incentive_created',
  JOB_CREATED: 'job_created',
} as const;

export function getRequestMetadata(req: Request | { headers: Headers; ip?: string }) {
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

export async function auditedAction<T>(
  req: Request | { headers: Headers; ip?: string },
  action: string,
  resourceType: string | null,
  fn: () => Promise<T>,
  options?: {
    tenantId?: string;
    userId?: string;
    metadata?: Record<string, any>;
  },
): Promise<T> {
  const { ipAddress, userAgent } = getRequestMetadata(req);

  try {
    const result = await fn();
    await logAuditEvent({
      tenantId: options?.tenantId,
      userId: options?.userId,
      action,
      resourceType,
      resourceId: typeof result === 'object' && result && 'id' in result ? String(result.id) : null,
      metadata: options?.metadata,
      ipAddress,
      userAgent,
    });
    return result;
  } catch (error) {
    await logAuditEvent({
      tenantId: options?.tenantId,
      userId: options?.userId,
      action: `${action}_failed`,
      resourceType,
      metadata: { ...options?.metadata, error: 'Operation failed' },
      ipAddress,
      userAgent,
    });
    throw error;
  }
}

export type AdminAuditParams = {
  action: string;
  target_type: string;
  target_id: string;
  metadata?: Record<string, unknown>;
};

export async function writeAdminAuditEvent(
  supabase: { auth: { getUser: () => Promise<{ data: { user: { id: string } | null } }> } },
  params: AdminAuditParams,
): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await logAuditEvent({
      userId: user?.id ?? null,
      action: params.action,
      resourceType: params.target_type,
      resourceId: params.target_id,
      metadata: params.metadata ?? {},
    });
  } catch (error) {
    void onAuditFailure('writeAdminAuditEvent', error, {
      action: params.action,
      target_type: params.target_type,
      target_id: params.target_id,
    });
  }
}
