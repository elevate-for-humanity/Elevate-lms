import { parseJsonc } from '@/lib/devstudio/jsonc.mjs';
import { studioRepository } from '@/lib/devstudio/repository';
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
  return studioRepository();
}

function getBranch() {
  return (process.env.GITHUB_BRANCH || process.env.BRANCH || DEFAULT_BRANCH).trim() || DEFAULT_BRANCH;
}

function encodePath(path: string) {
  return encodeURIComponent(path).replace(/%2F/g, '/');
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
        canProvisionWorkspace: false,
        canStartInteractiveSession: false,
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
