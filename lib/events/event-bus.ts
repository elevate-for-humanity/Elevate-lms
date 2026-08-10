import type { ApplicationEvent } from './application-events';
import { requireAdminClient } from '@/lib/supabase/admin';
import { emitPlatformEvent, type PlatformEventCategory } from '@/lib/platform/orchestration/events';
import { logger } from '@/lib/logger';

function categoryFor(eventType: string): PlatformEventCategory {
  if (eventType.startsWith('application.') || eventType.startsWith('admissions.')) return 'application';
  if (eventType.startsWith('funding.')) return 'workforce';
  if (eventType.startsWith('document.')) return 'application';
  if (eventType.startsWith('task.')) return 'workflow';
  if (eventType.startsWith('note.')) return 'workflow';
  return 'workflow';
}

function severityFor(eventType: string): 'info' | 'warning' | 'error' | 'critical' {
  if (['funding.denied', 'document.rejected', 'task.overdue'].includes(eventType)) return 'warning';
  return 'info';
}

/**
 * Canonical application-event publisher.
 * The former synchronous ZORA orchestration path has been retired; durable
 * platform_events are claimed and dispatched by the #580 orchestration engine.
 */
export async function publishApplicationEvent(event: ApplicationEvent): Promise<void> {
  try {
    const db = await requireAdminClient();
    const applicationId = 'applicationId' in event ? String(event.applicationId) : null;
    await emitPlatformEvent(db, {
      eventType: event.type,
      category: categoryFor(event.type),
      source: 'application-event-bus',
      subjectType: 'application',
      subjectId: applicationId,
      payload: event as unknown as Record<string, unknown>,
      severity: severityFor(event.type),
      dispatch: true,
      idempotencyKey: applicationId
        ? `application-event:${event.type}:${applicationId}:${'timestamp' in event ? String(event.timestamp) : ''}`
        : null,
    });
  } catch (error) {
    logger.error(
      'Failed to publish application event',
      error instanceof Error ? error : new Error(String(error)),
      { eventType: event.type },
    );
    throw error;
  }
}

export function createEventEnvelope(
  event: ApplicationEvent,
  metadata?: {
    correlationId?: string;
    userId?: string;
    ipAddress?: string;
  },
) {
  return {
    event,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata,
    },
  };
}
