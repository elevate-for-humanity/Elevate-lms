import 'server-only';


import { requireAdminClient } from '@/lib/supabase/admin';


export type AuditActorType = 'user' | 'agent' | 'system';


export type AuditStatus =
  | 'started'
  | 'succeeded'
  | 'failed'
  | 'denied';


export interface PlatformAuditEventInput {
  organizationId: string;
  actorUserId?: string | null;
  actorType?: AuditActorType;


  action: string;
  resourceType: string;
  resourceId?: string | null;


  status?: AuditStatus;
  metadata?: Record<string, unknown>;
}


function removeUndefinedValues(
  input: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );
}


export async function writePlatformAuditEvent(
  input: PlatformAuditEventInput,
): Promise<void> {
  try {
    const db = await requireAdminClient();


    const { error } = await db
      .from('platform_audit_events')
      .insert({
        organization_id: input.organizationId,
        actor_user_id: input.actorUserId ?? null,
        actor_type: input.actorType ?? 'user',


        action: input.action,
        resource_type: input.resourceType,
        resource_id: input.resourceId ?? null,


        status: input.status ?? 'succeeded',
        metadata: removeUndefinedValues(input.metadata ?? {}),
      });


    if (error) {
      console.error('[PLATFORM_AUDIT_INSERT_FAILED]', {
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        message: error.message,
        code: error.code,
      });
    }
  } catch (error) {
    // Audit failure must be visible in logs, but it must not convert an
    // otherwise successful user operation into an HTTP 500.
    console.error('[PLATFORM_AUDIT_UNAVAILABLE]', {
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      error,
    });
  }
}


export async function writePlatformAuditFailure(
  input: Omit<PlatformAuditEventInput, 'status'>,
  error: unknown,
): Promise<void> {
  await writePlatformAuditEvent({
    ...input,
    status: 'failed',
    metadata: {
      ...(input.metadata ?? {}),
      error:
        error instanceof Error
          ? error.message
          : String(error),
    },
  });
}
