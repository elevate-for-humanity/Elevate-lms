// lib/audit.ts
// Audit logging helper for enterprise compliance
//
// Failure policy: audit writes NEVER throw, but failures are:
// 1. Logged to logger.error (application logs)
// 2. Written to stderr as structured JSON (container-level visibility)
// 3. Counted in auditFailureCount (scrapable by monitoring)
// 4. Written to fallback file if DB is unreachable (disaster recovery)
import { createSupabaseClient } from '@/lib/supabase-api';
import { logger } from '@/lib/logger';

// Telemetry: in-process failure counter. Expose via /api/health or metrics endpoint.
let auditFailureCount = 0;
let auditSuccessCount = 0;

export function getAuditTelemetry() {
  return { auditSuccessCount, auditFailureCount };
}

function onAuditFailure(context: string, error: unknown, event: Record<string, unknown>) {
  auditFailureCount++;
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Channel 1: Structured log — visible in container/edge logs
  console.error(JSON.stringify({
    level: 'AUDIT_WRITE_FAILURE',
    timestamp: new Date().toISOString(),
    context,
    error: errorMessage,
    event,
  }));

  // Channel 2: Application logger
  logger.error(context, error as Error, { event });

  // Channel 3: Durable DB fallback — separate table with minimal constraints.
  // Uses a fresh client to avoid reusing the one that just failed.
  try {
    const fallbackClient = createSupabaseClient();
    // Fire-and-forget: don't await, don't let this throw
    fallbackClient.from('audit_failures').insert({
      context,
      error_message: errorMessage,
      original_event: event,
    }).then(() => {}).catch(() => {});
  } catch {
    // If even creating the client fails, fall through to file
  }

  // Channel 4: Local file — last resort if DB is completely unreachable.
  // NOTE: On Netlify Functions, /tmp is ephemeral (wiped between invocations).
  // This channel is only durable in long-lived runtimes (dev, Docker, VMs).
  // On serverless, stderr (channel 1) is the real last resort.
  if (typeof globalThis.process !== 'undefined') {
    try {
      // Dynamic require: fs is unavailable in edge runtime, so this is
      // guarded by the process check and wrapped in try/catch.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { appendFileSync } = require('node:fs');
      const line = JSON.stringify({ ...failureRecord, event }) + '\n';
      appendFileSync('/tmp/audit-fallback.jsonl', line);
    } catch {
      // stderr already has it — edge runtime or fs unavailable
    }
  }
}

function onAuditSuccess() {
  auditSuccessCount++;
}

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
// PII field names to redact from metadata payloads.
// Values are replaced with '[REDACTED]' before insert.
const PII_METADATA_KEYS = new Set([
  'email', 'user_email', 'created_emails', 'anonymized_email',
  'phone', 'phone_number', 'mobile',
  'ssn', 'ssn_hash', 'ssn_last4', 'ssn_last_4',
  'date_of_birth', 'dob',
  'address', 'address_line1', 'address_line2', 'street_address',
  'full_name', 'first_name', 'last_name', 'name',
  'tax_id', 'itin', 'ein',
  'bank_account', 'routing_number', 'account_number',
  'driver_license', 'state_id', 'government_id',
  'file_path', 'file_url', 'document_url', 'signed_url',
  'password', 'temp_password', 'temporary_password',
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
    user_id: event.userId,
    action: event.action,
    resource_type: event.resourceType,
    resource_id: event.resourceId,
    metadata: sanitizeMetadata(event.metadata || {}),
    ip_address: event.ipAddress,
    user_agent: event.userAgent,
  };

  try {
    const supabase = createSupabaseClient();
    const { error } = await supabase.from('audit_logs').insert(payload);

    if (error) {
      onAuditFailure('logAuditEvent: DB insert rejected', error, payload);
    } else {
      onAuditSuccess();
    }
  } catch (e) {
    onAuditFailure('logAuditEvent: exception', e, payload);
  }
}

/**
 * Common audit actions for consistency
 */
export const AuditActions = {
  // User / profile actions
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
  USER_DELETED: 'user_deleted',
  USER_ROLE_CHANGED: 'user_role_changed',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  USER_PASSWORD_CHANGED: 'user_password_changed',
  USER_2FA_ENABLED: 'user_2fa_enabled',
  USER_2FA_DISABLED: 'user_2fa_disabled',

  // Course / content actions
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

  // Enrollment actions
  ENROLLMENT_CREATED: 'enrollment_created',
  ENROLLMENT_UPDATED: 'enrollment_updated',
  ENROLLMENT_COMPLETED: 'enrollment_completed',
  ENROLLMENT_CANCELLED: 'enrollment_cancelled',
  ENROLLMENT_DELETED: 'enrollment_deleted',

  // License / access actions
  LICENSE_CREATED: 'license_created',
  LICENSE_UPDATED: 'license_updated',
  LICENSE_REQUEST_UPDATED: 'license_request_updated',

  // Grant / funding actions
  GRANT_OPPORTUNITY_CREATED: 'grant_opportunity_created',
  GRANT_OPPORTUNITY_UPDATED: 'grant_opportunity_updated',
  GRANT_OPPORTUNITY_DELETED: 'grant_opportunity_deleted',
  GRANT_APPLICATION_CREATED: 'grant_application_created',
  GRANT_APPLICATION_UPDATED: 'grant_application_updated',

  // Tax / WOTC actions
  TAX_APPLICATION_CREATED: 'tax_application_created',
  WOTC_APPLICATION_CREATED: 'wotc_application_created',
  WOTC_APPLICATION_UPDATED: 'wotc_application_updated',
  WOTC_APPLICATION_DELETED: 'wotc_application_deleted',

  // Payroll / financial actions
  PAYROLL_RECORD_UPDATED: 'payroll_record_updated',
  TRANSFER_HOURS_UPDATED: 'transfer_hours_updated',

  // Program holder / verification actions
  PROGRAM_HOLDER_UPDATED: 'program_holder_updated',
  PROGRAM_HOLDER_VERIFIED: 'program_holder_verified',
  PROGRAM_HOLDER_DOC_REVIEWED: 'program_holder_doc_reviewed',
  PROGRAM_HOLDER_BANKING_UPDATED: 'program_holder_banking_updated',

  // Partner / affiliate actions
  PARTNER_INQUIRY_UPDATED: 'partner_inquiry_updated',
  AFFILIATE_CREATED: 'affiliate_created',

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

  // External module actions
  EXTERNAL_MODULE_UPDATED: 'external_module_updated',

  // Grading actions
  GRADE_UPDATED: 'grade_updated',

  // Integration actions
  INTEGRATION_UPDATED: 'integration_updated',

  // Incentive / job actions
  INCENTIVE_CREATED: 'incentive_created',
  JOB_CREATED: 'job_created',
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

// ─── Admin page audit helper ────────────────────────────────────────────────
// For use in server components and server actions inside /admin pages.
// Resolves actor from the Supabase session automatically.
// Never throws — audit failures must not break admin operations.

export type AdminAuditParams = {
  action: string;
  target_type: string;
  target_id: string;
  metadata?: Record<string, unknown>;
};

/**
 * Write an audit event from an admin page context.
 * Reads the current user from the Supabase session.
 * Safe to call fire-and-forget (never throws).
 *
 * Usage:
 *   await writeAdminAuditEvent(supabase, {
 *     action: AuditActions.LICENSE_CREATED,
 *     target_type: 'license',
 *     target_id: newLicense.id,
 *     metadata: { plan: 'enterprise' },
 *   });
 */
export async function writeAdminAuditEvent(
  supabase: { auth: { getUser: () => Promise<{ data: { user: { id: string } | null } }> } },
  params: AdminAuditParams
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await logAuditEvent({
      userId: user?.id ?? null,
      action: params.action,
      resourceType: params.target_type,
      resourceId: params.target_id,
      metadata: params.metadata ?? {},
    });
  } catch (e) {
    onAuditFailure('writeAdminAuditEvent', e, {
      action: params.action,
      target_type: params.target_type,
      target_id: params.target_id,
    });
  }
}
