/**
 * /api/devstudio/git
 *
 * Git operations for Dev Studio.
 * The admin UI is only the control surface; operations target the full
 * Elevate-lms repo checkout when available, or the configured GitHub repo/branch.
 */

import { execFileSync } from 'child_process';
import { existsSync } from 'fs';
import { NextRequest, NextResponse } from 'next/server';

import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { logger } from '@/lib/logger';
import { requireTypedConfirmation } from '@/lib/security/require-confirmation';
import { hydrateProcessEnv } from '@/lib/secrets';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Resolve a secret: env var first, then platform_secrets table fallback.
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

type GitActionBody = {
  action: string;
  message?: string;
  files?: string[];
  branch?: string;
  sourceBranch?: string;
  targetBranch?: string;
  remoteUrl?: string;
  userName?: string;
  userEmail?: string;
  confirmation?: string;
  path?: string;
  content?: string;
  sha?: string;
  strategy?: string;
  githubToken?: string;
};

type GithubCommitSummary = {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
};

type GithubTreeItem = {
  path: string;
  mode?: string;
  type?: 'blob' | 'tree' | 'commit';
  sha?: string | null;
};

const DEFAULT_REPO = 'elevate-for-humanity/Elevate-lms';
const DEFAULT_BRANCH = 'main';
const DEFAULT_REMOTE_URL = `https://github.com/${DEFAULT_REPO}.git`;
const DEFAULT_USER_NAME = 'Elevate Codex';
const DEFAULT_USER_EMAIL = 'elevate4humanityedu@gmail.com';
const SAFE_BRANCH_RE = /^[A-Za-z0-9._/-]{1,120}$/;
const GH_API = 'https://api.github.com';

const REPO_DIR = (() => {
  const candidates = [
    process.env.WORKDIR,
    '/repo',
    '/workspaces/Elevate-lms',
    '/app',
    process.cwd(),
  ].filter(Boolean) as string[];

  return candidates.find((candidate) => existsSync(`${candidate}/.git`)) ?? null;
})();
const HAS_GIT = REPO_DIR !== null;

function getRepo(): string {
  const repo = (process.env.GITHUB_REPO ?? DEFAULT_REPO).trim();
  return repo || DEFAULT_REPO;
}

function getBranch(): string {
  const branch = (process.env.GITHUB_BRANCH ?? process.env.BRANCH ?? DEFAULT_BRANCH).trim();
  return branch || DEFAULT_BRANCH;
}

function encodePath(filePath: string): string {
  return encodeURIComponent(filePath).replace(/%2F/g, '/');
}

async function getGithubToken(request?: NextRequest, body?: { githubToken?: string }): Promise<string> {
  const fromRequest = body?.githubToken ||
    request?.headers.get('x-gh-token') ||
    request?.headers.get('x-github-token');
  if (fromRequest) return fromRequest.trim();
  
  // Check env vars first
  const fromEnv = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_PAT;
  if (fromEnv) return fromEnv.trim();
  
  // Fall back to platform_secrets
  const fromDb = await resolveSecret('GITHUB_TOKEN');
  return fromDb?.trim() ?? '';
}

function git(args: string[], opts?: { timeout?: number; token?: string }): string {
  if (!HAS_GIT) {
    throw new Error('No local .git checkout is available; production mode uses GitHub API or studio-shell.');
  }

  const token = opts?.token ?? process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN ?? process.env.GITHUB_PAT ?? '';
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    GIT_TERMINAL_PROMPT: '0',
    GIT_ASKPASS: 'echo',
  };

  if (token) {
    env.GIT_CONFIG_COUNT = '1';
    env.GIT_CONFIG_KEY_0 = `url.https://x-access-token:${token}@github.com/.insteadOf`;
    env.GIT_CONFIG_VALUE_0 = 'https://github.com/';
  }

  return execFileSync('git', ['-C', REPO_DIR!, ...args], {
    timeout: opts?.timeout ?? 15_000,
    encoding: 'utf8',
    env,
  }).trim();
}

function gitBuffer(args: string[], opts?: { timeout?: number }): Buffer {
  if (!HAS_GIT) throw new Error('No local .git checkout is available');

  return execFileSync('git', ['-C', REPO_DIR!, ...args], {
    timeout: opts?.timeout ?? 15_000,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
    encoding: 'buffer',
    maxBuffer: 50 * 1024 * 1024,
  }) as Buffer;
}

function gitText(args: string[], opts?: { timeout?: number }): string {
  return gitBuffer(args, opts).toString('utf8').trim();
}

function redactToken(output: string, token: string): string {
  if (!token) return output;

  const basic = Buffer.from(`x-access-token:${token}`).toString('base64');
  return [token, `x-access-token:${token}`, basic, `Authorization: Basic ${basic}`].reduce(
    (acc, secret) => acc.split(secret).join('[REDACTED]'),
    output,
  );
}

function isNetworkBlockedError(err: unknown): boolean {
  const text = err instanceof Error ? `${err.name} ${err.message} ${err.stack ?? ''}` : String(err);
  return /CONNECT tunnel failed|response 403|Could not resolve host|getaddrinfo|EAI_AGAIN|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|network timeout|fetch failed/i.test(
    text,
  );
}

function safeBranch(value: string, label: string): string | NextResponse {
  if (
    !SAFE_BRANCH_RE.test(value) ||
    value.includes('..') ||
    value.startsWith('/') ||
    value.endsWith('/')
  ) {
    return safeError(`${label} contains invalid branch characters`, 400);
  }

  return value;
}

function parseDiffNameStatus(output: string) {
  return output
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const parts = line.split('\t');
      const status = parts[0] ?? '';
      if (status.startsWith('R')) return { status: 'R', oldPath: parts[1], path: parts[2] };
      return { status: status[0], path: parts[1] };
    })
    .filter((entry): entry is { status: string; path: string; oldPath?: string } => !!entry.path);
}

async function githubApi<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${GH_API}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...((init?.headers as Record<string, string>) ?? {}),
    },
  });

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 500);
    throw new Error(`GitHub API ${res.status}: ${detail}`);
  }

  return res.json() as Promise<T>;
}

async function ghFetch<T>(path: string, token?: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${GH_API}${path}`, {
    ...opts,
    cache: 'no-store',
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((opts?.headers as Record<string, string>) ?? {}),
    },
  });

  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }

  return res.json() as Promise<T>;
}

async function getGithubRefSha(repo: string, branch: string, token: string): Promise<string> {
  const data = await githubApi<{ object?: { sha?: string } }>(
    `/repos/${repo}/git/ref/heads/${encodePath(branch)}`,
    token,
  );

  if (!data.object?.sha) throw new Error(`GitHub branch ${branch} did not return a commit SHA`);
  return data.object.sha;
}

async function updateGithubBranchRef(repo: string, branch: string, sha: string, token: string) {
  return githubApi<{ ref: string; object?: { sha?: string } }>(
    `/repos/${repo}/git/refs/heads/${encodePath(branch)}`,
    token,
    { method: 'PATCH', body: JSON.stringify({ sha, force: false }) },
  );
}

async function createGithubBlob(repo: string, token: string, content: Buffer): Promise<string> {
  const blob = await githubApi<{ sha: string }>(`/repos/${repo}/git/blobs`, token, {
    method: 'POST',
    body: JSON.stringify({ content: content.toString('base64'), encoding: 'base64' }),
  });

  return blob.sha;
}

async function promoteLocalHeadViaGithubApi(params: {
  repo: string;
  sourceRef: string;
  targetBranch: string;
  token: string;
  message?: string;
}) {
  const { repo, sourceRef, targetBranch, token } = params;
  const sourceSha = gitText(['rev-parse', sourceRef]);
  const target = await githubApi<{ object: { sha: string } }>(
    `/repos/${repo}/git/ref/heads/${encodePath(targetBranch)}`,
    token,
  );
  const targetSha = target.object.sha;
  const targetCommit = await githubApi<{ tree: { sha: string } }>(
    `/repos/${repo}/git/commits/${targetSha}`,
    token,
  );
  const diff = gitText(['diff', '--name-status', '--find-renames', `${targetSha}..${sourceSha}`], {
    timeout: 30_000,
  });
  const entries = parseDiffNameStatus(diff);

  if (!entries.length) {
    return { sourceSha, targetSha, newSha: targetSha, changedFiles: 0, skipped: true };
  }

  const tree: GithubTreeItem[] = [];
  for (const entry of entries) {
    if (entry.status === 'R' && entry.oldPath) tree.push({ path: entry.oldPath, sha: null });
    if (entry.status === 'D') {
      tree.push({ path: entry.path, sha: null });
      continue;
    }

    const modeLine = gitText(['ls-tree', sourceSha, '--', entry.path]);
    const mode = modeLine.split(/\s+/)[0] || '100644';
    const content = gitBuffer(['show', `${sourceSha}:${entry.path}`], { timeout: 30_000 });
    const blobSha = await createGithubBlob(repo, token, content);
    tree.push({ path: entry.path, mode, type: 'blob', sha: blobSha });
  }

  const newTree = await githubApi<{ sha: string }>(`/repos/${repo}/git/trees`, token, {
    method: 'POST',
    body: JSON.stringify({ base_tree: targetCommit.tree.sha, tree }),
  });
  const newCommit = await githubApi<{ sha: string }>(`/repos/${repo}/git/commits`, token, {
    method: 'POST',
    body: JSON.stringify({
      message: params.message ?? `Promote ${sourceRef} to ${targetBranch} from Dev Studio`,
      tree: newTree.sha,
      parents: [targetSha],
    }),
  });

  await updateGithubBranchRef(repo, targetBranch, newCommit.sha, token);
  return {
    sourceSha,
    targetSha,
    newSha: newCommit.sha,
    changedFiles: entries.length,
    skipped: false,
  };
}

function configureLocalGit(remoteUrl: string, userName: string, userEmail: string) {
  git(['config', 'user.name', userName]);
  git(['config', 'user.email', userEmail]);
  const remotes = git(['remote'])
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (remotes.includes('origin')) git(['remote', 'set-url', 'origin', remoteUrl]);
  else git(['remote', 'add', 'origin', remoteUrl]);
}

function mapGithubCommit(commit: GithubCommitSummary) {
  return {
    hash: commit.sha.slice(0, 7),
    subject: commit.commit.message.split('\n')[0],
    author: commit.commit.author.name,
    when: new Date(commit.commit.author.date).toLocaleString(),
  };
}

export async function GET(request: NextRequest) {
  await hydrateProcessEnv();
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  const action = request.nextUrl.searchParams.get('action') ?? 'status';
  const file = request.nextUrl.searchParams.get('file') ?? '';
  const repo = getRepo();
  const branchRef = getBranch();
  const token = await getGithubToken(request);

  try {
    if (action === 'status') {
      if (HAS_GIT) {
        const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']);
        const status = git(['status', '--porcelain']);
        const ahead = (() => {
          try {
            return git(['rev-list', '--count', '@{u}..HEAD']);
          } catch {
            return '0';
          }
        })();
        const behind = (() => {
          try {
            return git(['rev-list', '--count', 'HEAD..@{u}']);
          } catch {
            return '0';
          }
        })();
        const log = git(['log', '--oneline', '-10', '--pretty=format:%h|%s|%an|%ar']);
        const changed = status
          .split('\n')
          .filter(Boolean)
          .map((line) => ({ status: line.slice(0, 2).trim(), file: line.slice(3) }));
        const commits = log
          .split('\n')
          .filter(Boolean)
          .map((line) => {
            const [hash, subject, author, when] = line.split('|');
            return { hash, subject, author, when };
          });

        return NextResponse.json({
          branch,
          changed,
          commits,
          ahead: +ahead,
          behind: +behind,
          mode: 'local',
          repo,
          workdir: REPO_DIR,
        });
      }

      const [branchData, commitsData] = await Promise.all([
        ghFetch<{ commit: { sha: string } }>(
          `/repos/${repo}/branches/${encodeURIComponent(branchRef)}`,
          token,
        ),
        ghFetch<GithubCommitSummary[]>(
          `/repos/${repo}/commits?sha=${encodeURIComponent(branchRef)}&per_page=10`,
          token,
        ),
      ]);

      return NextResponse.json({
        branch: branchRef,
        changed: [],
        commits: commitsData.map(mapGithubCommit),
        ahead: 0,
        behind: 0,
        mode: 'github-api',
        repo,
        latestCommit: branchData.commit.sha.slice(0, 7),
      });
    }

    if (action === 'diff') {
      if (HAS_GIT) {
        const diff = git(file ? ['diff', 'HEAD', '--', file] : ['diff', 'HEAD'], { timeout: 10_000 });
        return NextResponse.json({ diff, mode: 'local', repo, workdir: REPO_DIR });
      }

      if (!file) {
        return NextResponse.json({
          diff: '',
          note: 'Specify ?file= for diff in GitHub API mode',
          mode: 'github-api',
          repo,
          branch: branchRef,
        });
      }

      const data = await ghFetch<{ content?: string }>(
        `/repos/${repo}/contents/${encodePath(file)}?ref=${encodeURIComponent(branchRef)}`,
        token,
      );
      const content = data.content ? Buffer.from(data.content, 'base64').toString('utf8') : '';
      return NextResponse.json({
        diff: content,
        mode: 'github-api',
        repo,
        branch: branchRef,
        note: 'Showing file content; use the Terminal tab for local diff.',
      });
    }

    if (action === 'log') {
      if (HAS_GIT) {
        const log = git(['log', '--oneline', '-30', '--pretty=format:%h|%s|%an|%ar|%D']);
        const commits = log
          .split('\n')
          .filter(Boolean)
          .map((line) => {
            const [hash, subject, author, when, refs] = line.split('|');
            return { hash, subject, author, when, refs };
          });
        return NextResponse.json({ commits, mode: 'local', repo, workdir: REPO_DIR });
      }

      const data = await ghFetch<GithubCommitSummary[]>(
        `/repos/${repo}/commits?sha=${encodeURIComponent(branchRef)}&per_page=30`,
        token,
      );
      const commits = data.map((commit) => ({ ...mapGithubCommit(commit), refs: '' }));
      return NextResponse.json({ commits, mode: 'github-api', repo, branch: branchRef });
    }

    if (action === 'branches') {
      if (HAS_GIT) {
        const local = git(['branch', '--format=%(refname:short)']).split('\n').filter(Boolean);
        const remote = (() => {
          try {
            return git(['branch', '-r', '--format=%(refname:short)']).split('\n').filter(Boolean);
          } catch {
            return [];
          }
        })();
        const current = git(['rev-parse', '--abbrev-ref', 'HEAD']);
        return NextResponse.json({ local, remote, current, mode: 'local', repo, workdir: REPO_DIR });
      }

      const data = await ghFetch<Array<{ name: string }>>(`/repos/${repo}/branches?per_page=50`, token);
      const branches = data.map((branch) => branch.name);
      return NextResponse.json({
        local: branches,
        remote: branches.map((branch) => `origin/${branch}`),
        current: branchRef,
        mode: 'github-api',
        repo,
      });
    }

    return safeError(`Unknown action: ${action}`, 400);
  } catch (err) {
    logger.error('[devstudio/git] GET failed', undefined, { action, err });
    return safeInternalError(err, 'Git operation failed');
  }
}

export async function POST(request: NextRequest) {
  await hydrateProcessEnv();
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  let body: GitActionBody;
  try {
    body = await request.json();
  } catch {
    return safeError('Invalid JSON', 400);
  }

  const { action } = body;
  const repo = getRepo();
  const branchRef = getBranch();

  if (!HAS_GIT) {
    if (action === 'configure-and-push-main' || action === 'configure-and-push') {
      const targetBranch = safeBranch((body.targetBranch ?? getBranch()).trim(), 'targetBranch');
      if (targetBranch instanceof NextResponse) return targetBranch;
      const sourceBranch = safeBranch((body.sourceBranch ?? branchRef).trim(), 'sourceBranch');
      if (sourceBranch instanceof NextResponse) return sourceBranch;

      const confirm = requireTypedConfirmation(body.confirmation, 'git_push');
      if (!confirm.ok) {
        return NextResponse.json(
          {
            ok: false,
            error: `Type "${confirm.required}" to confirm push to ${targetBranch}`,
            requiresConfirmation: true,
            required: confirm.required,
          },
          { status: 422 },
        );
      }

      const token = await getGithubToken(request, body);
      if (!token) {
        return safeError(
          'GITHUB_TOKEN, GH_TOKEN, GITHUB_PAT, or x-gh-token is required to update GitHub refs from production.',
          409,
        );
      }

      const sourceSha = await getGithubRefSha(repo, sourceBranch, token);
      const result = await updateGithubBranchRef(repo, targetBranch, sourceSha, token);
      return NextResponse.json({
        ok: true,
        action,
        sourceBranch,
        targetBranch,
        hash: result.object?.sha?.slice(0, 7) ?? sourceSha.slice(0, 7),
        mode: 'github-api-ref-update',
        repo,
        branch: branchRef,
      });
    }

    if (action === 'commit') {
      const { path: filePath, content, message } = body;
      if (!filePath || !content || !message) {
        return safeError('path, content, and message required in GitHub API mode', 400);
      }

      const token = await getGithubToken(request, body);
      if (!token) {
        return safeError(
          'GITHUB_TOKEN, GH_TOKEN, GITHUB_PAT, or x-gh-token is required to commit through GitHub API mode.',
          409,
        );
      }

      const current = await githubApi<{ sha: string }>(
        `/repos/${repo}/contents/${encodePath(filePath)}?ref=${encodeURIComponent(branchRef)}`,
        token,
      );
      const res = await fetch(`${GH_API}/repos/${repo}/contents/${encodePath(filePath)}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({
          message,
          content: Buffer.from(content).toString('base64'),
          sha: body.sha ?? current.sha,
          branch: branchRef,
        }),
      });
      if (!res.ok) return safeError(`GitHub commit failed: ${res.status}`, 502);
      const data = (await res.json()) as { commit: { sha: string } };
      return NextResponse.json({
        ok: true,
        hash: data.commit.sha.slice(0, 7),
        mode: 'github-api',
        repo,
        branch: branchRef,
      });
    }

    return NextResponse.json(
      {
        ok: false,
        error: `"${action}" requires local git. Use commit/configure-and-push in GitHub API mode, or use the Terminal tab (studio-shell) in /repo for full-repo git commands.`,
        mode: 'github-api',
        repo,
        branch: branchRef,
      },
      { status: 422 },
    );
  }

  try {
    if (action === 'configure-and-push-main' || action === 'configure-and-push') {
      const targetBranch = safeBranch((body.targetBranch ?? getBranch()).trim(), 'targetBranch');
      if (targetBranch instanceof NextResponse) return targetBranch;
      const sourceBranch = safeBranch(
        (body.sourceBranch ?? git(['rev-parse', '--abbrev-ref', 'HEAD'])).trim(),
        'sourceBranch',
      );
      if (sourceBranch instanceof NextResponse) return sourceBranch;

      const remoteUrl = (body.remoteUrl ?? process.env.GITHUB_REMOTE_URL ?? DEFAULT_REMOTE_URL).trim();
      const userName = (body.userName ?? process.env.GIT_AUTHOR_NAME ?? DEFAULT_USER_NAME).trim();
      const userEmail = (body.userEmail ?? process.env.GIT_AUTHOR_EMAIL ?? DEFAULT_USER_EMAIL).trim();
      const token = await getGithubToken(request, body);
      if (!token) {
        return safeError(
          'GITHUB_TOKEN, GH_TOKEN, GITHUB_PAT, or x-gh-token is required to push from the admin container.',
          409,
        );
      }

      const confirm = requireTypedConfirmation(body.confirmation, 'git_push');
      if (!confirm.ok) {
        return NextResponse.json(
          {
            ok: false,
            error: `Type "${confirm.required}" to confirm push to ${targetBranch}`,
            requiresConfirmation: true,
            required: confirm.required,
          },
          { status: 422 },
        );
      }

      configureLocalGit(remoteUrl, userName, userEmail);
      const basic = Buffer.from(`x-access-token:${token}`).toString('base64');

      if (body.strategy === 'github-api') {
        const promoted = await promoteLocalHeadViaGithubApi({
          repo,
          sourceRef: sourceBranch,
          targetBranch,
          token,
          message: body.message,
        });
        return NextResponse.json({
          ok: true,
          action,
          sourceBranch,
          targetBranch,
          mode: 'github-api-tree-promote',
          hash: promoted.newSha.slice(0, 7),
          changedFiles: promoted.changedFiles,
          skipped: promoted.skipped,
          repo,
          workdir: REPO_DIR,
        });
      }

      try {
        const out = git(
          [
            '-c',
            `http.https://github.com/.extraheader=Authorization: Basic ${basic}`,
            'push',
            'origin',
            `${sourceBranch}:${targetBranch}`,
          ],
          { timeout: 120_000, token },
        );
        return NextResponse.json({
          ok: true,
          action,
          sourceBranch,
          targetBranch,
          mode: 'git-push',
          output: redactToken(out, token),
          repo,
          workdir: REPO_DIR,
        });
      } catch (err) {
        if (!isNetworkBlockedError(err)) throw err;
        const promoted = await promoteLocalHeadViaGithubApi({
          repo,
          sourceRef: sourceBranch,
          targetBranch,
          token,
          message: body.message,
        });
        return NextResponse.json({
          ok: true,
          action,
          sourceBranch,
          targetBranch,
          mode: 'github-api-tree-promote-after-git-network-failure',
          hash: promoted.newSha.slice(0, 7),
          changedFiles: promoted.changedFiles,
          skipped: promoted.skipped,
          warning:
            'Local git push was blocked by container network/proxy, so Dev Studio promoted the local HEAD tree through the GitHub API.',
          repo,
          workdir: REPO_DIR,
        });
      }
    }

    if (action === 'configure-git') {
      const remoteUrl = (body.remoteUrl ?? process.env.GITHUB_REMOTE_URL ?? DEFAULT_REMOTE_URL).trim();
      const userName = (body.userName ?? process.env.GIT_AUTHOR_NAME ?? DEFAULT_USER_NAME).trim();
      const userEmail = (body.userEmail ?? process.env.GIT_AUTHOR_EMAIL ?? DEFAULT_USER_EMAIL).trim();
      configureLocalGit(remoteUrl, userName, userEmail);
      return NextResponse.json({ ok: true, action, remoteUrl, userName, userEmail, repo, workdir: REPO_DIR });
    }

    if (action === 'commit') {
      const msg = (body.message ?? '').trim();
      if (!msg) return safeError('commit message required', 400);
      if (body.files?.length) {
        for (const filePath of body.files) git(['add', '--', filePath]);
      } else {
        git(['add', '-A']);
      }

      const staged = git(['diff', '--cached', '--name-only']);
      if (!staged.trim()) {
        return NextResponse.json({
          ok: false,
          message: 'Nothing to commit - working tree clean',
          repo,
          workdir: REPO_DIR,
        });
      }

      git(['commit', '-m', msg, `--author=Admin Studio <admin@${PLATFORM_DEFAULTS.canonicalDomain}>`]);
      const hash = git(['rev-parse', '--short', 'HEAD']);
      return NextResponse.json({ ok: true, hash, message: msg, repo, workdir: REPO_DIR });
    }

    if (action === 'push') {
      const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']);
      if (branch === 'main' || branch === 'master') {
        return NextResponse.json(
          {
            ok: false,
            error: `Direct push to "${branch}" is blocked. Create a feature branch, then open a PR to merge.`,
            blocked: true,
          },
          { status: 403 },
        );
      }

      const confirm = requireTypedConfirmation(body.confirmation, 'git_push');
      if (!confirm.ok) {
        return NextResponse.json(
          {
            ok: false,
            error: `Type "${confirm.required}" to confirm push to ${branch}`,
            requiresConfirmation: true,
            required: confirm.required,
          },
          { status: 422 },
        );
      }

      const ghToken = await getGithubToken(request, body);
      const pushOut = ghToken
        ? git(
            [
              '-c',
              `http.https://github.com/.extraheader=Authorization: Basic ${Buffer.from(
                `x-access-token:${ghToken}`,
              ).toString('base64')}`,
              'push',
              'origin',
              branch,
            ],
            { timeout: 30_000, token: ghToken },
          )
        : git(['push', 'origin', branch], { timeout: 30_000 });

      return NextResponse.json({
        ok: true,
        branch,
        output: redactToken(pushOut, ghToken),
        repo,
        workdir: REPO_DIR,
      });
    }

    if (action === 'pull') {
      const out = git(['pull', '--rebase'], { timeout: 30_000 });
      return NextResponse.json({ ok: true, output: out, repo, workdir: REPO_DIR });
    }

    if (action === 'checkout') {
      const branch = (body.branch ?? '').trim();
      if (!branch) return safeError('branch name required', 400);
      const safe = safeBranch(branch, 'branch');
      if (safe instanceof NextResponse) return safe;

      try {
        git(['checkout', safe]);
      } catch {
        git(['checkout', '-b', safe]);
      }

      return NextResponse.json({ ok: true, branch, repo, workdir: REPO_DIR });
    }

    if (action === 'stash') {
      git(['stash']);
      return NextResponse.json({ ok: true, repo, workdir: REPO_DIR });
    }

    if (action === 'stash-pop') {
      git(['stash', 'pop']);
      return NextResponse.json({ ok: true, repo, workdir: REPO_DIR });
    }

    return safeError(`Unknown action: ${action}`, 400);
  } catch (err) {
    logger.error('[devstudio/git] POST failed', undefined, { action, err });
    return safeInternalError(err, 'Git operation failed');
  }
}
