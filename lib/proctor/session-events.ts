import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

export type ExamEventType =
  | 'session_created'
  | 'id_verified'
  | 'exam_started'
  | 'camera_connected'
  | 'recording_uploaded'
  | 'result_recorded'
  | 'session_voided'
  | 'proctor_flagged'
  | 'retest_detected'
  | 'notes_updated';

/**
 * Append an immutable event to exam_session_events.
 * Non-throwing — failures are logged but never break the primary flow.
 */
export async function appendSessionEvent(
  db: SupabaseClient,
  sessionId: string,
  eventType: ExamEventType,
  actorId: string,
  actorRole: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const { error } = await db.from('exam_session_events').insert({
    session_id: sessionId,
    event_type: eventType,
    actor_id: actorId,
    actor_role: actorRole,
    metadata,
  });

  if (error) {
    logger.error(`[session-events] Failed to append ${eventType} for session ${sessionId}:`, error.message);
  }
}
