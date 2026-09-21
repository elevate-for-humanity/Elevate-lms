import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

export type EnvatoWorkspaceManifestItem = {
  providerItemId: string;
  title: string;
  sourceUrl?: string;
  intendedLessonId?: string;
  intendedScene?: string;
  status: 'selected' | 'downloaded' | 'stored' | 'attached' | 'rejected';
  downloadId?: string;
  storagePath?: string;
};

export async function upsertEnvatoWorkspaceManifest(input: {
  db: SupabaseClient;
  runId: string;
  courseId: string;
  workspaceName: string;
  envatoWorkspaceUrl?: string;
  items: EnvatoWorkspaceManifestItem[];
}) {
  const name = `Envato workspace: ${input.workspaceName}`;
  const { data: existing } = await input.db
    .from('studio_run_artifacts')
    .select('id')
    .eq('run_id', input.runId)
    .eq('artifact_type', 'envato-workspace-manifest')
    .eq('name', name)
    .maybeSingle();
  const payload = {
    run_id: input.runId,
    artifact_type: 'envato-workspace-manifest',
    name,
    uri: input.envatoWorkspaceUrl ?? null,
    status: 'generated',
    metadata: {
      course_id: input.courseId,
      provider: 'envato',
      workspace_name: input.workspaceName,
      acquisition_mode: 'envato-workspace-batch',
      items: input.items,
      counts: input.items.reduce<Record<string, number>>((acc, item) => {
        acc[item.status] = (acc[item.status] ?? 0) + 1;
        return acc;
      }, {}),
    },
    evidence: [{ source: 'envato-authenticated-browser', captured_at: new Date().toISOString() }],
    updated_at: new Date().toISOString(),
  };
  const result = existing?.id
    ? await input.db.from('studio_run_artifacts').update(payload).eq('id', existing.id).select('*').single()
    : await input.db.from('studio_run_artifacts').insert(payload).select('*').single();
  if (result.error) throw result.error;
  return result.data;
}
