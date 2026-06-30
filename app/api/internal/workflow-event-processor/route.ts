/**
 * POST /api/internal/workflow-event-processor
 *
 * Cron job: bridges unprocessed platform_events rows to the workflow engine.
 * Runs every 5 minutes (every-5-min schedule in cron-scheduler.yml).
 *
 * For each unprocessed platform_events row:
 *   1. Find all enabled workflow_triggers with trigger_type='event' whose
 *      event_filter matches the event (event_type, category, severity).
 *   2. Call executeWorkflow() for each matching trigger.
 *   3. Mark the event processed_at = now() so it is not re-dispatched.
 *
 * Processes up to BATCH_SIZE events per run to bound execution time.
 * Gated by CRON_SECRET header via withRuntime({ cron: "x-header" }).
 */

import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { executeWorkflow } from '@/lib/workflows/engine';
import { logger } from '@/lib/logger';
import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BATCH_SIZE = 50;

/**
 * Returns true if the event matches the trigger's event_filter.
 * Supported filter keys: event_type, category, severity.
 * An empty filter matches all events.
 */
function eventMatchesFilter(
  event: { event_type: string; category: string; severity: string },
  filter: Record<string, unknown>,
): boolean {
  if (!filter || Object.keys(filter).length === 0) return true;
  if (filter.event_type && filter.event_type !== event.event_type) return false;
  if (filter.category && filter.category !== event.category) return false;
  if (filter.severity && filter.severity !== event.severity) return false;
  return true;
}

export const POST = withRuntime({ cron: "x-header" }, async () => {
  const db = await requireAdminClient();

  // Load unprocessed events oldest-first, bounded by BATCH_SIZE
  const { data: events, error: eventsErr } = await db
    .from('platform_events')
    .select('id, event_type, category, severity, actor_id, subject_id, subject_type, payload')
    .is('processed_at', null)
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE);

  if (eventsErr) {
    logger.error('[workflow-event-processor] Failed to load events', eventsErr);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  if (!events?.length) {
    return NextResponse.json({ ok: true, processed: 0, triggered: 0 });
  }

  // Load all enabled event-type triggers once — avoids N+1 queries
  const { data: triggers, error: triggersErr } = await db
    .from('workflow_triggers')
    .select('id, workflow_id, event_filter')
    .eq('trigger_type', 'event')
    .eq('enabled', true);

  if (triggersErr) {
    logger.error('[workflow-event-processor] Failed to load triggers', triggersErr);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  let processed = 0;
  let triggered = 0;

  for (const event of events) {
    const matchingTriggers = (triggers ?? []).filter((t) =>
      eventMatchesFilter(event, (t.event_filter as Record<string, unknown>) ?? {}),
    );

    for (const trigger of matchingTriggers) {
      try {
        await executeWorkflow(
          trigger.workflow_id,
          'event',
          {
            event_id: event.id,
            event_type: event.event_type,
            payload: event.payload ?? {},
            actor_id: event.actor_id ?? null,
            subject_id: event.subject_id ?? null,
            subject_type: event.subject_type ?? null,
          },
          trigger.id,
        );
        triggered++;
      } catch (err) {
        logger.error('[workflow-event-processor] executeWorkflow failed', err as Error, {
          event_id: event.id,
          workflow_id: trigger.workflow_id,
        });
        // Continue — mark event processed even if one workflow fails
        // to avoid re-triggering all other workflows on retry
      }
    }

    // Mark event processed regardless of trigger count (including zero matches)
    const { error: markErr } = await db
      .from('platform_events')
      .update({ processed_at: new Date().toISOString() })
      .eq('id', event.id);

    if (markErr) {
      logger.warn('[workflow-event-processor] Failed to mark event processed', {
        event_id: event.id,
        error: markErr.message,
      });
    } else {
      processed++;
    }
  }

  logger.info('[workflow-event-processor] Run complete', { processed, triggered });
  return NextResponse.json({ ok: true, processed, triggered });
});
