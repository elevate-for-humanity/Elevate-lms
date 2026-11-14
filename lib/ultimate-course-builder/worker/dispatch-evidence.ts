import { logger } from '@/lib/logger';
import type { SupabaseClient } from '@supabase/supabase-js';
/** Save acknowledgement separately from worker execution; never replace payload/checkpoints. */
export async function recordCourseDispatch(
  db: SupabaseClient,
  jobId: string,
  dispatch: { dispatched: boolean; launchMode?: string },
  actorId: string,
) {
  try {
    const current = await db.from('ultimate_build_jobs').select('monitor').eq('id', jobId).single();
    if (current.error) throw current.error;
    const monitor = current.data.monitor;
    let update = db
      .from('ultimate_build_jobs')
      .update({
        monitor: {
          ...monitor,
          lastDispatch: {
            accepted: dispatch.dispatched,
            mode: dispatch.launchMode ?? null,
            requestedBy: actorId,
            requestedAt: new Date().toISOString(),
          },
        },
      })
      .eq('id', jobId);
    update =
      monitor == null ? update.is('monitor', null) : update.eq('monitor', JSON.stringify(monitor));
    const saved = await update.select('id');
    if (saved.error) throw saved.error;
    // A concurrent supervisor wins. Its fresh claim/heartbeat remains authoritative.
    return saved.data?.length === 1;
  } catch (error) {
    logger.error('Worker dispatch acknowledgement could not be persisted', error);
    return false;
  }
}
