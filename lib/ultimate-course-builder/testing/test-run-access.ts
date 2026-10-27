import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';

export async function loadOwnedLearnerTest(runId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(runId)) return null;
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user || user.app_metadata?.ultimate_learner_test !== true) return null;
  const db = await requireAdminClient();
  const { data, error } = await db.from('ultimate_learner_test_runs').select('*')
    .eq('id', runId).eq('learner_id', user.id).gt('expires_at', new Date().toISOString()).maybeSingle();
  if (error) throw error;
  return data ? { run: data, db, user } : null;
}
