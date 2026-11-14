import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
/** Durable, deduplicated Admin inbox alerts. Notification failures never undo course work. */
export async function recordProductionAlert(
  db: SupabaseClient,
  input: {
    actorId: unknown;
    buildId: string;
    courseId: string;
    eventKey: string;
    title: string;
    message: string;
    attention?: boolean;
  },
) {
  if (typeof input.actorId !== 'string' || !/^[a-f0-9-]{36}$/i.test(input.actorId)) return;
  try {
    const result = await db.from('notifications').upsert(
      {
        user_id: input.actorId,
        idempotency_key: `course-production:${input.buildId}:${input.eventKey}`,
        title: input.title,
        message: input.message,
        type: input.attention ? 'warning' : 'success',
        read: false,
        action_url: '/studio/courses?courseId=' + encodeURIComponent(input.courseId),
        action_label: 'Open course production',
        metadata: { source: 'course-production', buildId: input.buildId },
      },
      { onConflict: 'idempotency_key', ignoreDuplicates: true },
    );
    if (result.error) logger.error('Course production alert persistence failed', result.error);
  } catch (error) {
    logger.error('Course production alert delivery failed', error);
  }
}
