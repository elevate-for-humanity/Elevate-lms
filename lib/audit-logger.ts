/**
 * Audit Logging System
 *
 * Logs security-sensitive operations for compliance and debugging.
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

export type AuditEventType =
  | 'auth.login'
  | 'auth.logout'
  | 'auth.signup'
  | 'auth.password_reset'
  | 'auth.failed_login'
  | 'dashboard.access'
  | 'dashboard.unauthorized_attempt'
  | 'admin.action'
  | 'data.export'
  | 'data.delete'
  | 'license.change'
  | 'tenant.switch'
  | 'compliance.report_generated'
  | 'security.suspicious_activity';

export interface AuditLogEntry {
  event_type: AuditEventType;
  user_id?: string;
  user_email?: string;
  user_role?: string;
  tenant_id?: string;
  resource_type?: string;
  resource_id?: string;
  action: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  error_message?: string;
}

/**
 * Log an audit event
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    // Only log in production or if explicitly enabled
    if (
      process.env.NODE_ENV === 'development' &&
      !process.env.ENABLE_AUDIT_LOGGING
    ) {
      return;
    }

    // Check if Supabase is available
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      logger.warn('Audit logging disabled: Supabase not configured');
      return;
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error } = await supabase.from('audit_logs').insert({
      ...entry,
      created_at: new Date().toISOString(),
    });

    if (error) {
      logger.error('Failed to log audit event:', error);
    }
  } catch (error) {
    logger.error('Audit logging error:', error);
  }
}

/**
 * Log authentication event
 */
export async function logAuthEvent(
  type: 'login' | 'logout' | 'signup' | 'password_reset' | 'failed_login',
  userId?: string,
  email?: string,
  success: boolean = true,
  error?: string
): Promise<void> {
  await logAuditEvent({
    event_type: `auth.${type}`,
    user_id: userId,
    user_email: email,
    action: type,
    success,
    error_message: error,
  });
}

/**
 * Log dashboard access
 */
export async function logDashboardAccess(
  userId: string,
  email: string,
  role: string,
  dashboard: string,
  authorized: boolean
): Promise<void> {
  await logAuditEvent({
    event_type: authorized
      ? 'dashboard.access'
      : 'dashboard.unauthorized_attempt',
    user_id: userId,
    user_email: email,
    user_role: role,
    action: `access_${dashboard}`,
    details: { dashboard, authorized },
    success: authorized,
  });
}

/**
 * Log admin action
 */
export async function logAdminAction(
  userId: string,
  email: string,
  action: string,
  resourceType?: string,
  resourceId?: string,
  details?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    event_type: 'admin.action',
    user_id: userId,
    user_email: email,
    user_role: 'admin',
    resource_type: resourceType,
    resource_id: resourceId,
    action,
    details,
    success: true,
  });
}

/**
 * Log data export (GDPR compliance)
 */
export async function logDataExport(
  userId: string,
  email: string,
  dataType: string
): Promise<void> {
  await logAuditEvent({
    event_type: 'data.export',
    user_id: userId,
    user_email: email,
    action: 'export_data',
    resource_type: dataType,
    success: true,
  });
}

/**
 * Log data deletion (GDPR compliance)
 */
export async function logDataDeletion(
  userId: string,
  email: string,
  dataType: string,
  success: boolean,
  error?: string
): Promise<void> {
  await logAuditEvent({
    event_type: 'data.delete',
    user_id: userId,
    user_email: email,
    action: 'delete_data',
    resource_type: dataType,
    success,
    error_message: error,
  });
}

/**
 * Log license change
 */
export async function logLicenseChange(
  adminId: string,
  adminEmail: string,
  tenantId: string,
  action: string,
  details: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    event_type: 'license.change',
    user_id: adminId,
    user_email: adminEmail,
    user_role: 'admin',
    tenant_id: tenantId,
    action,
    details,
    success: true,
  });
}

/**
 * Log tenant switch (super admin)
 */
export async function logTenantSwitch(
  adminId: string,
  adminEmail: string,
  fromTenantId: string,
  toTenantId: string
): Promise<void> {
  await logAuditEvent({
    event_type: 'tenant.switch',
    user_id: adminId,
    user_email: adminEmail,
    user_role: 'super_admin',
    action: 'switch_tenant',
    details: { from: fromTenantId, to: toTenantId },
    success: true,
  });
}

/**
 * Log compliance report generation
 */
export async function logComplianceReport(
  userId: string,
  email: string,
  reportType: string,
  period: string
): Promise<void> {
  await logAuditEvent({
    event_type: 'compliance.report_generated',
    user_id: userId,
    user_email: email,
    action: 'generate_report',
    resource_type: reportType,
    details: { period },
    success: true,
  });
}

/**
 * Log suspicious activity
 */
export async function logSuspiciousActivity(
  userId: string | undefined,
  email: string | undefined,
  activity: string,
  details: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    event_type: 'security.suspicious_activity',
    user_id: userId,
    user_email: email,
    action: activity,
    details,
    success: false,
  });
}

/**
 * Create audit_logs table migration
 * Run this SQL in Supabase to create the table:
 *
 * CREATE TABLE IF NOT EXISTS audit_logs (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   event_type TEXT NOT NULL,
 *   user_id UUID REFERENCES auth.users(id),
 *   user_email TEXT,
 *   user_role TEXT,
 *   tenant_id UUID,
 *   resource_type TEXT,
 *   resource_id TEXT,
 *   action TEXT NOT NULL,
 *   details JSONB,
 *   ip_address TEXT,
 *   user_agent TEXT,
 *   success BOOLEAN DEFAULT true,
 *   error_message TEXT,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
 * CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
 * CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
 * CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
 *
 * -- RLS Policies
 * ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
 *
 * -- Only admins can view audit logs
 * CREATE POLICY "Admins can view all audit logs"
 *   ON audit_logs FOR SELECT
 *   TO authenticated
 *   USING (
 *     EXISTS (
 *       SELECT 1 FROM profiles
 *       WHERE profiles.id = auth.uid()
 *       AND profiles.role IN ('admin', 'super_admin')
 *     )
 *   );
 *
 * -- Service role can insert audit logs
 * CREATE POLICY "Service role can insert audit logs"
 *   ON audit_logs FOR INSERT
 *   TO service_role
 *   WITH CHECK (true);
 */
