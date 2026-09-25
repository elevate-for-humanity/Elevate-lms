import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { aiChat } from '@/lib/ai/ai-service';
import { hydrateProcessEnv } from '@/lib/secrets';
import { getGitHubHeaders } from '@/lib/devstudio/github-token';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const REPOSITORY = process.env.GITHUB_REPO?.trim() || 'elevate-for-humanity/Elevate-lms';
const BASE_BRANCH = process.env.GITHUB_BRANCH?.trim() || 'main';
const GH_API = 'https://api.github.com';
const MAX_TURNS = 14;
const MAX_WRITES = 6;
const MAX_READ_CHARS = 16_000;

type AgentAction =
  | { type: 'search'; query: string }
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

function blockedPath(path: string): boolean {
  return (
    !path ||
    path.includes('..') ||
    /^\.env(?:\.|$)/.test(path) ||
    path.startsWith('.git/') ||
    path.includes('/node_modules/') ||
    path.includes('/.next/')
  );
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
    throw new Error(
      `GitHub API ${response.status} for ${path}: ${String(payload?.message ?? text).slice(0, 500)}`,
    );
  }
  return payload;
}

async function createTaskBranch(taskId: string) {
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

async function readFile(path: string, branch: string) {
  const normalized = normalizePath(path);
  if (blockedPath(normalized)) throw new Error('Repository path is not allowed.');
  const data = await githubJson(
    `/contents/${normalized.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(branch)}`,
  );
  if (Array.isArray(data) || data.type !== 'file') throw new Error(`${normalized} is not a file.`);
  const content = Buffer.from(String(data.content ?? ''), 'base64').toString('utf8');
  return {
    path: normalized,
    sha: String(data.sha ?? ''),
    content,
    excerpt:
      content.length <= MAX_READ_CHARS
        ? content
        : `${content.slice(0, MAX_READ_CHARS / 2)}\n\n…[truncated]…\n\n${content.slice(-MAX_READ_CHARS / 2)}`,
  };
}

async function writeFile(input: {
  path: string;
  content: string;
  branch: string;
  sha?: string;
  message: string;
}) {
  const normalized = normalizePath(input.path);
  if (blockedPath(normalized)) throw new Error('Repository path is not allowed.');
  const result = await githubJson(
    `/contents/${normalized.split('/').map(encodeURIComponent).join('/')}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        message: input.message,
        content: Buffer.from(input.content, 'utf8').toString('base64'),
        branch: input.branch,
        ...(input.sha ? { sha: input.sha } : {}),
      }),
    },
  );
  return {
    path: normalized,
    contentSha: String(result?.content?.sha ?? ''),
    commitSha: String(result?.commit?.sha ?? ''),
  };
}

async function searchCode(query: string) {
  const q = query.trim().slice(0, 500);
  if (!q) return [];
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
    throw new Error(`GitHub code search failed: ${String(payload?.message ?? response.status)}`);
  }
  return (Array.isArray(payload.items) ? payload.items : []).map((item: any) => ({
    path: item.path,
    name: item.name,
    matches: Array.isArray(item.text_matches)
      ? item.text_matches.slice(0, 3).map((match: any) => match.fragment)
      : [],
  }));
}

function parseAction(value: Record<string, unknown>): AgentAction {
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

async function createPullRequest(branch: string, title: string, body: string) {
  try {
    return await githubJson('/pulls', {
      method: 'POST',
      body: JSON.stringify({
        title: title.slice(0, 240),
        head: branch,
        base: BASE_BRANCH,
        body: body.slice(0, 20_000),
        maintainer_can_modify: true,
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes('422')) throw error;
    const pulls = await githubJson(
      `/pulls?state=open&head=${encodeURIComponent(REPOSITORY.split('/')[0] + ':' + branch)}&base=${encodeURIComponent(BASE_BRANCH)}`,
    );
    if (Array.isArray(pulls) && pulls[0]) return pulls[0];
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const task = String(body.task ?? body.goal ?? '').trim();
  if (!task) return NextResponse.json({ error: 'task is required' }, { status: 400 });

  await hydrateProcessEnv().catch(() => undefined);

  const taskId = crypto.randomUUID();
  const { branch, baseSha } = await createTaskBranch(taskId);
  const observations: string[] = [
    `Repository: ${REPOSITORY}`,
    `Base: ${BASE_BRANCH}@${baseSha}`,
    `Working branch: ${branch}`,
  ];
  const changedFiles = new Set<string>();
  const commits: string[] = [];
  let writes = 0;
  let summary = '';

  try {
    for (let turn = 0; turn < MAX_TURNS; turn += 1) {
      const result = await aiChat({
        providerPolicy: 'owned-only',
        messages: [
          {
            role: 'system',
            content:
              'You are Elevate Internal Engineering. Work only on the requested repository task. ' +
              'You are editing a task branch, never main. Inspect before editing. Prefer the smallest architectural fix, update shared code instead of user-specific patches, and preserve newer unrelated changes. ' +
              'Return exactly one JSON action. Allowed actions: ' +
              '{"type":"search","query":"..."}, ' +
              '{"type":"read","path":"..."}, ' +
              '{"type":"replace","path":"...","old":"exact existing text","replacement":"new text","message":"commit message"}, ' +
              '{"type":"create","path":"...","content":"...","message":"commit message"}, ' +
              '{"type":"complete","summary":"..."}. ' +
              'Use replace for existing files. The old text must be exact and sufficiently specific. ' +
              'Do not touch secrets, .env files, generated dependencies, or unrelated features. ' +
              'Do not claim success until the required source changes are committed to the task branch.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              task,
              turn: turn + 1,
              writes,
              maximumWrites: MAX_WRITES,
              observations: observations.slice(-8),
              changedFiles: [...changedFiles],
            }),
          },
        ],
        temperature: 0.1,
        maxTokens: 2400,
        jsonMode: true,
      });

      const action = parseAction(jsonObject(result.content));
      if (action.type === 'search') {
        const matches = await searchCode(action.query);
        observations.push(
          `SEARCH ${action.query}: ${JSON.stringify(matches).slice(0, 12_000)}`,
        );
        continue;
      }

      if (action.type === 'read') {
        const file = await readFile(action.path, branch);
        observations.push(`READ ${file.path} (sha ${file.sha}):\n${file.excerpt}`);
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
        const written = await writeFile({
          path: file.path,
          content: next,
          sha: file.sha,
          branch,
          message: action.message?.trim() || `fix: update ${file.path} via internal Studio engineering`,
        });
        writes += 1;
        changedFiles.add(file.path);
        if (written.commitSha) commits.push(written.commitSha);
        observations.push(`UPDATED ${file.path}; commit ${written.commitSha || 'created'}`);
        continue;
      }

      if (action.type === 'create') {
        if (writes >= MAX_WRITES) throw new Error('Internal engineering write limit reached.');
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
        const written = await writeFile({
          path: action.path,
          content: action.content,
          branch,
          message: action.message?.trim() || `feat: create ${action.path} via internal Studio engineering`,
        });
        writes += 1;
        changedFiles.add(action.path);
        if (written.commitSha) commits.push(written.commitSha);
        observations.push(`CREATED ${action.path}; commit ${written.commitSha || 'created'}`);
        continue;
      }

      summary = action.summary;
      break;
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

    const pr = await createPullRequest(
      branch,
      `Studio: ${task.slice(0, 180)}`,
      [
        'Automated Elevate-owned Dev Studio engineering task.',
        '',
        `Task: ${task}`,
        '',
        `Summary: ${summary || 'Repository changes prepared for CI review.'}`,
        '',
        'Changed files:',
        ...[...changedFiles].map((path) => `- ${path}`),
        '',
        'This PR must pass canonical CI before merge or deployment.',
      ].join('\n'),
    );

    logger.info('[studio-engineering] internal task branch prepared', {
      taskId,
      branch,
      branchSha,
      changedFiles: [...changedFiles],
      pullRequest: pr?.number ?? null,
    });

    return NextResponse.json({
      ok: true,
      status: 'completed',
      provider: 'elevate',
      repository: REPOSITORY,
      branch: { name: branch, sha: branchSha },
      base_sha: baseSha,
      changed_files: [...changedFiles],
      commits,
      pull_request: pr
        ? {
            number: pr.number,
            url: pr.html_url,
            state: pr.state,
            head_sha: pr.head?.sha ?? branchSha,
          }
        : null,
      summary: summary || 'Repository changes prepared on a Studio branch for CI review.',
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
