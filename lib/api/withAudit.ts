/**
 * API route audit wrapper.
 * Intercepts Supabase mutations in API route handlers and logs audit events.
 *
 * Usage in API routes:
 *   import { auditMutation } from '@/lib/api/withAudit';
 *
 *   // After a successful mutation:
 *   await auditMutation(request, {
 *     action: 'license_updated',
 *     target_type: 'license',
 *     target_id: licenseId,
 *     metadata: { status: 'active' },
 *   });
 */
import { logAuditEvent } from '@/lib/audit';
import { logger } from '@/lib/logger';

interface AuditMutationParams {
  action: string;
  target_type: string;
  target_id: string;
  user_id?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Log an audit event from an API route context.
 * Extracts IP and user-agent from the request.
 * Never throws.
 */
export async function auditMutation(
  request: Request | null,
  params: AuditMutationParams
): Promise<void> {
  try {
    const ip = request?.headers?.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? request?.headers?.get('x-real-ip')
      ?? null;
    const userAgent = request?.headers?.get('user-agent') ?? null;

    await logAuditEvent({
      userId: params.user_id ?? null,
      action: params.action,
      resourceType: params.target_type,
      resourceId: params.target_id,
      metadata: params.metadata ?? {},
      ipAddress: ip,
      userAgent: userAgent,
    });
  } catch (e) {
    logger.error('auditMutation failed', e as Error, { params });
  }
}
