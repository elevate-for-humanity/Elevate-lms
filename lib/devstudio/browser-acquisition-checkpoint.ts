import type { SupabaseClient } from '@supabase/supabase-js';
import { browserTaskMatches } from './browser-planner';

/** Recover the existing owner-scoped acquisition after a page reload. The
 * ephemeral session is rebound by the agent only after live owner verification. */
export async function findAcquisitionBrowserCheckpoint(
  db: SupabaseClient, ownerId: string, runId: string, command: string,
) {
  const { data, error } = await db.from('ai_tasks').select('*')
    .eq('requested_by', ownerId).eq('studio_run_id', runId)
    .eq('tool_name', 'browser.execute')
    .in('status', ['queued', 'running', 'failed', 'awaiting_approval'])
    .order('created_at', { ascending: false }).limit(10);
  if (error) throw error;
  return (data ?? []).find((task) => browserTaskMatches(task, {
    command, sessionId: String(task.tool_input?.sessionId ?? ''),
  })) ?? null;
}
