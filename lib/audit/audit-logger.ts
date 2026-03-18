/**
 * Audit Logging System for Elevate for Humanity
 * Complete audit trail for compliance and security
 */

import { createClient } from '@/lib/supabase/server';

export type AuditAction =
  // Authentication
  | 'user.login'
  | 'user.logout'
  | 'user.password_reset'
  | 'user.mfa_enabled'
  | 'user.mfa_disabled'
  // Student Actions
  | 'student.application_submitted'
  | 'student.enrollment_created'
  | 'student.enrollment_updated'
  | 'student.requirement_completed'
  | 'student.document_uploaded'
  | 'student.hours_logged'
  | 'student.appointment_scheduled'
  | 'student.profile_updated'
  // Program Holder Actions
  | 'program_holder.requirement_verified'
  | 'program_holder.requirement_rejected'
  | 'program_holder.student_status_changed'
  | 'program_holder.document_reviewed'
  // Workforce Board Actions
  | 'workforce.eligibility_determined'
  | 'workforce.funding_assigned'
  | 'workforce.funding_modified'
  | 'workforce.participant_enrolled'
  | 'workforce.participant_exited'
  // Admin Actions
  | 'admin.user_created'
  | 'admin.user_updated'
  | 'admin.user_deleted'
  | 'admin.role_assigned'
  | 'admin.role_revoked'
  | 'admin.organization_created'
  | 'admin.organization_updated'
  | 'admin.program_created'
  | 'admin.program_updated'
  | 'admin.settings_changed'
  // System Actions
  | 'system.email_sent'
  | 'system.notification_sent'
  | 'system.report_generated'
  | 'system.data_exported'
  | 'system.backup_created'
  // Security Actions
  | 'security.access_denied'
  | 'security.suspicious_activity'
  | 'security.data_breach_attempt'
  | 'security.unauthorized_access';

export interface AuditLogEntry {
  action: AuditAction;
  userId?: string;
  organizationId?: string;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
}

/**
 * Log an audit event
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('audit_logs')
      .insert({
        action: entry.action,
        user_id: entry.userId,
        tenant_id: entry.organizationId || null,
        resource_type: entry.resourceType,
        resource_id: entry.resourceId,
        details: {
          ...(entry.details || {}),
          ...(entry.errorMessage ? { error_message: entry.errorMessage } : {}),
        },
        ip_address: entry.ipAddress,
        user_agent: entry.userAgent,
        success: entry.success,
      });

    if (error) {
      console.error('Error logging audit event:', error);
      return false;
    }

    return true;
  } catch (error) { /* Error handled silently */ 
    console.error('Exception logging audit event:', error);
    return false;
  }
}

/**
 * Log student action
 */
export async function logStudentAction(
  action: AuditAction,
  studentId: string,
  details?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    action,
    userId: studentId,
    resourceType: 'student',
    resourceId: studentId,
    details,
    success: true,
  });
}

/**
 * Log requirement verification
 */
export async function logRequirementVerification(
  requirementId: string,
  verifiedBy: string,
  approved: boolean,
  reason?: string
): Promise<void> {
  await logAuditEvent({
    action: approved ? 'program_holder.requirement_verified' : 'program_holder.requirement_rejected',
    userId: verifiedBy,
    resourceType: 'requirement',
    resourceId: requirementId,
    details: {
      approved,
      reason,
    },
    success: true,
  });
}

/**
 * Log funding assignment
 */
export async function logFundingAssignment(
  enrollmentId: string,
  fundingSourceId: string,
  amount: number,
  assignedBy: string
): Promise<void> {
  await logAuditEvent({
    action: 'workforce.funding_assigned',
    userId: assignedBy,
    resourceType: 'funding_assignment',
    resourceId: enrollmentId,
    details: {
      funding_source_id: fundingSourceId,
      amount,
    },
    success: true,
  });
}

/**
 * Log security event
 */
export async function logSecurityEvent(
  action: AuditAction,
  userId?: string,
  details?: Record<string, any>,
  ipAddress?: string
): Promise<void> {
  await logAuditEvent({
    action,
    userId,
    resourceType: 'security',
    details,
    ipAddress,
    success: false, // Security events are typically failures
  });
}

/**
 * Log data export
 */
export async function logDataExport(
  userId: string,
  exportType: string,
  recordCount: number,
  organizationId?: string
): Promise<void> {
  await logAuditEvent({
    action: 'system.data_exported',
    userId,
    organizationId,
    resourceType: 'export',
    details: {
      export_type: exportType,
      record_count: recordCount,
      exported_at: new Date().toISOString(),
    },
    success: true,
  });
}

/**
 * Get audit logs for a user
 */
export async function getUserAuditLogs(
  userId: string,
  limit: number = 100
): Promise<any[]> {
  const supabase = await createClient();

  const { data, error }: any = await supabase
    .from('audit_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching user audit logs:', error);
    return [];
  }

  return data || [];
}

/**
 * Get audit logs for a resource
 */
export async function getResourceAuditLogs(
  resourceType: string,
  resourceId: string,
  limit: number = 100
): Promise<any[]> {
  const supabase = await createClient();

  const { data, error }: any = await supabase
    .from('audit_logs')
    .select('*')
    .eq('resource_type', resourceType)
    .eq('resource_id', resourceId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching resource audit logs:', error);
    return [];
  }

  return data || [];
}

/**
 * Get audit logs for an organization
 */
export async function getOrganizationAuditLogs(
  organizationId: string,
  startDate?: Date,
  endDate?: Date,
  limit: number = 1000
): Promise<any[]> {
  const supabase = await createClient();

  let query = supabase
    .from('audit_logs')
    .select('*')
    .eq('organization_id', organizationId);

  if (startDate) {
    query = query.gte('created_at', startDate.toISOString());
  }

  if (endDate) {
    query = query.lte('created_at', endDate.toISOString());
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching organization audit logs:', error);
    return [];
  }

  return data || [];
}

/**
 * Get security events
 */
export async function getSecurityEvents(
  startDate?: Date,
  limit: number = 100
): Promise<any[]> {
  const supabase = await createClient();

  let query = supabase
    .from('audit_logs')
    .select('*')
    .like('action', 'security.%');

  if (startDate) {
    query = query.gte('created_at', startDate.toISOString());
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching security events:', error);
    return [];
  }

  return data || [];
}

/**
 * Generate compliance report
 */
export async function generateComplianceReport(
  organizationId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  totalActions: number;
  actionsByType: Record<string, number>;
  userActivity: Record<string, number>;
  securityEvents: number;
  dataExports: number;
}> {
  const logs = await getOrganizationAuditLogs(organizationId, startDate, endDate);

  const actionsByType: Record<string, number> = {};
  const userActivity: Record<string, number> = {};
  let securityEvents = 0;
  let dataExports = 0;

  for (const log of logs) {
    // Count by action type
    actionsByType[log.action] = (actionsByType[log.action] || 0) + 1;

    // Count by user
    if (log.user_id) {
      userActivity[log.user_id] = (userActivity[log.user_id] || 0) + 1;
    }

    // Count security events
    if (log.action.startsWith('security.')) {
      securityEvents++;
    }

    // Count data exports
    if (log.action === 'system.data_exported') {
      dataExports++;
    }
  }

  return {
    totalActions: logs.length,
    actionsByType,
    userActivity,
    securityEvents,
    dataExports,
  };
}

/**
 * Export audit logs to CSV
 */
export async function exportAuditLogsToCSV(
  organizationId: string,
  startDate: Date,
  endDate: Date
): Promise<string> {
  const logs = await getOrganizationAuditLogs(organizationId, startDate, endDate);

  // CSV header
  const header = 'Timestamp,Action,User ID,Resource Type,Resource ID,Success,IP Address,Details\n';

  // CSV rows
  const rows = logs.map(log => {
    const details = JSON.stringify(log.details || {}).replace(/"/g, '""');
    return [
      log.created_at,
      log.action,
      log.user_id || '',
      log.resource_type || '',
      log.resource_id || '',
      log.success ? 'Yes' : 'No',
      log.ip_address || '',
      `"${details}"`,
    ].join(',');
  }).join('\n');

  return header + rows;
}

/**
 * Retention policy: Delete old audit logs
 * Should be run as a scheduled job
 */
export async function cleanupOldAuditLogs(retentionDays: number = 365): Promise<number> {
  const supabase = await createClient();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const { data, error }: any = await supabase
    .from('audit_logs')
    .delete()
    .lt('created_at', cutoffDate.toISOString())
    .select('id');

  if (error) {
    console.error('Error cleaning up old audit logs:', error);
    return 0;
  }

  return data?.length || 0;
}
