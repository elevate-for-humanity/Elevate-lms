/**
 * /api/admin/dev-studio/files
 * Read and write repo files via the GitHub Contents API.
 * Admin-only. Targets the full Elevate-lms repository.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { getGitHubHeaders } from '@/lib/devstudio/github-token';
import { requireTypedConfirmation } from '@/lib/security/require-confirmation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DEFAULT_REPO = 'elevate-for-humanity/Elevate-lms';
const DEFAULT_BRANCH = 'main';
const GH_API = 'https://api.github.com';
const MAX_FILE_BYTES = 512 * 1024;
const BLOCKED_PATTERNS = [/^\.env/, /node_modules/, /\.git\//, /\.next\//];

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

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/{2,}/g, '/').trim();
}

function isBlocked(filePath: string): boolean {
  if (filePath.includes('..')) return true;
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(filePath));
}

async function ghHeaders(): Promise<HeadersInit> {
  return getGitHubHeaders();
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
  const urlPath = dirPath ? encodePath(dirPath) : '';
  const response = await fetch(`${GH_API}/repos/${getRepo()}/contents/${urlPath}?ref=${getBranch()}`, {
    headers: await ghHeaders(),
    cache: 'no-store',
  });
  if (!response.ok) return [];

  const entries: GHEntry[] = await response.json();
  const nodes: TreeNode[] = [];
  for (const entry of entries) {
    if (isBlocked(entry.path)) continue;
    if (entry.name.startsWith('.') && entry.name !== '.devcontainer' && entry.name !== '.github') continue;
    if (entry.type === 'dir') {
      const children = depth > 0 ? await fetchTree(entry.path, depth - 1) : [];
      nodes.push({ name: entry.name, path: entry.path, type: 'directory', children });
    } else if (entry.type === 'file') {
      nodes.push({ name: entry.name, path: entry.path, type: 'file' });
    }
  }
  return nodes.sort((a, b) => a.type !== b.type ? (a.type === 'directory' ? -1 : 1) : a.name.localeCompare(b.name));
}

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  const filePath = request.nextUrl.searchParams.get('path') ?? '';
  const tree = request.nextUrl.searchParams.get('tree') === '1';
  try {
    if (!filePath) {
      const nodes = await fetchTree('', 2);
      return NextResponse.json({ tree: nodes, repo: getRepo(), branch: getBranch() });
    }
    if (isBlocked(filePath)) return safeError('Path not allowed', 403);

    const response = await fetch(`${GH_API}/repos/${getRepo()}/contents/${encodePath(filePath)}?ref=${getBranch()}`, {
      headers: await ghHeaders(),
      cache: 'no-store',
    });
    if (!response.ok) {
      if (response.status === 404) return safeError('File not found', 404);
      return safeError('GitHub API error', response.status);
    }
    const data = await response.json();
    if (Array.isArray(data) || tree) {
      const nodes = await fetchTree(filePath, 2);
      return NextResponse.json({ path: filePath, type: 'directory', children: nodes, repo: getRepo(), branch: getBranch() });
    }
    if (data.size > MAX_FILE_BYTES) return safeError(`File exceeds ${MAX_FILE_BYTES / 1024} KB read limit`, 413);
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    const ext = filePath.split('.').pop() ?? '';
    return NextResponse.json({ path: filePath, content, size: data.size, ext, sha: data.sha, repo: getRepo(), branch: getBranch() });
  } catch (error) {
    return safeInternalError(error, 'Failed to read file');
  }
}

export async function PUT(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  if (!body?.path || typeof body.content !== 'string') return safeError('path and content are required', 400);
  body.path = normalizePath(String(body.path));
  if (!body.sha) return safeError('sha is required to update a file', 400);
  if (isBlocked(body.path)) return safeError('Path not allowed', 403);
  if (Buffer.byteLength(body.content, 'utf-8') > MAX_FILE_BYTES) return safeError(`Content exceeds ${MAX_FILE_BYTES / 1024} KB write limit`, 413);
  if (getBranch() === 'main') {
    const confirmation = requireTypedConfirmation(body.confirmation, 'git_push');
    if (!confirmation.ok) return NextResponse.json({ error: 'Direct main-branch commit requires typed confirmation.', requiredConfirmation: confirmation.required }, { status: 409 });
  }

  const message = body.message ?? `chore: update ${body.path} via Dev Studio`;
  const encoded = Buffer.from(body.content, 'utf-8').toString('base64');
  try {
    const response = await fetch(`${GH_API}/repos/${getRepo()}/contents/${encodePath(body.path)}`, {
      method: 'PUT',
      headers: await ghHeaders(),
      body: JSON.stringify({ message, content: encoded, sha: body.sha, branch: getBranch() }),
    });
    if (!response.ok) return safeError('GitHub API error', response.status);
    const result = await response.json();
    return NextResponse.json({ ok: true, path: body.path, sha: result.content?.sha, commit: result.commit?.html_url, repo: getRepo(), branch: getBranch() });
  } catch (error) {
    return safeInternalError(error, 'Failed to commit file');
  }
}

interface CreateFileBody { path: string; content: string; message?: string; confirmation?: string }

async function readCreateBody(request: NextRequest): Promise<CreateFileBody | null> {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    const upload = form.get('file');
    if (!upload || typeof upload === 'string' || typeof upload.arrayBuffer !== 'function') return null;
    const filename = 'name' in upload && typeof upload.name === 'string' ? upload.name : 'upload.txt';
    const path = String(form.get('path') || `devstudio-uploads/${filename}`);
    const buffer = Buffer.from(await upload.arrayBuffer());
    return { path, content: buffer.toString('utf-8'), message: String(form.get('message') || `chore: create ${path} via Dev Studio`) };
  }
  const body = await request.json().catch(() => null);
  if (!body) return null;
  return { path: String(body.path ?? ''), content: typeof body.content === 'string' ? body.content : '', message: typeof body.message === 'string' ? body.message : undefined, confirmation: typeof body.confirmation === 'string' ? body.confirmation : undefined };
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  const body = await readCreateBody(request);
  if (!body?.path) return safeError('path is required', 400);
  body.path = normalizePath(body.path);
  if (isBlocked(body.path)) return safeError('Path not allowed', 403);
  if (Buffer.byteLength(body.content, 'utf-8') > MAX_FILE_BYTES) return safeError(`Content exceeds ${MAX_FILE_BYTES / 1024} KB write limit`, 413);
  if (getBranch() === 'main') {
    const confirmation = requireTypedConfirmation(body.confirmation, 'git_push');
    if (!confirmation.ok) return NextResponse.json({ error: 'Direct main-branch commit requires typed confirmation.', requiredConfirmation: confirmation.required }, { status: 409 });
  }

  const message = body.message ?? `chore: create ${body.path} via Dev Studio`;
  const encoded = Buffer.from(body.content, 'utf-8').toString('base64');
  try {
    const response = await fetch(`${GH_API}/repos/${getRepo()}/contents/${encodePath(body.path)}`, {
      method: 'PUT',
      headers: await ghHeaders(),
      body: JSON.stringify({ message, content: encoded, branch: getBranch() }),
    });
    if (!response.ok) {
      if (response.status === 422) return safeError('File already exists', 409);
      return safeError('GitHub API error', response.status);
    }
    const result = await response.json();
    return NextResponse.json({ ok: true, path: body.path, sha: result.content?.sha, commit: result.commit?.html_url, repo: getRepo(), branch: getBranch() });
  } catch (error) {
    return safeInternalError(error, 'Failed to create file');
  }
}

export async function DELETE(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  if (!body?.path) return safeError('path is required', 400);
  if (!body?.sha) return safeError('sha is required to delete a file', 400);
  if (isBlocked(body.path)) return safeError('Path not allowed', 403);
  if (getBranch() === 'main') {
    const confirmation = requireTypedConfirmation(body.confirmation, 'git_push');
    if (!confirmation.ok) return NextResponse.json({ error: 'Direct main-branch deletion requires typed confirmation.', requiredConfirmation: confirmation.required }, { status: 409 });
  }
  const message = body.message ?? `chore: delete ${body.path} via Dev Studio`;
  try {
    const response = await fetch(`${GH_API}/repos/${getRepo()}/contents/${encodePath(body.path)}`, {
      method: 'DELETE',
      headers: await ghHeaders(),
      body: JSON.stringify({ message, sha: body.sha, branch: getBranch() }),
    });
    if (!response.ok) {
      if (response.status === 404) return safeError('File not found', 404);
      return safeError('GitHub API error', response.status);
    }
    return NextResponse.json({ ok: true, path: body.path, repo: getRepo(), branch: getBranch() });
  } catch (error) {
    return safeInternalError(error, 'Failed to delete file');
  }
}
