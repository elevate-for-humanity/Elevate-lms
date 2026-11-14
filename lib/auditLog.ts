import { logger } from '@/lib/logger';
import { requireAdminClient } from '@/lib/supabase/admin';
import { auditLog as writeCanonicalAudit } from '@/lib/logging/auditLog';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'EXPORT'
  | 'VIEW_REPORT'
  | 'EXPORT_REPORT'
  | 'STATUS_CHANGE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'APPROVE'
  | 'REJECT'
  | 'SUBMIT'
  | 'PII_ACCESS'
  | 'PII_VERIFY'
  | 'PII_EXPORT'
  | 'enrollment.create'
  | 'enrollment.delete'
  | 'certificate.issue'
  | 'grade.update'
  | 'user.delete';

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
  | 'pii'
  | 'participant_report'
  | 'enrollment'
  | 'application'
  | 'program'
  | 'certificate';

export type ActorRole =
  | 'sponsor'
  | 'employer'
  | 'workone'
  | 'admin'
  | 'system'
  | 'staff'
  | 'preparer';

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
 * Compatibility API for older callers.
 * New code must import auditLog from @/lib/logging/auditLog.
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
  return writeCanonicalAudit({
    actorId: actor_user_id,
    actorRole: actor_role,
    action,
    entity,
    entityId: entity_id,
    ipAddress: req?.headers.get('x-forwarded-for') || req?.headers.get('x-real-ip') || undefined,
    userAgent: req?.headers.get('user-agent') || undefined,
    metadata: {
      ...(metadata || {}),
      ...(before !== undefined ? { before } : {}),
      ...(after !== undefined ? { after } : {}),
    },
  });
}

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

function toLegacyAuditShape(row: any) {
  return {
    ...row,
    actor_user_id: row.user_id ?? row.actor_id ?? null,
    actor_role: row.role ?? null,
    entity: row.resource_type ?? row.target_type ?? null,
    entity_id: row.resource_id ?? row.target_id ?? null,
    metadata: row.details ?? row.metadata ?? {},
  };
}

export async function getAuditLogs(
  params: GetAuditLogsParams | AuditEntity,
  entity_id?: string,
  limit = 100,
): Promise<GetAuditLogsResult> {
  const supabase = await requireAdminClient();
  const queryParams: GetAuditLogsParams =
    typeof params === 'string'
      ? { entity: params as AuditEntity, entity_id, limit }
      : params;

  let query = supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(queryParams.limit || 100);

  const resourceType = queryParams.entity ?? queryParams.target_type;
  const resourceId = queryParams.entity_id ?? queryParams.target_id;

  if (resourceType) query = query.eq('resource_type', resourceType);
  if (resourceId) query = query.eq('resource_id', resourceId);
  if (queryParams.action) query = query.eq('action', queryParams.action);
  if (queryParams.actor_id) query = query.eq('user_id', queryParams.actor_id);
  if (queryParams.start_date) query = query.gte('created_at', queryParams.start_date);
  if (queryParams.end_date) query = query.lte('created_at', queryParams.end_date);

  const { data, error } = await query;
  if (error) {
    logger.error('Failed to fetch audit logs:', error);
    return { success: false, error: 'Operation failed' };
  }

  const normalized = (data || []).map(toLegacyAuditShape);
  return { success: true, data: normalized, logs: normalized };
}

export async function getAuditLogsByActor(actor_user_id: string, limit = 100) {
  const supabase = await requireAdminClient();
  const { data, error }: any = await supabase
    .from('audit_logs')
    .select('*')
    .eq('user_id', actor_user_id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.error('Failed to fetch audit logs by actor:', error);
    return [];
  }

  return (data || []).map(toLegacyAuditShape);
}

export async function getAuditStats(days = 30) {
  const supabase = await requireAdminClient();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error }: any = await supabase
    .from('audit_logs')
    .select('action, resource_type, role')
    .gte('created_at', since.toISOString());

  if (error || !data) {
    return { total: 0, byAction: {}, byEntity: {}, byRole: {} };
  }

  return {
    total: data.length,
    byAction: data.reduce((acc: any, log: any) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {}),
    byEntity: data.reduce((acc: any, log: any) => {
      const entity = log.resource_type || 'unknown';
      acc[entity] = (acc[entity] || 0) + 1;
      return acc;
    }, {}),
    byRole: data.reduce((acc: any, log: any) => {
      const role = log.role || 'system';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {}),
  };
}

export async function auditChange(
  params: Omit<AuditLogParams, 'action'> & { action?: AuditAction },
) {
  return auditLog({ ...params, action: params.action || 'UPDATE' });
}

export async function auditExport(
  entity: AuditEntity,
  actor_user_id?: string,
  actor_role: ActorRole = 'workone',
  req?: Request,
) {
  return auditLog({ actor_user_id, actor_role, action: 'EXPORT', entity, req });
}

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
  return auditLog({ actor_user_id, actor_role, action, entity, entity_id, req, metadata });
}
