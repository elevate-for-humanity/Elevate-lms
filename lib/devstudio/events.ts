import 'server-only';

import { requireAdminClient } from '@/lib/supabase/admin';

export type StudioEventType =
  | 'workspace.opened'
  | 'workspace.closed'
  | 'command.executed'
  | 'deployment.requested'
  | 'deployment.started'
  | 'deployment.completed'
  | 'deployment.failed'
  | 'container.started'
  | 'container.stopped'
  | 'evaluation.started'
  | 'evaluation.completed'
  | 'cfd.project.created'
  | 'cfd.simulation.started'
  | 'cfd.simulation.completed'
  | 'ai.chat.started'
  | 'ai.chat.completed'
  | 'file.created'
  | 'file.updated'
  | 'file.deleted';

export interface StudioEvent {
  id?: string;
  organization_id: string;
  user_id: string;
  event_type: StudioEventType;
  workspace_id?: string;
  metadata: Record<string, unknown>;
  created_at?: string;
}

export async function emitStudioEvent(event: StudioEvent): Promise<void> {
  try {
    const db = await requireAdminClient();

    const { error } = await db.from('studio_events').insert({
      organization_id: event.organization_id,
      user_id: event.user_id,
      event_type: event.event_type,
      workspace_id: event.workspace_id ?? null,
      metadata: event.metadata,
    });

    if (error) {
      console.error('[STUDIO_EVENT_FAILED]', {
        eventType: event.event_type,
        error: error.message,
      });
    }
  } catch (err) {
    console.error('[STUDIO_EVENT_UNAVAILABLE]', {
      eventType: event.event_type,
      error: err,
    });
  }
}

export async function getStudioEvents(
  organizationId: string,
  options?: {
    workspaceId?: string;
    eventType?: StudioEventType;
    limit?: number;
    offset?: number;
  },
): Promise<StudioEvent[]> {
  const db = await requireAdminClient();

  let query = db
    .from('studio_events')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(options?.limit ?? 50);

  if (options?.workspaceId) {
    query = query.eq('workspace_id', options.workspaceId);
  }
  if (options?.eventType) {
    query = query.eq('event_type', options.eventType);
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit ?? 50) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[GET_STUDIO_EVENTS_FAILED]', { error: error.message });
    return [];
  }

  return (data ?? []) as StudioEvent[];
}
