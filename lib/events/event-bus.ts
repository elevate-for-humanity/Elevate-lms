/**
 * PARIS Application Event Bus
 * 
 * Publishes application events to the event system and triggers
 * ZORA orchestration for automated workflow management.
 * 
 * For high-volume production, replace the direct call with an outbox
 * table and queue worker to ensure reliability across containers.
 */

import type { ApplicationEvent } from './application-events';
import { runZoraOrchestration } from '@/lib/zora/admissions/orchestration-service';

// Flag to enable/disable synchronous ZORA execution
// In production, this should be false to use async processing
const SYNC_ZORA_ENABLED = process.env.NEXT_PUBLIC_ENVIRONMENT !== 'production';

/**
 * Publish an application event
 * 
 * This function:
 * 1. Stores the event (via existing emit system)
 * 2. Triggers ZORA orchestration for workflow automation
 */
export async function publishApplicationEvent(
  event: ApplicationEvent,
): Promise<void> {
  try {
    // Store event using the existing platform event system
    await emitToPlatform(event);
    
    // Trigger ZORA orchestration
    // In development, this runs synchronously for debugging
    // In production, this should be queued for async processing
    if (SYNC_ZORA_ENABLED) {
      await runZoraOrchestration(event);
    } else {
      // Queue for async processing
      // TODO: Implement outbox table pattern for production
      queueZoraOrchestration(event).catch((err) => {
        console.error('Failed to queue ZORA orchestration:', err);
      });
    }
  } catch (error) {
    // Never throw - events should not break the main flow
    console.error('Failed to publish application event:', {
      eventType: event.type,
      applicationId: 'applicationId' in event ? event.applicationId : 'unknown',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Emit event to the platform event system
 */
async function emitToPlatform(event: ApplicationEvent): Promise<void> {
  // Import the existing emit system
  const { emitEvent } = await import('@/lib/events/emit');
  
  // Map application events to platform events
  const category = getEventCategory(event.type);
  const severity = getEventSeverity(event.type);
  
  await emitEvent(event.type, category as any, {
    severity,
    actor_type: 'system',
    subject_id: 'applicationId' in event ? event.applicationId : 'unknown',
    payload: event as any,
  });
}

/**
 * Get event category for platform event
 */
function getEventCategory(eventType: string): string {
  if (eventType.startsWith('application.')) return 'admissions';
  if (eventType.startsWith('document.')) return 'documents';
  if (eventType.startsWith('funding.')) return 'funding';
  if (eventType.startsWith('admissions.')) return 'admissions';
  if (eventType.startsWith('task.')) return 'workflow';
  if (eventType.startsWith('note.')) return 'communication';
  return 'system';
}

/**
 * Get event severity
 */
function getEventSeverity(eventType: string): 'info' | 'warning' | 'error' | 'critical' {
  const urgentEvents = [
    'application.submitted',
    'admissions.decision.recorded',
    'funding.denied',
    'document.rejected',
    'task.overdue',
  ];
  
  const warningEvents = [
    'application.status.changed',
    'funding.updated',
  ];
  
  if (urgentEvents.includes(eventType)) return 'warning';
  if (warningEvents.includes(eventType)) return 'info';
  return 'info';
}

/**
 * Queue ZORA orchestration for async processing
 * 
 * In production, this should write to an outbox table
 * and a background worker processes the queue.
 */
async function queueZoraOrchestration(event: ApplicationEvent): Promise<void> {
  const { createClient } = await import('@supabase/supabase-js');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('Missing Supabase configuration for event queue');
    return;
  }
  
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  
  // Write to outbox table for async processing
  const { error } = await supabase.rpc('pgmq_enqueue', {
    queue_name: 'zora_orchestration',
    message: {
      event,
      queued_at: new Date().toISOString(),
    },
  }).catch(() => {
    // pgmq might not be available, fall back to direct call
    return { error: null };
  });
  
  if (error) {
    // Fall back to direct execution
    console.warn('Outbox not available, running ZORA synchronously');
    await runZoraOrchestration(event);
  }
}

/**
 * Create event envelope with metadata
 */
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
