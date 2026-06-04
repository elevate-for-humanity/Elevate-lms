/**
 * /api/devstudio/git
 *
 * Git operations for Dev Studio.
 *
 * Runtime detection:
 *   LOCAL (.git present) — runs git commands via execSync
 *   Runtime without .git  — falls back to GitHub REST API for reads;
 *                          single-file commits via GitHub Contents API;
 *                          push/pull/checkout require the studio-shell container
 *
 * GET  ?action=status   → branch, changed files, recent commits
 * GET  ?action=diff&file=path
 * GET  ?action=log
 * GET  ?action=branches
 * POST { action: 'commit', message, files?, path?, content? }
 * POST { action: 'push' }
 * POST { action: 'checkout', branch }
 * POST { action: 'pull' }
 *
 * Admin-only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';
import { hydrateProcessEnv } from '@/lib/secrets';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { requireTypedConfirmation } from '@/lib/security/require-confirmation';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REPO = process.env.GITHUB_REPO ?? 'elevate-for-humanity/Elevate-lms';
const GH_API = 'https://api.github.com';

// LOCAL: .git present (Gitpod / dev). Hosted runtime: no .git — use GitHub API.
const REPO_DIR = (() => {
  const candidates = ['/workspaces/Elevate-lms', '/app', process.cwd()];
  return candidates.find(p => existsSync(`${p}/.git`)) ?? null;
})();
const HAS_GIT = REPO_DIR !== null;

// ── Local git helper ──────────────────────────────────────────────────────────

function git(cmd: string, opts?: { timeout?: number }): string {
  if (!HAS_GIT) throw new Error('No local .git — hosted runtime uses GitHub API');
  const token = process.env.GITHUB_TOKEN ?? '';
  const env: NodeJS.ProcessEnv = { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_ASKPASS: 'echo' };
  if (token) {
    env.GIT_CONFIG_COUNT = '1';
    env.GIT_CONFIG_KEY_0 = `url.https://x-access-token:${token}@github.com/.insteadOf`;
    env.GIT_CONFIG_VALUE_0 = 'https://github.com/';
  }
  return execSync(`git -C ${REPO_DIR} ${cmd}`, { timeout: opts?.timeout ?? 15000, encoding: 'utf8', env }).trim();
}

// ── GitHub API helper (hosted-runtime fallback) ─────────────────────────────────────────

async function ghFetch(path: string, opts?: RequestInit) {
  const token = process.env.GITHUB_TOKEN ?? '';
  const res = await fetch(`${GH_API}${path}`, {
    ...opts,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts?.headers as Record<string, string> ?? {}),
    },
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  await hydrateProcessEnv();
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const action = request.nextUrl.searchParams.get('action') ?? 'status';
  const file   = request.nextUrl.searchParams.get('file') ?? '';

  try {
    if (action === 'status') {
      if (HAS_GIT) {
        const branch  = git('rev-parse --abbrev-ref HEAD');
        const status  = git('status --porcelain');
        const ahead   = (() => { try { return git('rev-list --count @{u}..HEAD'); } catch { return '0'; } })();
        const behind  = (() => { try { return git('rev-list --count HEAD..@{u}'); } catch { return '0'; } })();
        const log     = git('log --oneline -10 --pretty=format:"%h|%s|%an|%ar"');
        const changed = status.split('\n').filter(Boolean).map(line => ({ status: line.slice(0, 2).trim(), file: line.slice(3) }));
        const commits = log.split('\n').filter(Boolean).map(line => {
          const [hash, subject, author, when] = line.split('|');
          return { hash, subject, author, when };
        });
        return NextResponse.json({ branch, changed, commits, ahead: +ahead, behind: +behind, mode: 'local' });
      }
      // Hosted runtime: GitHub API
      const [branchData, commitsData] = await Promise.all([
        ghFetch(`/repos/${REPO}/branches/main`),
        ghFetch(`/repos/${REPO}/commits?per_page=10`),
      ]) as [{ commit: { sha: string } }, Array<{ sha: string; commit: { message: string; author: { name: string; date: string } } }>];
      const commits = commitsData.map(c => ({
        hash: c.sha.slice(0, 7), subject: c.commit.message.split('\n')[0],
        author: c.commit.author.name, when: new Date(c.commit.author.date).toLocaleString(),
      }));
      return NextResponse.json({ branch: 'main', changed: [], commits, ahead: 0, behind: 0, mode: 'github-api', latestCommit: branchData.commit.sha.slice(0, 7) });
    }

    if (action === 'diff') {
      if (HAS_GIT) {
        const diff = git(`diff HEAD ${file ? `-- ${file}` : ''}`, { timeout: 10000 });
        return NextResponse.json({ diff, mode: 'local' });
      }
      if (!file) return NextResponse.json({ diff: '', note: 'Specify ?file= for diff in hosted-runtime mode', mode: 'github-api' });
      const data = await ghFetch(`/repos/${REPO}/contents/${encodeURIComponent(file)}?ref=main`) as { content?: string };
      const content = data.content ? Buffer.from(data.content, 'base64').toString('utf8') : '';
      return NextResponse.json({ diff: content, mode: 'github-api', note: 'Showing file content (no local diff in hosted runtime)' });
    }

    if (action === 'log') {
      if (HAS_GIT) {
        const log = git('log --oneline -30 --pretty=format:"%h|%s|%an|%ar|%D"');
        const commits = log.split('\n').filter(Boolean).map(line => {
          const [hash, subject, author, when, refs] = line.split('|');
          return { hash, subject, author, when, refs };
        });
        return NextResponse.json({ commits, mode: 'local' });
      }
      const data = await ghFetch(`/repos/${REPO}/commits?per_page=30`) as Array<{ sha: string; commit: { message: string; author: { name: string; date: string } } }>;
      const commits = data.map(c => ({ hash: c.sha.slice(0, 7), subject: c.commit.message.split('\n')[0], author: c.commit.author.name, when: new Date(c.commit.author.date).toLocaleString(), refs: '' }));
      return NextResponse.json({ commits, mode: 'github-api' });
    }

    if (action === 'branches') {
      if (HAS_GIT) {
        const local   = git('branch --format="%(refname:short)"').split('\n').filter(Boolean);
        const remote  = (() => { try { return git('branch -r --format="%(refname:short)"').split('\n').filter(Boolean); } catch { return []; } })();
        const current = git('rev-parse --abbrev-ref HEAD');
        return NextResponse.json({ local, remote, current, mode: 'local' });
      }
      const data = await ghFetch(`/repos/${REPO}/branches?per_page=50`) as Array<{ name: string }>;
      const branches = data.map(b => b.name);
      return NextResponse.json({ local: branches, remote: branches.map(b => `origin/${b}`), current: 'main', mode: 'github-api' });
    }

    return safeError(`Unknown action: ${action}`, 400);
  } catch (err) {
    logger.error('[devstudio/git] GET failed', undefined, { action, err });
    return safeInternalError(err, 'Git operation failed');
  }
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  await hydrateProcessEnv();
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  let body: { action: string; message?: string; files?: string[]; branch?: string; confirmation?: string; path?: string; content?: string };
  try { body = await request.json(); } catch { return safeError('Invalid JSON', 400); }

  const { action } = body;

  // Hosted runtime: no local git — single-file commits via GitHub API; everything else needs shell
  if (!HAS_GIT) {
    if (action === 'commit') {
      const { path: filePath, content, message } = body;
      if (!filePath || !content || !message) return safeError('path, content, and message required in hosted-runtime mode', 400);
      const current = await ghFetch(`/repos/${REPO}/contents/${encodeURIComponent(filePath)}?ref=main`) as { sha: string };
      const token = process.env.GITHUB_TOKEN ?? '';
      const res = await fetch(`${GH_API}/repos/${REPO}/contents/${encodeURIComponent(filePath)}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/vnd.github+json' },
        body: JSON.stringify({ message, content: Buffer.from(content).toString('base64'), sha: current.sha, branch: 'main' }),
      });
      if (!res.ok) return safeError(`GitHub commit failed: ${res.status}`, 502);
      const data = await res.json() as { commit: { sha: string } };
      return NextResponse.json({ ok: true, hash: data.commit.sha.slice(0, 7), mode: 'github-api' });
    }
    return NextResponse.json({
      ok: false,
      error: `"${action}" requires local git. Use the Terminal tab (studio-shell) to run git commands in the hosted runtime.`,
      mode: 'github-api',
    }, { status: 422 });
  }

  try {
    if (action === 'commit') {
      const msg = (body.message ?? '').trim();
      if (!msg) return safeError('commit message required', 400);

      // Stage specified files or all changes
      if (body.files?.length) {
        for (const f of body.files) {
          git(`add -- ${f}`);
        }
      } else {
        git('add -A');
      }

      // Check if there's anything to commit
      const staged = git('diff --cached --name-only');
      if (!staged.trim()) {
        return NextResponse.json({ ok: false, message: 'Nothing to commit — working tree clean' });
      }

      git(`commit -m ${JSON.stringify(msg)} --author="Admin Studio <admin@${PLATFORM_DEFAULTS.canonicalDomain}>"`);
      const hash = git('rev-parse --short HEAD');
      return NextResponse.json({ ok: true, hash, message: msg });
    }

    if (action === 'push') {
      const branch = git('rev-parse --abbrev-ref HEAD');

      // Block direct push to main/master — production deploys go through
      // GitHub Actions on PR merge, not browser-triggered git push.
      if (branch === 'main' || branch === 'master') {
        return NextResponse.json({
          ok: false,
          error: `Direct push to "${branch}" is blocked. Create a feature branch, then open a PR to merge.`,
          blocked: true,
        }, { status: 403 });
      }

      // Require typed confirmation for all pushes — prevents accidental or
      // AI-triggered pushes without explicit human intent.
      const confirm = requireTypedConfirmation(body.confirmation, 'git_push');
      if (!confirm.ok) {
        return NextResponse.json(
          { ok: false, error: `Type "${confirm.required}" to confirm push to ${branch}`, requiresConfirmation: true, required: confirm.required },
          { status: 422 },
        );
      }

      const ghToken = process.env.GITHUB_TOKEN ?? '';
      if (ghToken) {
        try {
          git(`remote set-url origin https://${ghToken}@github.com/elevate-for-humanity/Elevate-lms.git`);
        } catch { /* non-fatal */ }
      }
      const out = git(`push origin ${branch}`, { timeout: 30000 });
      return NextResponse.json({ ok: true, branch, output: out });
    }

    if (action === 'pull') {
      const out = git('pull --rebase', { timeout: 30000 });
      return NextResponse.json({ ok: true, output: out });
    }

    if (action === 'checkout') {
      const branch = (body.branch ?? '').trim();
      if (!branch) return safeError('branch name required', 400);
      // Create if doesn't exist
      try {
        git(`checkout ${branch}`);
      } catch {
        git(`checkout -b ${branch}`);
      }
      return NextResponse.json({ ok: true, branch });
    }

    if (action === 'stash') {
      git('stash');
      return NextResponse.json({ ok: true });
    }

    if (action === 'stash-pop') {
      git('stash pop');
      return NextResponse.json({ ok: true });
    }

    return safeError(`Unknown action: ${action}`, 400);
  } catch (err) {
    logger.error('[devstudio/git] POST failed', undefined, { action, err });
    return safeInternalError(err, 'Git operation failed');
  }
}
