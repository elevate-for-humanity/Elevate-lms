import 'server-only';
import {requireAdminClient} from '@/lib/supabase/admin';
import {getGitHubHeaders} from '@/lib/devstudio/github-token';
import {dispatchOpenHandsTask, refreshOpenHandsTask} from './openhands/runtime';
import {getHydratedOpenHandsConfig} from './openhands/client';
import {blockedPath} from './paris-code-engineer';
import {prepareOpenHandsRepair, assertOpenHandsRepairDiff, assertOpenHandsBlobReadback} from './paris-openhands-repair.mjs';

const REPOSITORY = 'elevate-for-humanity/Elevate-lms';

async function github(path: string, init: RequestInit = {}) {
  const response = await fetch(`https://api.github.com/repos/${REPOSITORY}${path}`, {
    ...init, headers: {...await getGitHubHeaders(), 'Content-Type': 'application/json', ...init.headers},
    cache: 'no-store', signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw Error(`PARIS_OPENHANDS_GITHUB_HTTP_${response.status}`);
  return response.json();
}

export async function stageParisOpenHandsRepair(input: {
  repairId: string; actorId: string; attempt: number; runId: number; goal: string;
  checkpoint?: any; save: (checkpoint: any, expectedSequence: number|null) => Promise<void>;
}) {
  const db = await requireAdminClient();
  const {data: owner, error: ownerError} = await db.from('profiles').select('role').eq('id', input.actorId).maybeSingle();
  if (ownerError) throw ownerError;
  if (!['admin', 'super_admin'].includes(owner?.role ?? '')) throw Error('PARIS_AUTOPILOT_OWNER_AUTHORITY_REQUIRED');
  const config = await getHydratedOpenHandsConfig();
  if (!config.configured || config.configuredRepository !== REPOSITORY) throw Error('PARIS_OPENHANDS_NOT_CONFIGURED');

  const findTask = async (correlationId: string) => {
    const {data, error} = await db.from('ai_tasks').select('*').eq('correlation_id', correlationId).limit(2);
    if (error) throw error;
    if ((data?.length ?? 0) > 1) throw Error('PARIS_OPENHANDS_DUPLICATE_CORRELATION');
    return data?.[0] ?? null;
  };
  return prepareOpenHandsRepair(input, {
    now: Date.now,
    save: input.save,
    mainSha: async () => (await github('/git/ref/heads/main')).object?.sha,
    ensureBranch: async (branch: string, baseSha: string) => {
      let ref;
      try { ref = await github('/git/ref/heads/' + encodeURIComponent(branch)); }
      catch (error) {
        if (!(error instanceof Error) || error.message !== 'PARIS_OPENHANDS_GITHUB_HTTP_404') throw error;
        ref = await github('/git/refs', {method: 'POST', body: JSON.stringify({ref: `refs/heads/${branch}`, sha: baseSha})});
      }
      if (ref.object?.sha !== baseSha) throw Error('PARIS_OPENHANDS_UNOWNED_BRANCH');
    },
    findTask,
    dispatch: dispatchOpenHandsTask,
    refresh: async (taskId: string, actorId: string) => {
      // The controller verifies ownership from the canonical ledger before
      // this existing read/reconciliation call. It never starts a retry.
      const lifecycle = await refreshOpenHandsTask({taskId, actorId});
      const task = await findTask(`paris-repair:${input.repairId}:attempt:${input.attempt}`);
      return {lifecycle, task};
    },
    readCandidate: async (checkpoint: any) => {
      const refPath = '/git/ref/heads/' + encodeURIComponent(checkpoint.branch);
      const head = (await github(refPath)).object?.sha;
      if (!/^[a-f0-9]{40}$/.test(head ?? '') || head === checkpoint.baseSha) throw Error('PARIS_OPENHANDS_COMMITTED_DIFF_REQUIRED');
      const comparison = await github(`/compare/${checkpoint.baseSha}...${head}`);
      const changedFiles = assertOpenHandsRepairDiff(comparison, blockedPath);
      const readbacks = [];
      for (const file of comparison.files) {
        const path = file.filename.split('/').map(encodeURIComponent).join('/');
        const observed = await github(`/contents/${path}?ref=${head}`);
        readbacks.push(assertOpenHandsBlobReadback(file, observed));
      }
      if ((await github(refPath)).object?.sha !== head) throw Error('PARIS_OPENHANDS_CANDIDATE_CHANGED_DURING_READBACK');
      return {ok: true, provider: 'openhands', repository: REPOSITORY,
        branch: {name: checkpoint.branch, sha: head}, base_sha: checkpoint.baseSha,
        changed_files: changedFiles, committed_readbacks: readbacks, openhands_task_id: checkpoint.taskId,
        release: {branch: checkpoint.branch, sha: head, status: 'pending-validation', verifiedLive: false},
        summary: 'OpenHands branch read back; independent PARIS validation and protected publication are still required.'};
    },
  });
}
