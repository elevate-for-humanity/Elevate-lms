import 'server-only';
import { getGitHubHeaders } from '@/lib/devstudio/github-token';
import { studioRepository } from '@/lib/devstudio/repository';

export const applicationCheckWorkflow = 'compliance-gate.yml';
type Run = { id: number; head_sha: string; html_url: string };
type Job = { name: string; status: string; conclusion: string | null; html_url: string };

export async function readApplicationCheck() {
  const headers = await getGitHubHeaders();
  const base = `https://api.github.com/repos/${studioRepository()}/actions`;
  async function read(path: string) {
    const response = await fetch(base + path, {
      headers, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error('GitHub application checks are unavailable.');
    return response.json();
  }
  const runs = await read(`/workflows/${applicationCheckWorkflow}/runs?branch=main&event=push&per_page=1`);
  const run: Run | undefined = runs.workflow_runs?.[0];
  if (!run) return null;
  const result = await read(`/runs/${run.id}/jobs?filter=latest&per_page=100`);
  const job: Job | undefined = result.jobs?.find((candidate: Job) => candidate.name === 'E2E Enrollment Flow');
  return { sha: run.head_sha, url: job?.html_url ?? run.html_url, status: job?.conclusion ?? job?.status ?? 'awaiting job' };
}
