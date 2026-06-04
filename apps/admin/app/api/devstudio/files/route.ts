/**
 * /api/devstudio/files
 *
 * Read and write repo files via the GitHub Contents API.
 * All reads/writes target the `main` branch. Admin-only.
 *
 * GET  ?path=app/page.tsx          → file content + sha
 * GET  ?path=app&tree=1            → directory listing (2 levels deep)
 * GET  (no path)                   → repo root tree
 * PUT  { path, content, sha, message? } → commit updated file to main
 * POST { path, content?, message? }     → create new file on main
 * DELETE { path, sha, message? }        → delete file via commit
 *
 * Security:
 *  - Requires admin role on every request.
 *  - .env* files and node_modules are blocked.
 *  - Uses GITHUB_TOKEN from environment (Northflank/runtime env or local .env.local).
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const REPO   = 'elevateforhumanity/Elevate-lms';
const BRANCH = 'main';
const GH_API = 'https://api.github.com';
const MAX_FILE_BYTES = 512 * 1024; // 512 KB

const BLOCKED_PATTERNS = [/^\.env/, /node_modules/, /\.git\//, /\.next\//];

function isBlocked(filePath: string): boolean {
  // Reject path traversal sequences before pattern matching
  if (filePath.includes('..')) return true;
  return BLOCKED_PATTERNS.some((p) => p.test(filePath));
}

// Cache the token in-process for 5 min to avoid a DB round-trip on every request.
let _ghTokenCache: { token: string; expiresAt: number } | null = null;

async function getGhToken(): Promise<string> {
  // 1. process.env (Northflank/runtime env or local .env.local)
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;

  // 2. In-process cache
  if (_ghTokenCache && _ghTokenCache.expiresAt > Date.now()) return _ghTokenCache.token;

  // 3. platform_secrets table (set via Admin → Dev Studio → Secrets)
  try {
    const db = await requireAdminClient();
    const { data } = await db
      .from('platform_secrets')
      .select('value_enc')
      .eq('key', 'GITHUB_TOKEN')
      .single();
    const token = data?.value_enc;
    if (token && token.length > 10) {
      _ghTokenCache = { token, expiresAt: Date.now() + 5 * 60 * 1000 };
      return token;
    }
  } catch { /* fall through */ }

  throw new Error('GITHUB_TOKEN is not configured. Add it in Dev Studio → Secrets tab.');
}

async function ghHeaders(): Promise<HeadersInit> {
  const token = await getGhToken();
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
}

interface GHEntry {
  name: string;
  path: string;
  type: 'file' | 'dir' | 'symlink' | 'submodule';
  size: number;
  sha: string;
}

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: TreeNode[];
}

async function fetchTree(dirPath: string, depth: number): Promise<TreeNode[]> {
  const encodedPath = dirPath ? encodeURIComponent(dirPath).replace(/%2F/g, '/') : '';
  const url = `${GH_API}/repos/${REPO}/contents/${encodedPath}?ref=${BRANCH}`;
  const res = await fetch(url, { headers: await ghHeaders() });
  if (!res.ok) return [];

  const entries: GHEntry[] = await res.json();
  const nodes: TreeNode[] = [];

  for (const entry of entries) {
    if (isBlocked(entry.path)) continue;
    if (entry.name.startsWith('.') && entry.name !== '.devcontainer') continue;

    if (entry.type === 'dir') {
      const children = depth > 0 ? await fetchTree(entry.path, depth - 1) : [];
      nodes.push({ name: entry.name, path: entry.path, type: 'directory', children });
    } else if (entry.type === 'file') {
      nodes.push({ name: entry.name, path: entry.path, type: 'file' });
    }
  }

  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

// ── GET ──────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { searchParams } = request.nextUrl;
  const filePath = searchParams.get('path') ?? '';
  const tree = searchParams.get('tree') === '1';

  try {
    if (!filePath) {
      const nodes = await fetchTree('', 2);
      return NextResponse.json({ tree: nodes });
    }

    if (isBlocked(filePath)) return safeError('Path not allowed', 403);

    const encodedPath = encodeURIComponent(filePath).replace(/%2F/g, '/');
    const url = `${GH_API}/repos/${REPO}/contents/${encodedPath}?ref=${BRANCH}`;
    const res = await fetch(url, { headers: await ghHeaders() });

    if (!res.ok) {
      if (res.status === 404) return safeError('File not found', 404);
      return safeError('GitHub API error', res.status);
    }

    const data = await res.json();

    // Directory
    if (Array.isArray(data) || tree) {
      const nodes = await fetchTree(filePath, 2);
      return NextResponse.json({ path: filePath, type: 'directory', children: nodes });
    }

    // File
    if (data.size > MAX_FILE_BYTES) {
      return safeError(`File exceeds ${MAX_FILE_BYTES / 1024} KB read limit`, 413);
    }

    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    const ext = filePath.split('.').pop() ?? '';
    return NextResponse.json({ path: filePath, content, size: data.size, ext, sha: data.sha });
  } catch (err) {
    return safeInternalError(err, 'Failed to read file');
  }
}

// ── PUT (update existing file) ────────────────────────────────────────────────

export async function PUT(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  if (!body?.path || typeof body.content !== 'string') {
    return safeError('path and content are required', 400);
  }
  if (!body.sha) {
    return safeError('sha is required to update a file (fetch the file first)', 400);
  }
  if (isBlocked(body.path)) return safeError('Path not allowed', 403);

  if (Buffer.byteLength(body.content, 'utf-8') > MAX_FILE_BYTES) {
    return safeError(`Content exceeds ${MAX_FILE_BYTES / 1024} KB write limit`, 413);
  }

  const message = body.message ?? `chore: update ${body.path} via Dev Studio`;
  const encoded = Buffer.from(body.content, 'utf-8').toString('base64');
  const encodedPath = encodeURIComponent(body.path).replace(/%2F/g, '/');

  try {
    const res = await fetch(`${GH_API}/repos/${REPO}/contents/${encodedPath}`, {
      method: 'PUT',
      headers: await ghHeaders(),
      body: JSON.stringify({ message, content: encoded, sha: body.sha, branch: BRANCH }),
    });

    if (!res.ok) {
      await res.json().catch(() => ({})); // consume body; detail logged server-side only
      return safeError('GitHub API error', res.status);
    }

    const result = await res.json();
    return NextResponse.json({
      ok: true,
      path: body.path,
      sha: result.content?.sha,
      commit: result.commit?.html_url,
    });
  } catch (err) {
    return safeInternalError(err, 'Failed to commit file');
  }
}

// ── POST (create new file) ────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  if (!body?.path) return safeError('path is required', 400);
  if (isBlocked(body.path)) return safeError('Path not allowed', 403);

  const message = body.message ?? `chore: create ${body.path} via Dev Studio`;
  const encoded = Buffer.from(body.content ?? '', 'utf-8').toString('base64');
  const encodedPath = encodeURIComponent(body.path).replace(/%2F/g, '/');

  try {
    // No sha = create; GitHub returns 422 if file already exists
    const res = await fetch(`${GH_API}/repos/${REPO}/contents/${encodedPath}`, {
      method: 'PUT',
      headers: await ghHeaders(),
      body: JSON.stringify({ message, content: encoded, branch: BRANCH }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (res.status === 422) return safeError('File already exists', 409);
      return safeError('GitHub API error', res.status);
    }

    const result = await res.json();
    return NextResponse.json({
      ok: true,
      path: body.path,
      sha: result.content?.sha,
      commit: result.commit?.html_url,
    });
  } catch (err) {
    return safeInternalError(err, 'Failed to create file');
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  if (!body?.path) return safeError('path is required', 400);
  if (!body?.sha)  return safeError('sha is required to delete a file', 400);
  if (isBlocked(body.path)) return safeError('Path not allowed', 403);

  const message = body.message ?? `chore: delete ${body.path} via Dev Studio`;
  const encodedPath = encodeURIComponent(body.path).replace(/%2F/g, '/');

  try {
    const res = await fetch(`${GH_API}/repos/${REPO}/contents/${encodedPath}`, {
      method: 'DELETE',
      headers: await ghHeaders(),
      body: JSON.stringify({ message, sha: body.sha, branch: BRANCH }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (res.status === 404) return safeError('File not found', 404);
      return safeError('GitHub API error', res.status);
    }

    return NextResponse.json({ ok: true, path: body.path });
  } catch (err) {
    return safeInternalError(err, 'Failed to delete file');
  }
}
