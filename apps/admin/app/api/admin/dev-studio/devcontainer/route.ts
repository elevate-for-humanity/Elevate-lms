import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import {
  ensureDevStudioSecrets,
  getGitHubHeaders,
  getGitHubToken,
  githubApiErrorMessage,
} from '@/lib/devstudio/github-token';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_REPO = 'elevate-for-humanity/Elevate-lms';
const DEFAULT_BRANCH = 'main';
const GH_API = 'https://api.github.com';
const DEVCONTAINER_PATH = '.devcontainer/devcontainer.json';
const MAX_CONTENT_BYTES = 64 * 1024;

function getRepo() {
  return (process.env.GITHUB_REPO || DEFAULT_REPO).trim() || DEFAULT_REPO;
}

function getBranch() {
  return (process.env.GITHUB_BRANCH || process.env.BRANCH || DEFAULT_BRANCH).trim() || DEFAULT_BRANCH;
}

function encodePath(path: string) {
  return encodeURIComponent(path).replace(/%2F/g, '/');
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

function parseJsonc(content: string) {
  return JSON.parse(stripJsonCommentsAndTrailingCommas(content));
}

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  try {
    await ensureDevStudioSecrets();
    const token = await getGitHubToken();
    if (!token) return safeError('GITHUB_TOKEN is required for the production DevContainer control plane', 503);

    const response = await fetch(
      `${GH_API}/repos/${getRepo()}/contents/${encodePath(DEVCONTAINER_PATH)}?ref=${encodeURIComponent(getBranch())}`,
      { headers: await getGitHubHeaders(), cache: 'no-store' },
    );

    if (!response.ok) return safeError(githubApiErrorMessage(response.status), response.status);

    const data = await response.json();
    const raw = Buffer.from(data.content, 'base64').toString('utf-8');
    const parsed = parseJsonc(raw);

    return NextResponse.json({
      raw,
      parsed,
      sha: data.sha,
      source: 'github',
      writable: true,
      mode: 'github-only',
      repo: getRepo(),
      branch: getBranch(),
      capabilities: {
        githubConfigured: true,
        localWritable: false,
        canCommit: true,
      },
    });
  } catch (error) {
    return safeInternalError(error, 'Failed to read devcontainer.json');
  }
}

export async function PUT(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  try {
    await ensureDevStudioSecrets();
    if (!(await getGitHubToken())) {
      return safeError('GITHUB_TOKEN is required to update devcontainer.json', 503);
    }

    const body = await req.json().catch(() => null);
    const content = body?.content;
    const sha = body?.sha;
    const message = body?.message;

    if (typeof content !== 'string' || !content.trim()) return safeError('content is required', 400);
    if (typeof sha !== 'string' || !sha.trim()) return safeError('sha is required; reload before saving', 400);
    if (Buffer.byteLength(content, 'utf-8') > MAX_CONTENT_BYTES) {
      return safeError(`content exceeds maximum size of ${MAX_CONTENT_BYTES / 1024} KB`, 413);
    }

    try {
      parseJsonc(content);
    } catch {
      return safeError('devcontainer.json is not valid JSON/JSONC', 400);
    }

    const response = await fetch(
      `${GH_API}/repos/${getRepo()}/contents/${encodePath(DEVCONTAINER_PATH)}`,
      {
        method: 'PUT',
        headers: await getGitHubHeaders(),
        body: JSON.stringify({
          message: typeof message === 'string' && message.trim()
            ? message.trim()
            : 'chore: update devcontainer.json via Admin Dev Studio',
          content: Buffer.from(content, 'utf-8').toString('base64'),
          sha,
          branch: getBranch(),
        }),
      },
    );

    if (!response.ok) {
      if (response.status === 409) return safeError('devcontainer.json changed upstream; reload before saving', 409);
      return safeError(githubApiErrorMessage(response.status), response.status);
    }

    const result = await response.json();
    return NextResponse.json({
      ok: true,
      sha: result.content?.sha,
      commit: result.commit?.html_url,
      repo: getRepo(),
      branch: getBranch(),
    });
  } catch (error) {
    return safeInternalError(error, 'Failed to update devcontainer.json');
  }
}
