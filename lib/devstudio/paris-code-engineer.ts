import {courseDiagnosticQuery} from './paris-course-repair-evidence.mjs';
import {rankSourcePaths,rememberSourcePaths,focusedSourceExcerpt} from './paris-source-discovery.mjs';
import {missingRepairDeliverables,isApplicationSourceCorrection} from './paris-repair-deliverables.mjs';
import {rememberVerifiedRepairSource,discardChangedRepairSource,repairPlannerObservations} from './paris-source-evidence.mjs';
import {failedWorkflowLogExcerpt,failedWorkflowJobGuidance} from './paris-workflow-evidence.mjs';
import {checkInspectionBudget,recoverRepeatedInspection,recoverRepeatedDirectoryInspection} from './paris-inspection-budget.mjs';
import {hasApplicationSourceCorrection,nextRepairActionConstraint,assertCommittedWriteReadback} from './paris-action-loop.mjs';
import {bindRepairWorkflowInspection,bindVerifiedFailedWorkflowInspection} from './paris-workflow-target.mjs';
import {resolveOwnedModelConnection} from '@/lib/ai/providers/owned-model-config.mjs';
import {budgetRepairMessages,repairCompletionTokens,REPAIR_INFERENCE_TIMEOUT_MS,REPAIR_MODEL_PROBE_TIMEOUT_MS} from './repair-inference-budget.mjs';
import {budgetRepairTurn} from './repair-inference-time-budget.mjs';
import {retryRepairInference} from './repair-inference-retry.mjs';
import { probeOwnedModel } from '@/lib/ai/providers/owned-model-health.mjs';
import { NextResponse } from 'next/server';
import { aiChat } from '@/lib/ai/ai-service';
import {requireAdminClient} from '@/lib/supabase/admin';
import {executePaidInference,reservePaidInference,paidArtifactFingerprint} from '@/lib/ai/paid-inference-gateway';
import { hydrateProcessEnv } from '@/lib/secrets';
import { getGitHubHeaders, getGitHubToken, githubApiErrorMessage, verifyGitHubBranchAuthority } from '@/lib/devstudio/github-token';
import { classifySearchFailure, type SearchFallback } from './github-search-fallback';
import { getGitHubAppToken } from '@/lib/devstudio/github-app-token';
import { logger } from '@/lib/logger';
import { PARIS_SYSTEM_IDENTITY } from '@/lib/ai/paris-identity';
import { PARIS_REPAIR_ACTION_POLICY } from './paris-repair-action-policy.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const REPOSITORY = 'elevate-for-humanity/Elevate-lms';
const BASE_BRANCH = 'main';
const GH_API = 'https://api.github.com';
// Operator-tunable limits; mirrored by lib/devstudio/paris-repair-scope.mjs.
const repairSetting = (name: string, fallback: number) => {
  const value = Number(process.env[name]);
  return Number.isSafeInteger(value) && value > 0 ? value : fallback;
};
const MAX_TURNS = repairSetting('PARIS_REPAIR_MAX_TURNS', 40);
const MAX_WRITES = repairSetting('PARIS_REPAIR_MAX_FILES', 100);
const MAX_READ_CHARS = 16_000;
// A transient gateway fault must not discard a repair that already inspected
// and understood the source. Retry the same turn a few times, and only treat it
// as a retryable infrastructure failure (never a "no verifiable change") when
// the provider stays down.
// Keep a reserve for GitHub validation and durable failure reporting within the
// 40-minute Actions prepare job. The deadline survives planner continuations.
const REPAIR_PLANNING_BUDGET_MS = repairSetting('PARIS_REPAIR_BUDGET_MINUTES', 90) * 60_000;
const REPAIR_TURN_RESERVE_MS = REPAIR_INFERENCE_TIMEOUT_MS + REPAIR_MODEL_PROBE_TIMEOUT_MS + 30_000;

type AgentAction =
  | { type: 'search'; query: string }
  | { type: 'workflow_log'; runId: number; jobId: number }
  | { type: 'list'; path: string }
  | { type: 'read'; path: string }
  | { type: 'replace'; path: string; old: string; replacement: string; message?: string }
  | { type: 'create'; path: string; content: string; message?: string }
  | { type: 'complete'; summary: string };

function jsonObject(content: string): Record<string, unknown> {
  const cleaned = content
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  const parsed = JSON.parse(cleaned);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Internal engineering planner returned a non-object response.');
  }
  return parsed as Record<string, unknown>;
}

function normalizePath(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/{2,}/g, '/').trim();
}

/** Broad application repairs remain allowed. Authorization, validation and
 * release controls require a separately reviewed change, never self-approval. */
/**
 * Typed blocked-path reasons (PR1, #2070). Previously blockedPath() returned
 * a bare boolean, so a denied secret, a protected control path and a
 * malformed traversal all collapsed into one receipt. The block is unchanged.
 * NOTE: this definition is intentionally self-contained in this file —
 * tests/worker/paris-openhands-handoff.test.mjs evaluates this file with
 * import lines stripped, so it cannot import the pure copy. Keep in sync
 * with ./paris-blocked-path.ts (unit-tested there; equivalence is verified
 * by the validation harness in the PR notes).
 */
export type BlockedPathReason =
  | 'ALLOWED'
  | 'DENIED_INVALID'
  | 'DENIED_SECRET'
  | 'DENIED_PROTECTED';

export function blockedPathReason(path: string): BlockedPathReason {
  if (
    !path ||
    path.includes('..') ||
    path.startsWith('/') ||
    path === '.git' ||
    path.startsWith('.git/') ||
    /(?:^|\/)(?:node_modules|\.next)(?:\/|$)/.test(path)
  ) {
    return 'DENIED_INVALID';
  }
  if (/(?:^|\/)(?:\.env(?:\.[^/]*)?|[^/]*\.(?:pem|key|p12|pfx)|id_(?:rsa|ed25519)[^/]*)$/i.test(path)) return 'DENIED_SECRET';
  if (
    /^(?:apps\/admin\/app\/api\/(?:cron\/paris-code-repair|dev-studio|internal)(?:\/|$)|lib\/ai\/paid-inference[^/]*|\.github(?:\/|$)|scripts(?:\/|$)|lib\/(?:devstudio|ai\/runtime|auth|rbac|supabase|secrets)(?:\/|\.|$)|lib\/paris-workflow-identity\.ts$|AGENTS\.md$|Dockerfile(?:\.|$)|(?:package(?:-lock)?\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml)$)/.test(path) ||
    /(?:^|\/)(?:tsconfig[^/]*\.json|vitest\.config\.[^/]+|eslint\.config\.[^/]+|\.npmrc|AGENTS\.md)$/.test(path) ||
    /^(?:tests\/unit\/(?:course-builder-live-preview|course-builder-assessment-preview|paris-course-integration)\.test\.tsx?|tests\/worker\/approved-picture-timeline\.test\.mjs)$/.test(path)
  ) {
    return 'DENIED_PROTECTED';
  }
  return 'ALLOWED';
}

/** Broad application repairs remain allowed. Authorization, validation and
 * release controls require a separately reviewed change, never self-approval. */
export function blockedPath(path: string): boolean {
  return blockedPathReason(path) !== 'ALLOWED';
}

async function githubHeaders(): Promise<HeadersInit> {
  return getGitHubHeaders();
}

async function githubJson(path: string, init: RequestInit = {}) {
  const response = await fetch(`${GH_API}/repos/${REPOSITORY}${path}`, {
    ...init,
    headers: {
      ...(await githubHeaders()),
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
    signal: init.signal ?? AbortSignal.timeout(30_000),
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) {
    // A 403 on branch creation is a distinct receipt, not a generic failure.
    if (response.status === 403 && path.startsWith('/git/refs') && init.method === 'POST') {
      throw new Error(
        `${githubApiErrorMessage(response.status, path)}; provider message: ${String(payload?.message ?? '').slice(0, 140)}`,
      );
    }
    throw new Error(
      `GitHub API ${response.status} for ${path}: ${githubApiErrorMessage(response.status, path)}; provider message: ${String(payload?.message ?? '').slice(0, 140)}`,
    );
  }
  return payload;
}

async function createTaskBranch(taskId: string) {
  // Pre-flight branch authority (PR1, #2070): fail with GITHUB_APP_403_BRANCH
  // before attempting POST /git/refs, instead of after a failed create.
  const branchToken = await getGitHubToken();
  if (!branchToken) throw new Error('GitHub authentication is not configured. Bind GitHub App credentials in the server runtime or add GITHUB_TOKEN in Dev Studio > Secrets.');
  await verifyGitHubBranchAuthority(branchToken);
  const base = await githubJson(`/git/ref/heads/${encodeURIComponent(BASE_BRANCH)}`);
  const baseSha = String(base?.object?.sha ?? '');
  if (!baseSha) throw new Error('Could not resolve the canonical main branch SHA.');
  const branch = `studio/${taskId.slice(0, 8)}-${Date.now().toString(36)}`;
  await githubJson('/git/refs', {
    method: 'POST',
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseSha }),
  });
  return { branch, baseSha };
}

async function readFile(path: string, branch: string, task = '') {
  const normalized = normalizePath(path);
  if (blockedPath(normalized)) throw new Error(`Repository path is not allowed. [${blockedPathReason(normalized)}]`);
  const data = await githubJson(
    `/contents/${normalized.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(branch)}`,
  );
  if (Array.isArray(data) || data.type !== 'file') throw new Error(`${normalized} is not a file.`);
  const content = Buffer.from(String(data.content ?? ''), 'base64').toString('utf8');
  return {
    path: normalized,
    sha: String(data.sha ?? ''),
    content,
    excerpt: focusedSourceExcerpt(content, task, MAX_READ_CHARS),
  };
}

async function listDirectory(path: string, branch: string) {
  const normalized = normalizePath(path);
  if (normalized && blockedPath(`${normalized}/`)) throw new Error(`Repository path is not allowed. [${blockedPathReason(`${normalized}/`)}]`);
  const data = await githubJson(
    `/contents${normalized ? '/' + normalized.split('/').map(encodeURIComponent).join('/') : ''}?ref=${encodeURIComponent(branch)}`,
  );
  if (!Array.isArray(data)) throw new Error(`${normalized} is not a directory.`);
  return data.filter((entry: any) =>
    ['file', 'dir'].includes(entry.type) && typeof entry.path === 'string' &&
    !blockedPath(entry.type === 'dir' ? `${normalizePath(entry.path)}/` : normalizePath(entry.path)),
  ).slice(0, 80).map((entry: any) => ({ path: entry.path, type: entry.type }));
}

function rejectedSourceRead(error: unknown): boolean {
  const message = error instanceof Error ? error.message : '';
  return /^Repository path is not allowed\./.test(message) ||
    /^GitHub API 404 for \/contents/.test(message) ||
    / is not a (?:file|directory)\.$/.test(message);
}

async function rejectedReadFeedback(path: string, branch: string): Promise<string> {
  const message = `READ_REJECTED ${path} [${blockedPathReason(normalizePath(path))}]: use list to discover an allowed application path. No source was read or changed.`;
  // Protected paths remain opaque. Only discover ancestors of allowed paths.
  if (blockedPath(path)) return message;
  const parts = path.replace(/\/+$/, '').split('/').filter(Boolean);
  // A guessed path can contain a task-branch name several directories deep.
  // Preserve the three-read discovery bound, but always reach a real boundary:
  // nearest parent, top-level application directory, then repository root.
  // Every listing retains protected-path and credential filtering.
  const directories = [...new Set([parts.slice(0, -1).join('/'), parts[0] || '', ''])];
  for (const directory of directories) {
    try {
      const entries = await listDirectory(directory, branch);
      return `${message}\nLIST ${directory || '/'}: ${JSON.stringify(entries)}`;
    } catch (error) {
      // Authorization, timeouts and provider failures must still fail closed.
      if (!rejectedSourceRead(error)) throw error;
      if (!directory) return message;
    }
  }
  return message;
}

async function writeFile(input: {
  path: string;
  content: string;
  branch: string;
  sha?: string;
  message: string;
}) {
  const normalized = normalizePath(input.path);
  if (blockedPath(normalized)) throw new Error(`Repository path is not allowed. [${blockedPathReason(normalized)}]`);
  // Workflow file updates require the configured App's workflow permission.
  // Use that explicit identity for this operation, before sending any write.
  let workflowHeaders: HeadersInit | undefined;
  if (normalized.startsWith('.github/workflows/')) {
    const token = await getGitHubAppToken({requireWorkflowWrite:true});
    if (!token) throw Error('PARIS_WORKFLOW_APP_AUTHORITY_REQUIRED');
    workflowHeaders = { Authorization: `Bearer ${token}` };
  }
  const result = await githubJson(
    `/contents/${normalized.split('/').map(encodeURIComponent).join('/')}`,
    {
      method: 'PUT',
      ...(workflowHeaders ? { headers: workflowHeaders } : {}),
      body: JSON.stringify({
        message: input.message,
        content: Buffer.from(input.content, 'utf8').toString('base64'),
        branch: input.branch,
        ...(input.sha ? { sha: input.sha } : {}),
      }),
    },
  );
  const contentSha=String(result?.content?.sha ?? '');
  const commitSha=String(result?.commit?.sha ?? '');
  if(!/^[a-f0-9]{40}$/.test(contentSha)||!/^[a-f0-9]{40}$/.test(commitSha))
    throw Error('PARIS_SOURCE_WRITE_RECEIPT_REQUIRED');
  // Read the actual committed Git object and current task-branch ref before
  // telling the planner a write succeeded. A successful PUT alone is not a
  // validated source change; an ambiguous result stays a failed operation.
  const committed=await githubJson(
    `/contents/${normalized.split('/').map(encodeURIComponent).join('/')}?ref=${commitSha}`);
  const ref=await githubJson(`/git/ref/heads/${encodeURIComponent(input.branch)}`);
  const observedContent=Buffer.from(String(committed?.content??''),'base64').toString('utf8');
  assertCommittedWriteReadback({
    expectedContent:input.content,observedContent,
    commitSha,branchSha:String(ref?.object?.sha??''),
    expectedBlobSha:contentSha,observedBlobSha:String(committed?.sha??''),
  });
  return {path:normalized,contentSha,commitSha};
}

export type SearchCodeResult = {
  matches: Array<{ path: string; name: string; matches: string[] }>;
  /** Distinguishes "no matches" from "search unavailable, tree fallback used". */
  searchFallback: SearchFallback;
};

export async function searchCode(query: string): Promise<SearchCodeResult> {
  const q = query.trim().slice(0, 500);
  if (!q) return { matches: [], searchFallback: 'none' };
  const response = await fetch(
    `https://api.github.com/search/code?q=${encodeURIComponent(`${q} repo:${REPOSITORY}`)}&per_page=10`,
    {
      headers: {
        ...(await githubHeaders()),
        Accept: 'application/vnd.github.text-match+json',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(30_000),
    },
  );
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    // Search has an independent GitHub rate limit. Let the repair planner
    // continue with known-file reads instead of consuming another inference
    // turn retrying an unavailable search endpoint.
    // Code search is optional discovery. Private repository installations may
    // authorize Contents while denying Search (403). In that case use the
    // already supported list/read path instead of failing the repair.
    if (response.status === 401) {
      // Search can reject job/App identities independently of Contents. A 401
      // is optional discovery only when this exact credential still reads main.
      const repository = await fetch(`${GH_API}/repos/${REPOSITORY}/git/ref/heads/main`, {
        headers: await githubHeaders(), redirect: 'error', cache: 'no-store',
        signal: AbortSignal.timeout(8000),
      });
      if (repository.ok) return { matches: [], searchFallback: classifySearchFailure(401, true) };
      throw new Error(`GitHub repository authorization failed: ${repository.status}`);
    }
    if (response.status === 403 || response.status === 429) {
      // Record the fallback instead of silently returning no matches (#2070):
      // the repair receipt can now tell search-unavailable from no-results.
      return { matches: [], searchFallback: classifySearchFailure(response.status) };
    }
    throw new Error(`GitHub code search failed: ${response.status}`);
  }
  const matches = (Array.isArray(payload.items) ? payload.items : [])
    .filter((item: any) => typeof item.path === 'string' && !blockedPath(normalizePath(item.path)))
    .map((item: any) => ({
    path: item.path,
    name: item.name,
    matches: Array.isArray(item.text_matches)
      ? item.text_matches.slice(0, 3).map((match: any) => match.fragment)
      : [],
  }));
  return { matches, searchFallback: 'none' };
}

function suggestedSourcePaths(query: string, tree: Array<{ type: string; path: string }> = [], task = '') {
  return rankSourcePaths(query, tree.filter(entry => !blockedPath(entry.path)), task);
}

function parseAction(value: Record<string, unknown>): AgentAction {
  if (value.type === 'workflow_log') {
    const runId=Number(value.runId),jobId=Number(value.jobId);
    if(!Number.isSafeInteger(runId)||runId<1||!Number.isSafeInteger(jobId)||jobId<1)
      throw Error('PARIS_WORKFLOW_LOG_ID_INVALID');
    return {type:'workflow_log',runId,jobId};
  }

  const type = String(value.type ?? '');
  if (type === 'search') {
    const query = String(value.query ?? '').trim();
    if (!query) throw new Error('Engineering action search is missing query.');
    return { type, query };
  }
  if (type === 'read') {
    const path = normalizePath(value.path);
    if (!path) throw new Error('Engineering action read is missing path.');
    return { type, path };
  }
  if (type === 'list') {
    return { type, path: normalizePath(value.path) };
  }
  if (type === 'replace') {
    const path = normalizePath(value.path);
    const old = String(value.old ?? '');
    const replacement = String(value.replacement ?? '');
    if (!path || !old) throw new Error('Engineering replace requires path and exact old text.');
    return {
      type,
      path,
      old,
      replacement,
      message: typeof value.message === 'string' ? value.message : undefined,
    };
  }
  if (type === 'create') {
    const path = normalizePath(value.path);
    const content = String(value.content ?? '');
    if (!path) throw new Error('Engineering create requires path.');
    return {
      type,
      path,
      content,
      message: typeof value.message === 'string' ? value.message : undefined,
    };
  }
  if (type === 'complete') {
    return { type, summary: String(value.summary ?? 'Internal engineering task completed.').trim() };
  }
  throw new Error(`Unsupported engineering action: ${type || 'missing'}`);
}

export type ParisRepairCheckpoint = {
  version: 1; boundedCpuEdits?: boolean; verifiedSourceRead?: boolean; startedAt?: string; branch: string; baseSha: string; headSha: string; nextTurn: number;
  observations: string[]; changedFiles: string[]; newRegressionTests: string[];
  inspectionHistory?: string[]; discoveredFiles?: string[]; sourceEvidence?: Record<string, unknown>;
  verifiedSourceExcerpts?: Array<{path:string;sha:string;excerpt:string}>;
  commits: string[]; writes: number; summary: string; complete: boolean;
};
type RepairContinuation = {
  checkpoint?: ParisRepairCheckpoint;
  sourceEvidence?: Record<string, unknown>;
  save: (checkpoint: ParisRepairCheckpoint) => Promise<void>;
};

export async function stageParisCodeRepair(task: string, repairId?: string, actorId?: string, continuation?: RepairContinuation) {
  await hydrateProcessEnv().catch(() => undefined);

  if(!actorId)return NextResponse.json({error:'PARIS repair actor is required.'},{status:403});
  const db=await requireAdminClient();
  // Direct callers and resumed turns must satisfy the same current-owner
  // policy as the OpenHands adapter before model calls or repository writes.
  const owner=await db.from('profiles').select('role').eq('id',actorId).maybeSingle();
  if(owner.error||!['admin','super_admin'].includes(owner.data?.role??''))
    return NextResponse.json({error:'PARIS_AUTOPILOT_OWNER_AUTHORITY_REQUIRED'},{status:403});
  const provider=(process.env.AI_PROVIDER??'elevate').trim().toLowerCase();
  // The cold-start readiness probe is only needed before the first turn. On a
  // planner continuation the owned model just served the previous turn, so
  // probing again spends 55s of the Admin route's 300s request budget and can
  // push an edit-sized turn (up to 210s inference + GitHub write/readback) past
  // the platform deadline, which surfaces as an unattributed HTTP 502. A model
  // that goes down between turns is reported by the inference path itself.
  if(provider==='elevate' && !continuation?.checkpoint){
    const owned = await probeOwnedModel({timeoutMs:REPAIR_MODEL_PROBE_TIMEOUT_MS});
    if (!owned.verified) {
      const transient = owned.status === 'request_failed' || [408, 429, 500, 502, 503, 504].includes(owned.httpStatus ?? 0);
      return NextResponse.json({error: (transient ? 'OWNED_MODEL_TEMPORARILY_UNAVAILABLE:' : 'OWNED_MODEL_NOT_READY:') + owned.status}, {status:503});
    }
  }
  const taskId = repairId ?? crypto.randomUUID();
  const saved = continuation?.checkpoint;
  const startedAt = saved?.startedAt ?? new Date().toISOString();
  const startedMs = Date.parse(startedAt);
  if (!Number.isFinite(startedMs) || startedMs > Date.now() + 60_000) {
    throw Error('PARIS_REPAIR_CHECKPOINT_TIME_INVALID');
  }
  if (Date.now() - startedMs > REPAIR_PLANNING_BUDGET_MS - REPAIR_TURN_RESERVE_MS) {
    return NextResponse.json({error:'PARIS_REPAIR_PLANNING_DEADLINE_REACHED'}, {status:422});
  }
  if (saved && (saved.version !== 1 || !/^studio\/[a-z0-9-]+$/.test(saved.branch) ||
    !/^[a-f0-9]{40}$/.test(saved.baseSha) || !/^[a-f0-9]{40}$/.test(saved.headSha) ||
    !Number.isInteger(saved.nextTurn) || saved.nextTurn < 0 || saved.nextTurn > MAX_TURNS)) {
    throw Error('PARIS_REPAIR_CHECKPOINT_INVALID');
  }
  const { branch, baseSha } = saved ?? await createTaskBranch(taskId);
  let headSha = saved?.headSha ?? baseSha;
  if (saved) {
    const current = await githubJson(`/git/ref/heads/${encodeURIComponent(branch)}`);
    if (current.object?.sha !== headSha) throw Error('PARIS_REPAIR_CHECKPOINT_BRANCH_CHANGED');
  }
  const observations: string[] = saved?.observations ?? [
    `Repository: ${REPOSITORY}`, `Base: ${BASE_BRANCH}@${baseSha}`, `Working branch: ${branch}`,
  ];
  const sourceEvidence = continuation?.sourceEvidence ?? saved?.sourceEvidence;
  const evidenceChanged = JSON.stringify(sourceEvidence) !== JSON.stringify(saved?.sourceEvidence);
  const changedFiles = new Set<string>(saved?.changedFiles ?? []);
  const newRegressionTests = new Set<string>(saved?.newRegressionTests ?? []);
  const inspectionHistory = Array.isArray(saved?.inspectionHistory) ? saved.inspectionHistory.slice(-30) : [];
  // Only successful GitHub readFile() calls may raise the CPU edit allowance.
  // A read: inspection key is an attempt, not evidence that source was read.
  let verifiedSourceRead = saved?.verifiedSourceRead === true ||
    (saved?.observations ?? []).some(value => typeof value === 'string' && value.startsWith('READ '));
  let discoveredFiles: string[] = rememberSourcePaths(saved?.discoveredFiles ?? []);
  let verifiedSourceExcerpts = Array.isArray(saved?.verifiedSourceExcerpts) ? saved.verifiedSourceExcerpts : [];
  if ((!saved || evidenceChanged) &&
      (/REPAIR_PRODUCER_UNCHANGED/.test(task) || Boolean(sourceEvidence?.blockedStep) ||
       /(?:failed production release|failed check|workflow)/i.test(task))) {
    const tree = await githubJson(`/git/trees/${headSha}?recursive=1`);
    discoveredFiles = rememberSourcePaths(discoveredFiles, suggestedSourcePaths(courseDiagnosticQuery(task,sourceEvidence), tree.tree, task));
  }
  const commits: string[] = saved?.commits ?? [];
  let writes = saved?.writes ?? 0;
  let summary = saved?.summary ?? '';
  let complete = saved?.complete ?? false;
  let nextTurn = saved?.nextTurn ?? 0;
  let usedProvider=provider;
  const checkpoint = async () => {
    if (!continuation) return;
    const ref = await githubJson(`/git/ref/heads/${encodeURIComponent(branch)}`);
    headSha = String(ref.object?.sha ?? '');
    if (!/^[a-f0-9]{40}$/.test(headSha)) throw Error('PARIS_REPAIR_CHECKPOINT_SHA_REQUIRED');
    await continuation.save({version:1,boundedCpuEdits:true,startedAt,branch,baseSha,headSha,nextTurn,
      observations:observations.slice(-8),discoveredFiles,sourceEvidence,changedFiles:[...changedFiles],inspectionHistory:inspectionHistory.slice(-30),
      newRegressionTests:[...newRegressionTests],commits,writes,summary,complete,verifiedSourceRead,verifiedSourceExcerpts});
  };

  try {
    // Save the task branch before inference; never place job credentials in it.
    if (continuation && !saved) await checkpoint();
    const stopTurn = continuation ? Math.min(MAX_TURNS, nextTurn + 1) : MAX_TURNS;
    for (let turn = nextTurn; !complete && turn < stopTurn; turn += 1) {
      // Never start an inference turn that could outlive this workflow's budget.
      if (Date.now() - startedMs > REPAIR_PLANNING_BUDGET_MS - REPAIR_TURN_RESERVE_MS) {
        await checkpoint();
        return NextResponse.json({error:'PARIS_REPAIR_PLANNING_DEADLINE_REACHED',
          branch:{name:branch},changed_files:[...changedFiles],observations:observations.slice(-6)}, {status:422});
      }
      try {
      const ownedTier = provider === 'elevate' ? resolveOwnedModelConnection().tier : undefined;
      const inferenceOptions = {
        correlationId: taskId,
        messages: [
          {
            role: 'system',
            content:
              PARIS_SYSTEM_IDENTITY + '\n' + PARIS_REPAIR_ACTION_POLICY,
          },
          {
            role: 'user',
            content: JSON.stringify({
              task,
              sourceEvidence,
              turn: turn + 1,
              writes,
              maximumWrites: MAX_WRITES,
              observations: repairPlannerObservations(observations,verifiedSourceExcerpts),
              discoveredFiles,
              changedFiles: [...changedFiles],
              inspectionAlreadyPerformed: [...new Set(inspectionHistory)].slice(-20),
              nextActionConstraint: nextRepairActionConstraint(inspectionHistory,writes,[...changedFiles]) +
                ' Do not repeat an inspectionAlreadyPerformed action. Every write must pass GitHub commit readback. No authorized modification means a blocked repair, never success.',
            }),
          },
        ],
        temperature: 0.1,
        maxTokens: repairCompletionTokens(ownedTier, observations, verifiedSourceRead),
        jsonMode: true,
      } as Parameters<typeof aiChat>[0];
      if (provider === 'elevate') {
        inferenceOptions.messages = budgetRepairMessages(inferenceOptions.messages,
          Number(process.env.ELEVATE_LLM_CONTEXT_TOKENS ?? 8192), inferenceOptions.maxTokens, ownedTier);
        // PR2 (#2515): estimate this turn against the 210s CPU budget
        // BEFORE dispatching. A turn that cannot fit is deferred with its
        // checkpoint intact instead of burning the single CPU slot for a
        // 211s timeout that writes nothing. Never shrink below the minimum
        // useful allowance to force a fit — defer instead.
        const turnBudget = budgetRepairTurn({messages: inferenceOptions.messages,
          maxTokens: inferenceOptions.maxTokens, deadlineMs: REPAIR_INFERENCE_TIMEOUT_MS, tier: ownedTier});
        if (!turnBudget.fits) {
          observations.push(`INFERENCE_DEFERRED: turn ${turn + 1} estimated ${turnBudget.estimatedMs}ms for ${turnBudget.promptTokens} prompt tokens; exceeds the 210s CPU budget. No inference call was made.`);
          await checkpoint();
          logger.warn('[PARIS] repair inference deferred', {repairId: taskId, turn: turn + 1,
            reason: turnBudget.reason, estimatedMs: turnBudget.estimatedMs, promptTokens: turnBudget.promptTokens});
          return NextResponse.json({error: turnBudget.reason, branch:{name:branch},
            changed_files:[...changedFiles], observations:observations.slice(-6),
            estimated_ms: turnBudget.estimatedMs}, {status:503});
        }
        inferenceOptions.maxTokens = turnBudget.maxCompletionTokens;
      }
      const infer=(signal: AbortSignal)=>aiChat({...inferenceOptions,signal});
      // A single transient gateway fault (e.g. HTTP 502) must not discard a
      // repair that has already inspected the source. Retry the same turn a few
      // times; if the provider stays down, surface a retryable infrastructure
      // error instead of a misleading "no verifiable repository change".
      let result: Awaited<ReturnType<typeof aiChat>>;
      try {
        result = await retryRepairInference(async (signal: AbortSignal) => {
          const dispatch=()=>infer(signal);
          const paid=provider==='elevate'?null:await executePaidInference({db,authorize:()=>reservePaidInference(db,{scopeKey:'studio-chat',actorId,runId:taskId,artifactFingerprint:paidArtifactFingerprint({taskId,turn,task}),idempotencyKey:`paris-repair:${taskId}:${turn}`,provider,model:'canonical',operation:'paris-code-repair',projectedCostMicros:Math.max(0,Number(process.env.STUDIO_CHAT_PROJECTED_COST_MICROS??'100000'))}),dispatch});
          if(paid&&paid.decision!=='approved')throw Error('PARIS_INFERENCE_'+paid.decision.toUpperCase());
          if(paid&&!paid.value)throw Error('PARIS_INFERENCE_RESULT_REQUIRED');
          return paid?paid.value!:await dispatch();
        }, {
          timeoutMs: REPAIR_INFERENCE_TIMEOUT_MS,
          onRetry: (attempt: number, delay: number) => {
            observations.push(`INFERENCE_TRANSIENT: retrying turn ${turn + 1} after ${delay}ms (attempt ${attempt}).`);
          },
        });
      } catch (error) {
        if (!(error instanceof Error) || error.message !== 'PARIS_INFERENCE_TEMPORARILY_UNAVAILABLE') throw error;
        await checkpoint();
        logger.warn('[PARIS] repair inference deferred', {
          repairId: taskId,
          turn: turn + 1,
          reason: 'reason' in error ? error.reason : 'unknown',
        });
        return NextResponse.json({error:'PARIS_INFERENCE_TEMPORARILY_UNAVAILABLE',
          branch:{name:branch},changed_files:[...changedFiles],observations:observations.slice(-6)}, {status:503});
      }
      usedProvider=result.provider;

      let action: AgentAction;
      try { action = parseAction(jsonObject(result.content)); }
      catch { observations.push('ACTION_REJECTED: return one valid JSON action from the allowed schema; no write occurred.'); continue; }
      // Do not conceal upstream authorization failures as malformed planner JSON.
      // Verified run/job lookup is operational evidence, not a model action.
      action = await bindVerifiedFailedWorkflowInspection(task, action, inspectionHistory,
        async runId => githubJson('/actions/runs/'+runId),
        async runId => githubJson('/actions/runs/'+runId+'/jobs?per_page=100')) as AgentAction;
      // Repeated empty searches can exhaust the durable planner budget without
      // inspecting any of the exact filenames already discovered on this branch.
      // Redirect once to a verified filename; normal read authorization and
      // duplicate-inspection limits remain enforced below.
      let recovered = recoverRepeatedInspection(inspectionHistory, action, observations, discoveredFiles, task);
      if (!recovered && ['redirect','stop'].includes(checkInspectionBudget(inspectionHistory, action).decision)) {
        // A stale discovered-files list can contain nothing relevant to the
        // diagnosed source. Recover only from the authenticated task-branch
        // tree, never from guessed paths or test/log instructions. The normal
        // readFile allowlist and repetition budget still apply to the result.
        const tree = await githubJson(`/git/trees/${headSha}?recursive=1`);
        // A truncated GitHub tree is incomplete discovery evidence, not a fatal
        // repository failure. Retain authenticated paths already discovered and
        // continue through the normal allowlisted read/list workflow.
        if (!Array.isArray(tree.tree)) throw Error('PARIS_REPAIR_SOURCE_TREE_INVALID');
        if (tree.truncated === true) observations.push('SOURCE_TREE_TRUNCATED: using partial authenticated paths; continue with targeted list/read.');
        // Filter spent reads before the ranker's cap so they cannot displace
        // fresh candidates from the authenticated tree.
        const unreadTree = tree.tree.filter((entry: { path: string }) =>
          checkInspectionBudget(inspectionHistory, {type:'read',path:entry.path}).decision === 'inspect');
        const paths = suggestedSourcePaths(task, unreadTree, task + JSON.stringify(sourceEvidence ?? {}));
        discoveredFiles = rememberSourcePaths(discoveredFiles, paths);
        recovered = recoverRepeatedInspection(inspectionHistory, action, observations, discoveredFiles, task);
        // A truncated inventory can contain no unread relevant files. Recover
        // once through an authenticated, allowlisted directory, not by resetting
        // the repeat limit or inventing a source filename.
        if (!recovered && tree.truncated === true) {
          recovered = recoverRepeatedDirectoryInspection(inspectionHistory, action, tree.tree, task,
            (path: string) => !blockedPath(path + '/'));
          if (recovered) observations.push('SOURCE_TREE_TARGETED_DIRECTORY: ' + recovered.path);
        }
      }
      if (recovered) {
        observations.push('INSPECTION REDIRECTED to authenticated goal-relevant source: '+recovered.path);
        action = recovered as AgentAction;
      }
      const inspection = checkInspectionBudget(inspectionHistory, action);
      if (inspection.key) {
        inspectionHistory.push(inspection.key);
        if (inspection.decision === 'stop') {
          // Stop wasting inference on the same source listing; preserve the branch,
          // checkpoints and the current job, and return a precise blocked reason.
          return NextResponse.json({error:'PARIS_PLANNER_REPEATED_INSPECTION',branch:{name:branch},changed_files:[...changedFiles],observations:observations.slice(-6)}, {status:422});
        }
        if (inspection.decision === 'redirect') {
          observations.push('INSPECTION ALREADY COMPLETED: '+inspection.key+'. Select a different exact source file or make a justified patch. Do not repeat broad listings.');
          continue;
        }
      }
      if (action.type === 'workflow_log') {
        // Historical workflow IDs are untrusted planner suggestions. An obsolete
        // or inaccessible run is not a repair failure: redirect to current source.
        let run:any;
        try { run=await githubJson('/actions/runs/'+action.runId); }
        catch (error) {
          const message=String(error instanceof Error?error.message:error);
          if (!/404|not found/i.test(message)) throw error;
          observations.push('WORKFLOW_LOG_UNAVAILABLE: requested run is missing. Inspect exact current source and do not request this historical run again.');
          continue;
        }
        if(run.head_branch!=='main' || !/^[a-f0-9]{40}$/.test(run.head_sha??'') ||
           run.status!=='completed' || run.conclusion!=='failure') {
          observations.push('WORKFLOW_LOG_STALE: requested run does not prove a failed job on the current main SHA. Inspect exact current source instead.');
          continue;
        }
        const historical = run.head_sha!==baseSha;
        if(historical) {
          // An ancestor's failure remains useful diagnostic evidence. It does
          // not establish that the current source still has that defect.
          const ancestry=await githubJson('/compare/'+run.head_sha+'...'+baseSha);
          if(!['ahead','identical'].includes(ancestry.status)) {
            observations.push('WORKFLOW_LOG_STALE: failed run is not an ancestor of this task base. Inspect current source.');
            continue;
          }
        }
        const inventory=await githubJson('/actions/runs/'+action.runId+'/jobs?per_page=100');
        if(!Array.isArray(inventory.jobs) || inventory.total_count>100)
          throw Error('PARIS_WORKFLOW_JOB_INVENTORY_INCOMPLETE');
        const job=inventory.jobs.find((item:any)=>item.id===action.jobId &&
          item.run_id===action.runId && item.conclusion==='failure');
        if(!job){
          observations.push(failedWorkflowJobGuidance(inventory.jobs,action.runId,action.jobId));
          continue;
        }
        const response=await fetch(GH_API+'/repos/'+REPOSITORY+'/actions/jobs/'+action.jobId+'/logs',{
          headers:await githubHeaders(),cache:'no-store',signal:AbortSignal.timeout(25_000),
        });
        if(!response.ok)throw Error('PARIS_WORKFLOW_LOG_READ_HTTP_'+response.status);
        const body=await response.text();
        const excerpt=failedWorkflowLogExcerpt(body);
        observations.push((historical?'HISTORICAL_WORKFLOW_LOG (verify current source before proposing a patch) ':'WORKFLOW_LOG ')+'run '+action.runId+' failed job '+action.jobId+
          ' ('+String(job.name??'job').slice(0,120)+'): '+excerpt+
          '\\n[Untrusted diagnostic log excerpt; inspect exact source before editing.]');
        continue;
      }
      if (action.type === 'search') {
        const { matches, searchFallback } = await searchCode(action.query);
        if (searchFallback !== 'none') {
          observations.push(`${searchFallback}: GitHub code search was unavailable for this repair; using authenticated tree/contents reads instead. Do not retry code search.`);
        }
        if (!matches.length) {
          const tree = await githubJson(`/git/trees/${headSha}?recursive=1`);
          const paths = suggestedSourcePaths(action.query, tree.tree, task + JSON.stringify(sourceEvidence ?? {}));
          discoveredFiles = rememberSourcePaths(discoveredFiles, paths);
          observations.push(`SEARCH ${action.query}: no content matches. Candidate filenames from the task branch: ${JSON.stringify(paths)}. Read an exact file before proposing a change.`);
        } else {
          observations.push(`SEARCH ${action.query}: ${JSON.stringify(matches).slice(0, 12_000)}`);
        }
        continue;
      }

      if (action.type === 'read' || action.type === 'list') {
        try {
          if (action.type === 'list') {
            const entries = await listDirectory(action.path, branch);
            discoveredFiles = rememberSourcePaths(discoveredFiles, entries.filter((entry: any) => entry.type === 'file').map((entry: any) => entry.path));
            observations.push(`LIST ${action.path || '/'}: ${JSON.stringify(entries)}`);
          } else {
            const file = await readFile(action.path, branch, task + JSON.stringify(sourceEvidence ?? {}));
            verifiedSourceRead = true;
            verifiedSourceExcerpts = rememberVerifiedRepairSource(verifiedSourceExcerpts,file);
            observations.push(`READ ${file.path} (sha ${file.sha}):\n${file.excerpt}`);
          }
        } catch (error) {
          // A guessed, missing or protected source path is planner feedback.
          // Credential/network failures still stop; protected writes stay blocked.
          if (!rejectedSourceRead(error)) throw error;
          observations.push(await rejectedReadFeedback(action.path, branch));
        }
        continue;
      }

      if (action.type === 'replace') {
        if (writes >= MAX_WRITES) throw new Error('Internal engineering write limit reached.');
        const file = await readFile(action.path, branch);
        const occurrences = file.content.split(action.old).length - 1;
        if (occurrences !== 1) {
          observations.push(
            `REPLACE BLOCKED ${file.path}: exact old text matched ${occurrences} times; inspect the file and choose a unique exact block.`,
          );
          continue;
        }
        const next = file.content.replace(action.old, action.replacement);
        if(next===file.content) {
          observations.push('REPLACE NO_CHANGE '+file.path+': proposed replacement did not modify source; inspect evidence or provide a changed implementation.');
          continue;
        }
        const written = await writeFile({
          path: file.path,
          content: next,
          sha: file.sha,
          branch,
          message: action.message?.trim() || `fix: update ${file.path} via internal Studio engineering`,
        });
        writes += 1;
        verifiedSourceExcerpts = discardChangedRepairSource(verifiedSourceExcerpts,file.path);
        changedFiles.add(file.path);
        if (file.path.startsWith('tests/') && /\.test\.(tsx?|mjs)$/.test(file.path)) {
          newRegressionTests.add(file.path);
        }
        if (written.commitSha) commits.push(written.commitSha);
        observations.push(`UPDATED ${file.path}; commit ${written.commitSha || 'created'}`);
        continue;
      }

      if (action.type === 'create') {
        if (writes >= MAX_WRITES) throw new Error('Internal engineering write limit reached.');
        // A test-only patch cannot validate a production repair. Preserve the
        // checkpoint and redirect the planner before creating a test artifact.
        // Shared helpers/fixtures are the exception: a defect there is itself
        // application code and cannot be fixed by editing an existing test, so a
        // new helper is a legitimate correction. Assertion suites stay blocked.
        if (action.path.startsWith('tests/') && !isApplicationSourceCorrection(action.path) &&
            !hasApplicationSourceCorrection([...changedFiles])) {
          observations.push('CREATE BLOCKED '+action.path+': first commit a justified application correction, then create a new regression test. No test-only repair was staged.');
          continue;
        }
        let exists = false;
        try {
          await readFile(action.path, branch);
          exists = true;
        } catch (error) {
          if (!(error instanceof Error) || !error.message.includes('404')) {
            const message = error instanceof Error ? error.message : String(error);
            if (!message.includes('GitHub API 404')) throw error;
          }
        }
        if (exists) {
          observations.push(`CREATE BLOCKED ${action.path}: file already exists; read and replace it instead.`);
          continue;
        }
        if(!action.content.trim()) {
          observations.push('CREATE NO_CHANGE '+action.path+': an empty source file is not a verified repair.');
          continue;
        }
        const written = await writeFile({
          path: action.path,
          content: action.content,
          branch,
          message: action.message?.trim() || `feat: create ${action.path} via internal Studio engineering`,
        });
        writes += 1;
        changedFiles.add(action.path);
        if (action.path.startsWith('tests/') && /\.test\.(tsx?|mjs)$/.test(action.path)) {
          newRegressionTests.add(action.path);
        }
        if (written.commitSha) commits.push(written.commitSha);
        observations.push(`CREATED ${action.path}; commit ${written.commitSha || 'created'}`);
        continue;
      }

      // Do not spend another inference turn after an unsupported "complete".
      // Final evidence checks below return 422 and preserve all checkpoints.
      // In continuation mode, returning 202 here would misrepresent a
      // terminal no-change proposal as a pending repair.
      if (missingRepairDeliverables(changedFiles, newRegressionTests)) {
        observations.push('COMPLETE REJECTED: no source correction and regression test were both committed.');
        complete = true;
        break;
      }
      summary = action.summary;
      complete = true;
      break;
      } finally {
        nextTurn = turn + 1;
        await checkpoint();
      }
    }
    if (continuation && !complete && nextTurn < MAX_TURNS) {
      return NextResponse.json({pending:true,turn:nextTurn}, {status:202});
    }

    const ref = await githubJson(`/git/ref/heads/${encodeURIComponent(branch)}`);
    const branchSha = String(ref?.object?.sha ?? '');
    if (!changedFiles.size || !branchSha || branchSha === baseSha) {
      return NextResponse.json(
        {
          error: 'Internal engineering finished without a verifiable repository change.',
          repository: REPOSITORY,
          branch: { name: branch, sha: branchSha || baseSha },
          base_sha: baseSha,
          changed_files: [],
          observations: observations.slice(-6),
        },
        { status: 422 },
      );
    }
    if (!newRegressionTests.size || ![...changedFiles].some(path => isApplicationSourceCorrection(path))) {
      return NextResponse.json({
        error: 'Repair requires an application correction and a regression test before independent validation.',
        repository: REPOSITORY, branch: { name: branch, sha: branchSha }, base_sha: baseSha,
        changed_files: [...changedFiles], observations: observations.slice(-6),
      }, { status: 422 });
    }

    const release = {branch,sha:branchSha,status:'pending-validation',verifiedLive:false};

    logger.info('[PARIS] repair staged for independent validation', {
      taskId,
      branch,
      branchSha,
      changedFiles: [...changedFiles],
      candidateSha: release.sha,
    });

    return NextResponse.json({
      ok: true,
      status: 'running',
      provider: usedProvider,
      repository: REPOSITORY,
      branch: { name: branch, sha: branchSha },
      base_sha: baseSha,
      changed_files: [...changedFiles],
      commits,
      pull_request: null,
      release,
      summary: summary || 'Repair staged; independent tests are required before publication.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('[studio-engineering] internal engineering task failed', error instanceof Error ? error : undefined, {
      taskId,
      branch,
      writes,
      changedFiles: [...changedFiles],
    });
    return NextResponse.json(
      {
        error: message,
        repository: REPOSITORY,
        branch: { name: branch },
        base_sha: baseSha,
        changed_files: [...changedFiles],
        commits,
        observations: observations.slice(-6),
      },
      { status: 500 },
    );
  }
}

