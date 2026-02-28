// Transactional audit coupling for compliance-critical routes.
//
// Calls the `audited_mutation` PostgreSQL function via RPC, which
// executes the business mutation and audit INSERT in a single
// transaction. If either fails, both roll back.
//
// Usage:
//   const result = await auditedMutation({
//     table: 'enrollments',
//     operation: 'update',
//     rowData: { status: 'approved', reviewed_by: user.id },
//     filter: { id: enrollmentId },
//     audit: {
//       action: 'api:post:/api/enroll/approve',
//       actorId: user.id,
//       targetType: 'enrollment',
//       targetId: enrollmentId,
//       metadata: { reason },
//     },
//   });

import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

export type MutationOperation = 'insert' | 'update' | 'upsert' | 'delete';

export interface AuditedMutationParams {
  table: string;
  operation: MutationOperation;
  rowData: Record<string, unknown>;
  filter?: Record<string, unknown>;
  conflictOn?: string[];
  audit: {
    action: string;
    actorId?: string | null;
    targetType?: string;
    targetId?: string;
    metadata?: Record<string, unknown>;
    ip?: string | null;
    userAgent?: string | null;
  };
}

export interface AuditedMutationResult<T = Record<string, unknown>> {
  data: T;
  error: null;
}

export interface AuditedMutationError {
  data: null;
  error: { message: string; code?: string };
}

/**
 * Execute a mutation + audit insert in a single PostgreSQL transaction.
 * Uses the `audited_mutation` RPC function (SECURITY DEFINER, service_role only).
 *
 * Returns `{ data, error }` matching the Supabase convention.
 */
export async function auditedMutation<T = Record<string, unknown>>(
  params: AuditedMutationParams,
): Promise<AuditedMutationResult<T> | AuditedMutationError> {
  const { table, operation, rowData, filter, conflictOn, audit } = params;

  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase.rpc('audited_mutation', {
      p_table: table,
      p_operation: operation,
      p_row_data: rowData,
      p_filter: filter ?? null,
      p_conflict_on: conflictOn ?? null,
      p_audit_action: audit.action,
      p_audit_actor_id: audit.actorId ?? null,
      p_audit_target_type: audit.targetType ?? null,
      p_audit_target_id: audit.targetId ?? null,
      p_audit_metadata: audit.metadata ?? {},
      p_audit_ip: audit.ip ?? null,
      p_audit_user_agent: audit.userAgent ?? null,
    });

    if (error) {
      logger.error('[audited-mutation] RPC error', new Error(error.message), {
        table,
        operation,
        auditAction: audit.action,
      });
      Sentry.captureException(new Error(error.message), {
        tags: { subsystem: 'audited_mutation', table, operation },
      });
      return { data: null, error: { message: error.message, code: error.code } };
    }

    return { data: data as T, error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logger.error('[audited-mutation] Exception', e as Error, {
      table,
      operation,
      auditAction: audit.action,
    });
    Sentry.captureException(e, {
      tags: { subsystem: 'audited_mutation', table, operation },
    });
    return { data: null, error: { message: msg } };
  }
}

// Re-export for convenience
export { type ActorType } from './api-audit';
