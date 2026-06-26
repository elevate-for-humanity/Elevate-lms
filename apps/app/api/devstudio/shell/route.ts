/**
 * /api/devstudio/shell
 *
 * Dispatches GitHub Actions workflow runs. Works in production with no local source.
 * Admin-only.
 *
 * GET ?action=list
 *   → returns all workflow_dispatch-capable workflows from the repo
 * GET ?run_id=<id>
 *   → polls a workflow run for status + jobs
 *
 * POST { workflow: string, inputs?: Record<string, string> }
 *   → triggers workflow_dispatch on any workflow that supports it
 *   → falls back to Contents API bump if token lacks workflow scope
 *
 * No hardcoded workflow allowlist — any workflow with workflow_dispatch
 * trigger in the repo can be dispatched. Repo and branch are read from env.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { hydrateProcessEnv } from '@/lib/secrets';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function repo()   { return process.env.GITHUB_REPO   ?? 'elevate-for-humanity/Elevate-lms'; }
function branch() { return process.env.GITHUB_BRANCH ?? 'main'; }
const GH_API = 'https://api.github.com';

/**
 * Resolve a secret: env var first, then platform_secrets table fallback.
 * This loads credentials pre-configured in the platform, not from user input.
 */
async function resolveSecret(key: string): Promise<string | null> {
  const envVal = process.env[key];
  if (envVal && envVal.trim()) return envVal.trim();
  try {
    const db = await requireAdminClient();
    const { data } = await db
      .from('platform_secrets')
      .select('value_enc')
      .eq('key', key)
      .maybeSingle();
    const val = data?.value_enc;
    return val && val.trim() ? val.trim() : null;
  } catch {
    return null;
  }
}

async function ghHeaders(): Promise<HeadersInit> {
  const token = await resolveSecret('GITHUB_TOKEN');
  if (!token) throw new Error('GITHUB_TOKEN is not configured in platform_secrets');
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
}

// ── Workflow discovery ────────────────────────────────────────────────────────

interface GHWorkflow {
  id: number;
  name: string;
  path: string;   // e.g. ".github/workflows/deploy-lms.yml"
  state: string;  // "active" | "disabled_manually" | etc.
}

/**
 * Fetch all active workflows from the repo that have a workflow_dispatch trigger.
 * Uses the GitHub Actions API — no local file access needed.
 * Results are not cached server-side; the client caches via SWR/state.
 */
async function listDispatchableWorkflows(): Promise<GHWorkflow[]> {
  const all: GHWorkflow[] = [];
  let page = 1;
  while (true) {
    const res = await fetch(
      `${GH_API}/repos/${repo()}/actions/workflows?per_page=100&page=${page}`,
      { headers: await ghHeaders() },
    );
    if (!res.ok) throw new Error(`GitHub API ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = await res.json() as { workflows: GHWorkflow[]; total_count: number };
    all.push(...data.workflows);
    if (all.length >= data.total_count) break;
    page++;
  }
  // Return only active workflows — disabled ones can't be dispatched
  return all.filter(w => w.state === 'active');
}

/**
 * Fallback trigger: bump the retry-marker comment in a workflow file via the
 * Contents API. Used when workflow_dispatch returns 403/404 (e.g. the token
 * lacks workflow scope or the workflow has no workflow_dispatch trigger).
 *
 * Reads the current file, replaces the marker timestamp, and PUTs it back.
 * GitHub sees a push to main on a path that matches the workflow's path filter,
 * which fires the deploy job exactly as a normal push would.
 */
async function triggerViaContentsApi(workflowFile: string): Promise<{ runUrl: string }> {
  const token = await resolveSecret('GITHUB_TOKEN');
  if (!token) throw new Error('GITHUB_TOKEN is not configured in platform_secrets');

  const filePath = `.github/workflows/${workflowFile}`;
  const apiBase  = `${GH_API}/repos/${repo()}/contents/${filePath}`;
  const headers = await ghHeaders();

  const getRes = await fetch(`${apiBase}?ref=${branch()}`, { headers });
  if (!getRes.ok) throw new Error(`Could not read ${filePath}: ${getRes.status}`);
  const { sha, content: b64 } = await getRes.json() as { sha: string; content: string };

  const current  = Buffer.from(b64.replace(/\n/g, ''), 'base64').toString('utf8');
  const ts       = new Date().toISOString().slice(0, 16) + 'Z';
  const markerRe = /(#\s*Retry trigger marker:\s*)\S+/;
  const updated  = markerRe.test(current)
    ? current.replace(markerRe, `$1${ts}`)
    : current + `\n# Retry trigger marker: ${ts}\n`;

  const putRes = await fetch(apiBase, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: `chore: trigger ${workflowFile.replace('.yml', '')}`,
      content: Buffer.from(updated).toString('base64'),
      sha,
      branch: branch(),
    }),
  });

  if (!putRes.ok) {
    const err = await putRes.json().catch(() => ({})) as { message?: string };
    throw new Error(`Contents API PUT failed: ${err.message ?? putRes.status}`);
  }

  return { runUrl: `https://github.com/${repo()}/actions` };
}

// ── POST — dispatch a workflow ────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  await hydrateProcessEnv();
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  // Accept either a workflow filename (e.g. "deploy-lms.yml") or bare name ("deploy-lms")
  const workflowRaw: string = body?.workflow ?? '';
  const inputs: Record<string, string> = body?.inputs ?? {};

  if (!workflowRaw) return safeError('workflow is required', 400);

  const workflowAliases: Record<string, string> = {
    'deploy-all': 'deploy-production-dispatch.yml',
    'deploy-production': 'deploy-production-dispatch.yml',
    'deploy-production-dispatch': 'deploy-production-dispatch.yml',
  };

  // Normalise to filename
  const workflowFile = workflowAliases[workflowRaw] ?? (workflowRaw.endsWith('.yml') ? workflowRaw : `${workflowRaw}.yml`);

  // Validate the workflow exists and is active in the repo
  try {
    const workflows = await listDispatchableWorkflows();
    const match = workflows.find(w => w.path === `.github/workflows/${workflowFile}`);
    if (!match) {
      const available = workflows.map(w => w.path.replace('.github/workflows/', '')).join(', ');
      return safeError(
        `Workflow "${workflowFile}" not found or not active. Available: ${available}`,
        400,
      );
    }
  } catch (err) {
    // If we can't list workflows (e.g. no token), allow the dispatch attempt anyway
    // and let GitHub return the error.
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[shell] Could not validate workflow list:', err);
    }
  }

  try {
    const dispatchRes = await fetch(
      `${GH_API}/repos/${repo()}/actions/workflows/${workflowFile}/dispatches`,
      {
        method: 'POST',
        headers: await ghHeaders(),
        body: JSON.stringify({ ref: branch(), inputs }),
      },
    );

    if (dispatchRes.status === 204) {
      await new Promise((r) => setTimeout(r, 1500));
      const runsRes = await fetch(
        `${GH_API}/repos/${repo()}/actions/workflows/${workflowFile}/runs?per_page=1&branch=${branch()}`,
        { headers: await ghHeaders() },
      );
      const runsData = runsRes.ok ? await runsRes.json() : null;
      const latestRun = runsData?.workflow_runs?.[0];

      return NextResponse.json({
        ok: true,
        workflow: workflowFile,
        method: 'dispatch',
        runId: latestRun?.id ?? null,
        runUrl: latestRun?.html_url ?? `https://github.com/${repo()}/actions`,
        status: latestRun?.status ?? 'queued',
      });
    }

    // Fallback: bump retry marker via Contents API
    const fallback = await triggerViaContentsApi(workflowFile);
    return NextResponse.json({
      ok: true,
      workflow: workflowFile,
      method: 'contents-api',
      runId: null,
      runUrl: fallback.runUrl,
      status: 'queued',
    });
  } catch (err) {
    return safeInternalError(err, 'Failed to dispatch workflow');
  }
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  await hydrateProcessEnv();
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  const { searchParams } = request.nextUrl;
  const action = searchParams.get('action');
  const runId  = searchParams.get('run_id');

  // ── Recent workflow runs (deploy + CI) ───────────────────────────────────
  if (action === 'recent_runs') {
    const perPage = Math.min(20, Math.max(1, Number(searchParams.get('per_page') ?? '10')));
    try {
      const res = await fetch(
        `${GH_API}/repos/${repo()}/actions/runs?per_page=${perPage}&branch=${branch()}`,
        { headers: await ghHeaders() },
      );
      if (!res.ok) return safeError('GitHub API error', res.status);
      const data = await res.json() as {
        workflow_runs: Array<{
          id: number;
          name: string;
          status: string;
          conclusion: string | null;
          html_url: string;
          created_at: string;
          path?: string;
        }>;
      };
      return NextResponse.json({
        runs: (data.workflow_runs ?? []).map((r) => ({
          id: r.id,
          name: r.name,
          status: r.status,
          conclusion: r.conclusion,
          url: r.html_url,
          createdAt: r.created_at,
          workflow: r.path?.replace('.github/workflows/', '') ?? r.name,
        })),
      });
    } catch (err) {
      return safeInternalError(err, 'Failed to list recent runs');
    }
  }

  // ── List all dispatchable workflows ──────────────────────────────────────
  if (action === 'list') {
    try {
      const workflows = await listDispatchableWorkflows();
      return NextResponse.json({
        workflows: workflows.map(w => ({
          id:    w.id,
          name:  w.name,
          file:  w.path.replace('.github/workflows/', ''),
          path:  w.path,
          state: w.state,
        })),
        repo:   repo(),
        branch: branch(),
      });
    } catch (err) {
      return safeInternalError(err, 'Failed to list workflows');
    }
  }

  // ── Poll a specific run ───────────────────────────────────────────────────
  if (!runId) return safeError('run_id or action=list is required', 400);

  try {
    const [runRes, jobsRes] = await Promise.all([
      fetch(`${GH_API}/repos/${repo()}/actions/runs/${runId}`, { headers: await ghHeaders() }),
      fetch(`${GH_API}/repos/${repo()}/actions/runs/${runId}/jobs`, { headers: await ghHeaders() }),
    ]);

    if (!runRes.ok) {
      if (runRes.status === 404) return safeError('Run not found', 404);
      return safeError('GitHub API error', runRes.status);
    }

    const run  = await runRes.json();
    const jobs = jobsRes.ok ? (await jobsRes.json()).jobs ?? [] : [];

    return NextResponse.json({
      id:         run.id,
      name:       run.name,
      status:     run.status,
      conclusion: run.conclusion,
      url:        run.html_url,
      createdAt:  run.created_at,
      updatedAt:  run.updated_at,
      jobs: jobs.map((j: { id: number; name: string; status: string; conclusion: string | null; html_url: string }) => ({
        id:         j.id,
        name:       j.name,
        status:     j.status,
        conclusion: j.conclusion,
        url:        j.html_url,
      })),
    });
  } catch (err) {
    return safeInternalError(err, 'Failed to fetch run status');
  }
}
