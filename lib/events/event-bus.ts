/**
 * PARIS Application Event Bus
 *
 * Publishes application events to the event system and triggers
 * ZORA orchestration for automated workflow management.
 */

import type { ApplicationEvent } from './application-events';
import { runZoraOrchestration } from '@/lib/zora/admissions/orchestration-service';

const SYNC_ZORA_ENABLED = process.env.NEXT_PUBLIC_ENVIRONMENT !== 'production';

export async function publishApplicationEvent(event: ApplicationEvent): Promise<void> {
  try {
    await emitToPlatform(event);

    if (SYNC_ZORA_ENABLED) {
      await runZoraOrchestration(event);
    } else {
      void queueZoraOrchestration(event).catch((error) => {
        console.error('Failed to queue ZORA orchestration:', error);
      });
    }
  } catch (error) {
    console.error('Failed to publish application event:', {
      eventType: event.type,
      applicationId: 'applicationId' in event ? event.applicationId : 'unknown',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function emitToPlatform(event: ApplicationEvent): Promise<void> {
  const { emitEvent } = await import('@/lib/events/emit');
  const category = getEventCategory(event.type);
  const severity = getEventSeverity(event.type);

  await emitEvent(event.type, category as any, {
    severity,
    actor_type: 'system',
    subject_id: 'applicationId' in event ? event.applicationId : 'unknown',
    payload: event as any,
  });
}

function getEventCategory(eventType: string): string {
  if (eventType.startsWith('application.')) return 'admissions';
  if (eventType.startsWith('document.')) return 'documents';
  if (eventType.startsWith('funding.')) return 'funding';
  if (eventType.startsWith('admissions.')) return 'admissions';
  if (eventType.startsWith('task.')) return 'workflow';
  if (eventType.startsWith('note.')) return 'communication';
  return 'system';
}

function getEventSeverity(eventType: string): 'info' | 'warning' | 'error' | 'critical' {
  const urgentEvents = [
    'application.submitted',
    'admissions.decision.recorded',
    'funding.denied',
    'document.rejected',
    'task.overdue',
  ];
  const warningEvents = ['application.status.changed', 'funding.updated'];

  if (urgentEvents.includes(eventType)) return 'warning';
  if (warningEvents.includes(eventType)) return 'info';
  return 'info';
}

async function queueZoraOrchestration(event: ApplicationEvent): Promise<void> {
  const { createClient } = await import('@supabase/supabase-js');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('Missing Supabase configuration for event queue');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  let queueError: unknown = null;

  try {
    const { error } = await supabase.rpc('pgmq_enqueue', {
      queue_name: 'zora_orchestration',
      message: {
        event,
        queued_at: new Date().toISOString(),
      },
    });
    queueError = error;
  } catch (error) {
    queueError = error;
  }

  if (queueError) {
    console.warn('Outbox not available, running ZORA synchronously');
    await runZoraOrchestration(event);
  }
}

export function createEventEnvelope(
  event: ApplicationEvent,
  metadata?: {
    correlationId?: string;
    userId?: string;
    ipAddress?: string;
  },
): { event: ApplicationEvent; metadata: { timestamp: string; correlationId?: string; userId?: string; ipAddress?: string } } {
  return {
    event,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata,
    },
  };
}
