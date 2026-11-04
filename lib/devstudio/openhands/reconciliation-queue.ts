import type { SupabaseClient } from '@supabase/supabase-js';

// Failed history must not occupy the active-work budget or trigger fresh failures.
export async function loadOpenHandsReconciliationQueue(db: SupabaseClient, limit: number) {
  const size = Math.max(1, Math.min(limit, 50));
  const active = await db.from('ai_tasks').select('*')
    .eq('tool_name', 'openhands.execute').eq('status', 'running')
    .order('updated_at', { ascending: true }).order('id', { ascending: true }).limit(size);
  if (active.error) throw new Error(`Unable to load active OpenHands tasks: ${active.error.message}`);
  const tasks = [...(active.data ?? [])];
  if (tasks.length >= size) return tasks;

  // Page past exhausted retryable records without changing their audit history.
  for (let page = 0; page < 20; page += 1) {
    const failed = await db.from('ai_tasks').select('*')
      .eq('tool_name', 'openhands.execute').eq('status', 'failed')
      .eq('result_json->evaluation->>status', 'FAIL_RETRYABLE')
      .order('updated_at', { ascending: true }).order('id', { ascending: true })
      .range(page * 100, page * 100 + 99);
    if (failed.error) throw new Error(`Unable to load retryable OpenHands tasks: ${failed.error.message}`);
    for (const task of failed.data ?? []) {
      const attempts = Number(task.attempts ?? 1);
      const maximum = Number(task.max_attempts ?? 3);
      if (Number.isFinite(attempts) && Number.isFinite(maximum) && attempts < maximum) {
        tasks.push(task);
        if (tasks.length >= size) return tasks;
      }
    }
    if ((failed.data?.length ?? 0) < 100) return tasks;
  }
  throw new Error('OpenHands retry queue scan exceeded its bounded page budget');
}
