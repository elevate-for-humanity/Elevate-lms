/**
 * /api/devstudio/devcontainer
 *
 * Unified DevContainer control plane:
 * - github-only  (recommended for production): all reads/writes via GitHub API
 * - local-only   (dev): reads/writes from local checkout
 * - auto         (fallback): github -> local -> github-readonly
 *
 * Env:
 * - DEVSTUDIO_DEVCONTAINER_MODE=github-only|local-only|auto
 * - GITHUB_TOKEN (required for github-only and GitHub writes)
 * - GITHUB_REPO  (optional, defaults to elevate-for-humanity/Elevate-lms)
 * - GITHUB_BRANCH (optional, defaults to main)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { access, mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import {
  ensureDevStudioSecrets,
  getGitHubHeaders,
  getGitHubToken,
  githubApiErrorMessage,
} from '@/lib/devstudio/github-token';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { hydrateProcessEnv } from '@/lib/secrets';

const DEFAULT_REPO = 'elevate-for-humanity/Elevate-lms';
const DEFAULT_BRANCH = 'main';
const GH_API = 'https://api.github.com';
const DEVCONTAINER_GH = '.devcontainer/devcontainer.json';
const MAX_CONTENT_BYTES = 64 * 1024; // 64 KB

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type DevcontainerMode = 'auto' | 'github-only' | 'local-only';

function getRepo(): string {
  const repo = (process.env.GITHUB_REPO ?? DEFAULT_REPO).trim();
  return repo || DEFAULT_REPO;
}

function getBranch(): string {
  const branch = (process.env.GITHUB_BRANCH ?? process.env.BRANCH ?? DEFAULT_BRANCH).trim();
  return branch || DEFAULT_BRANCH;
}

function getDevcontainerMode(): DevcontainerMode {
  const raw = (process.env.DEVSTUDIO_DEVCONTAINER_MODE ?? 'auto').toLowerCase().trim();
  if (raw === 'github' || raw === 'github-only' || raw === 'remote') return 'github-only';
  if (raw === 'local' || raw === 'local-only') return 'local-only';
  return 'auto';
}

async function hasGitHubToken(): Promise<boolean> {
  return (await getGitHubToken()) !== null;
}

function stripJsonCommentsAndTrailingCommas(input: string): string {
  let out = '';
  let inString = false;
  let quote = '';
  let i = 0;

  while (i < input.length) {
    const ch = input[i];
    const next = input[i + 1];

    if (inString) {
      out += ch;
      if (ch === '\\') {
        if (i + 1 < input.length) {
          out += input[i + 1];
          i += 2;
          continue;
        }
      } else if (ch === quote) {
        inString = false;
        quote = '';
      }
      i += 1;
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = true;
      quote = ch;
      out += ch;
      i += 1;
      continue;
    }

    if (ch === '/' && next === '/') {
      i += 2;
      while (i < input.length && input[i] !== '\n') i += 1;
      continue;
    }

    if (ch === '/' && next === '*') {
      i += 2;
      while (i + 1 < input.length && !(input[i] === '*' && input[i + 1] === '/')) i += 1;
      i += 2;
      continue;
    }

    out += ch;
    i += 1;
  }

  return out.replace(/,\s*([}\]])/g, '$1');
}

function parseJsonc(content: string): unknown {
  return JSON.parse(stripJsonCommentsAndTrailingCommas(content));
}

function computeSha(content: string): string {
  return createHash('sha1').update(content, 'utf8').digest('hex');
}

async function resolveLocalDevcontainerPath(): Promise<string> {
  const repoRoot = process.env.ELEVATE_REPO_ROOT?.trim();
  const candidates = [
    ...(repoRoot ? [path.resolve(repoRoot, DEVCONTAINER_GH)] : []),
    path.resolve(process.cwd(), DEVCONTAINER_GH),
    path.resolve(process.cwd(), '..', '..', DEVCONTAINER_GH),
    '/workspace/.devcontainer/devcontainer.json',
  ];

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // keep scanning
    }
  }

  return candidates[0];
}

async function readLocalDevcontainer() {
  const filePath = await resolveLocalDevcontainerPath();
  const raw = await readFile(filePath, 'utf8');
  const parsed = parseJsonc(raw);
  return { raw, parsed, sha: computeSha(raw), filePath };
}

async function writeLocalDevcontainer(content: string, expectedSha: string) {
  const current = await readLocalDevcontainer();

  if (expectedSha !== current.sha) {
    return { conflict: true as const, currentSha: current.sha };
  }

  const dir = path.dirname(current.filePath);
  await mkdir(dir, { recursive: true });
  await writeFile(current.filePath, content, 'utf8');

  return { conflict: false as const, sha: computeSha(content) };
}

async function readGitHubDevcontainer(authenticated: boolean) {
  const encodedPath = encodeURIComponent(DEVCONTAINER_GH).replace(/%2F/g, '/');
  const res = await fetch(`${GH_API}/repos/${getRepo()}/contents/${encodedPath}?ref=${getBranch()}`, {
    headers: authenticated
      ? await getGitHubHeaders()
      : {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
    cache: 'no-store',
  });

  if (!res.ok) return { ok: false as const, status: res.status };

  const data = await res.json();
  const raw = Buffer.from(data.content, 'base64').toString('utf-8');
  const parsed = parseJsonc(raw);
  return { ok: true as const, raw, parsed, sha: data.sha };
}

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  try {
    await ensureDevStudioSecrets();
    // Load platform_secrets (GITHUB_TOKEN, etc.) into process.env
    await hydrateProcessEnv().catch(() => {});

    const mode = getDevcontainerMode();
    const githubConfigured = await hasGitHubToken();
    const repo = getRepo();
    const branch = getBranch();

    if (mode === 'github-only' && !githubConfigured) {
      return safeError('DevContainer is configured for github-only mode but GITHUB_TOKEN is missing', 503);
    }

    if (mode === 'local-only') {
      try {
        const local = await readLocalDevcontainer();
        return NextResponse.json({
          raw: local.raw,
          parsed: local.parsed,
          sha: local.sha,
          source: 'local',
          writable: true,
          mode,
          repo,
          branch,
          capabilities: {
            githubConfigured,
            localWritable: true,
            canCommit: false,
          },
        });
      } catch {
        return safeError('DevContainer is configured for local-only mode but local file is unavailable', 503);
      }
    }

    if (githubConfigured) {
      const gh = await readGitHubDevcontainer(true);
      if (gh.ok) {
        return NextResponse.json({
          raw: gh.raw,
          parsed: gh.parsed,
          sha: gh.sha,
          source: 'github',
          writable: true,
          mode,
          repo,
          branch,
          capabilities: {
            githubConfigured,
            localWritable: false,
            canCommit: true,
          },
        });
      }

      // In auto mode, fall back to local if GitHub fails
      if (mode === 'auto') {
        try {
          const local = await readLocalDevcontainer();
          return NextResponse.json({
            raw: local.raw,
            parsed: local.parsed,
            sha: local.sha,
            source: 'local',
            writable: true,
            mode,
            repo,
            branch,
            capabilities: {
              githubConfigured,
              localWritable: true,
              canCommit: false,
            },
          });
        } catch {
          // both GitHub and local failed
        }
      }

      if (gh.status === 404) return safeError(githubApiErrorMessage(404), 404);
      return safeError(githubApiErrorMessage(gh.status), gh.status >= 400 && gh.status < 600 ? gh.status : 502);
    }

    try {
      const local = await readLocalDevcontainer();
      return NextResponse.json({
        raw: local.raw,
        parsed: local.parsed,
        sha: local.sha,
        source: 'local',
        writable: true,
        mode,
        repo,
        branch,
        capabilities: {
          githubConfigured,
          localWritable: true,
          canCommit: false,
        },
      });
    } catch {
      const gh = await readGitHubDevcontainer(false);
      if (!gh.ok) {
        if (gh.status === 404) return safeError('devcontainer.json not found in repo', 404);
        return safeError('Devcontainer unavailable: set GITHUB_TOKEN or ensure repo is publicly readable', 503);
      }

      return NextResponse.json({
        raw: gh.raw,
        parsed: gh.parsed,
        sha: gh.sha,
        source: 'github-readonly',
        writable: false,
        mode,
        repo,
        branch,
        capabilities: {
          githubConfigured,
          localWritable: false,
          canCommit: false,
        },
      });
    }
  } catch (err) {
    return safeInternalError(err, 'Failed to read devcontainer.json');
  }
}

export async function PUT(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  try {
    await ensureDevStudioSecrets();
    await hydrateProcessEnv().catch(() => {});

    const mode = getDevcontainerMode();
    const body = await request.json();
    const { content, sha, message } = body as { content: string; sha: string; message?: string };

    if (!content || typeof content !== 'string') return safeError('content is required', 400);
    if (!sha) return safeError('sha is required (fetch the file first to get its sha)', 400);
    if (Buffer.byteLength(content, 'utf-8') > MAX_CONTENT_BYTES) {
      return safeError(`content exceeds maximum size of ${MAX_CONTENT_BYTES / 1024} KB`, 413);
    }

    parseJsonc(content);

    if (mode === 'github-only' && !(await hasGitHubToken())) {
      return safeError('Save requires GITHUB_TOKEN (github-only mode)', 503);
    }

    if (!(await hasGitHubToken())) {
      if (mode !== 'local-only') {
        return safeError(
          'Save requires GITHUB_TOKEN. Production admin must use DEVSTUDIO_DEVCONTAINER_MODE=github-only.',
          503,
        );
      }
      const result = await writeLocalDevcontainer(content, sha);
      if (result.conflict) return safeError('sha mismatch; reload before saving', 409);

      return NextResponse.json({
        ok: true,
        sha: result.sha,
        commit: 'local write (dev only — local-only mode)',
      });
    }

    const encoded = Buffer.from(content, 'utf-8').toString('base64');
    const encodedPath = encodeURIComponent(DEVCONTAINER_GH).replace(/%2F/g, '/');

    const res = await fetch(`${GH_API}/repos/${getRepo()}/contents/${encodedPath}`, {
      method: 'PUT',
      headers: await getGitHubHeaders(),
      body: JSON.stringify({
        message: message ?? 'chore: update devcontainer.json via Dev Studio',
        content: encoded,
        sha,
        branch: getBranch(),
      }),
    });

    if (!res.ok) {
      await res.json().catch(() => ({}));
      return safeError(githubApiErrorMessage(res.status), res.status);
    }

    const result = await res.json();
    return NextResponse.json({
      ok: true,
      sha: result.content?.sha,
      commit: result.commit?.html_url,
    });
  } catch (err) {
    if (err instanceof SyntaxError) return safeError('Invalid JSON in request body', 400);
    return safeInternalError(err, 'Failed to write devcontainer.json');
  }
}
