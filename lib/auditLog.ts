import { logger } from '@/lib/logger';
import { getAdminClient } from '@/lib/supabase/admin';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'EXPORT'
  | 'LOGIN'
  | 'LOGOUT'
  | 'APPROVE'
  | 'REJECT'
  | 'SUBMIT'
  | 'PII_ACCESS'
  | 'PII_VERIFY'
  | 'PII_EXPORT';

export type AuditEntity =
  | 'referral'
  | 'apprentice'
  | 'employer'
  | 'funding'
  | 'rapids'
  | 'invoice'
  | 'wotc'
  | 'ojt'
  | 'user'
  | 'audit_snapshot'
  | 'employer_onboarding'
  | 'license_purchase'
  | 'tenant'
  | 'ssn'
  | 'tax_return'
  | 'payroll'
  | 'pii';

export type ActorRole = 'sponsor' | 'employer' | 'workone' | 'admin' | 'system' | 'staff' | 'preparer';

export interface AuditLogParams {
  actor_user_id?: string;
  actor_role?: ActorRole;
  action: AuditAction;
  entity: AuditEntity;
  entity_id?: string;
  before?: any;
  after?: any;
  req?: Request;
  metadata?: Record<string, any>;
}

/**
 * Immutable audit logging for compliance and oversight
 *
 * Usage:
 * await auditLog({
 *   actor_user_id: user.id,
 *   actor_role: 'sponsor',
 *   action: 'UPDATE',
 *   entity: 'funding',
 *   entity_id: fundingCase.id,
 *   before: oldData,
 *   after: newData,
 *   req
 * })
 */
export async function auditLog({
  actor_user_id,
  actor_role = 'system',
  action,
  entity,
  entity_id,
  before,
  after,
  req,
  metadata,
}: AuditLogParams): Promise<void> {
  try {
    const supabase = await getAdminClient();

    const logEntry = {
      actor_user_id,
      actor_role,
      action,
      entity,
      entity_id,
      before: before ? JSON.parse(JSON.stringify(before)) : null,
      after: after ? JSON.parse(JSON.stringify(after)) : null,
      ip_address: req?.headers.get('x-forwarded-for') || req?.headers.get('x-real-ip') || null,
      user_agent: req?.headers.get('user-agent') || null,
      metadata: metadata || null,
    };

    const { error } = await supabase.from('audit_logs').insert([logEntry]);

    if (error) {
      logger.error('Failed to write audit log:', error);
      // Don't throw - audit logging should never break the main flow
    }
  } catch (error) { /* Error handled silently */ 
    logger.error('Audit log exception:', error);
    // Silent fail - audit logging is critical but shouldn't break operations
  }
}

/**
 * Query audit logs for a specific entity
 */
interface GetAuditLogsParams {
  entity?: AuditEntity;
  entity_id?: string;
  action?: AuditAction;
  actor_id?: string;
  target_type?: string;
  target_id?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
}

interface GetAuditLogsResult {
  success: boolean;
  data?: any[];
  logs?: any[];
  error?: string;
}

export async function getAuditLogs(
  params: GetAuditLogsParams | AuditEntity,
  entity_id?: string,
  limit = 100
): Promise<GetAuditLogsResult> {
  const supabase = await getAdminClient();

  // Handle both old positional args and new object params
  let queryParams: GetAuditLogsParams;
  if (typeof params === 'string') {
    // Old signature: getAuditLogs(entity, entity_id, limit)
    queryParams = {
      entity: params as AuditEntity,
      entity_id,
      limit,
    };
  } else {
    // New signature: getAuditLogs({ entity, entity_id, ... })
    queryParams = params;
  }

  let query = supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(queryParams.limit || 100);

  if (queryParams.entity) {
    query = query.eq('entity', queryParams.entity);
  }
  if (queryParams.entity_id) {
    query = query.eq('entity_id', queryParams.entity_id);
  }
  if (queryParams.action) {
    query = query.eq('action', queryParams.action);
  }
  if (queryParams.actor_id) {
    query = query.eq('actor_user_id', queryParams.actor_id);
  }
  if (queryParams.start_date) {
    query = query.gte('created_at', queryParams.start_date);
  }
  if (queryParams.end_date) {
    query = query.lte('created_at', queryParams.end_date);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Failed to fetch audit logs:', error);
    return { success: false, error: 'Operation failed' };
  }

  return { success: true, data: data || [], logs: data || [] };
}

/**
 * Query audit logs by actor
 */
export async function getAuditLogsByActor(
  actor_user_id: string,
  limit = 100
) {
  const supabase = await getAdminClient();

  const { data, error }: any = await supabase
    .from('audit_logs')
    .select('*')
    .eq('actor_user_id', actor_user_id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.error('Failed to fetch audit logs by actor:', error);
    return [];
  }

  return data || [];
}

/**
 * Get audit log statistics
 */
export async function getAuditStats(days = 30) {
  const supabase = await getAdminClient();

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error }: any = await supabase
    .from('audit_logs')
    .select('action, entity, actor_role')
    .gte('created_at', since.toISOString());

  if (error || !data) {
    return {
      total: 0,
      byAction: {},
      byEntity: {},
      byRole: {},
    };
  }

  const stats = {
    total: data.length,
    byAction: data.reduce((acc: any, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {}),
    byEntity: data.reduce((acc: any, log) => {
      acc[log.entity] = (acc[log.entity] || 0) + 1;
      return acc;
    }, {}),
    byRole: data.reduce((acc: any, log) => {
      acc[log.actor_role] = (acc[log.actor_role] || 0) + 1;
      return acc;
    }, {}),
  };

  return stats;
}

/**
 * Helper to log before/after changes
 */
export async function auditChange(
  params: Omit<AuditLogParams, 'action'> & { action?: AuditAction }
) {
  return auditLog({
    ...params,
    action: params.action || 'UPDATE',
  });
}

/**
 * Helper to log exports (for DWD/WorkOne compliance)
 */
export async function auditExport(
  entity: AuditEntity,
  actor_user_id?: string,
  actor_role: ActorRole = 'workone',
  req?: Request
) {
  return auditLog({
    actor_user_id,
    actor_role,
    action: 'EXPORT',
    entity,
    req,
  });
}

/**
 * Log PII/SSN access for FERPA compliance.
 * Call this in any route that reads, writes, or verifies SSN data.
 */
export async function auditPiiAccess({
  actor_user_id,
  actor_role = 'system',
  action = 'PII_ACCESS',
  entity = 'ssn',
  entity_id,
  req,
  metadata,
}: {
  actor_user_id?: string;
  actor_role?: ActorRole;
  action?: 'PII_ACCESS' | 'PII_VERIFY' | 'PII_EXPORT';
  entity?: AuditEntity;
  entity_id?: string;
  req?: Request;
  metadata?: Record<string, any>;
}) {
  return auditLog({
    actor_user_id,
    actor_role,
    action,
    entity,
    entity_id,
    req,
    metadata,
  });
}

