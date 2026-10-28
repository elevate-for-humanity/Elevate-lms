import { createHash } from 'crypto';
import { readdir, readFile, stat } from 'fs/promises';
import path from 'path';
import type { SupabaseClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.turbo',
  'coverage',
  '.pnpm-store',
]);

const INDEX_ROOTS = ['app', 'apps', 'components', 'lib', 'scripts', 'supabase/migrations'];

const EXT_LANG: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  sql: 'sql',
  md: 'markdown',
  json: 'json',
};

function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}

function extractSymbols(content: string, language: string): string[] {
  const symbols: string[] = [];
  if (language === 'typescript' || language === 'javascript') {
    const patterns = [
      /export\s+(?:async\s+)?function\s+(\w+)/g,
      /export\s+const\s+(\w+)/g,
      /export\s+default\s+function\s+(\w+)?/g,
      /export\s+class\s+(\w+)/g,
    ];
    for (const pattern of patterns) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(content)) !== null) {
        if (match[1]) symbols.push(match[1]);
      }
    }
  }
  return [...new Set(symbols)].slice(0, 40);
}

async function walkFiles(dir: string, acc: string[] = []): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return acc;
  }

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      await walkFiles(full, acc);
      continue;
    }
    if (!entry.isFile()) continue;
    const rel = path.relative(ROOT, full).replace(/\\/g, '/');
    acc.push(rel);
    if (acc.length >= 500) return acc;
  }
  return acc;
}

export interface RepoIndexResult {
  indexed: number;
  skipped: number;
  paths: string[];
}

/** Production images contain compiled bundles, not a complete repository checkout.
 * Index authoritative GitHub path metadata at one pinned commit. Content/symbol
 * indexing remains explicit for local source workflows using `roots`.
 */
async function indexGitHubRepository(
  db: SupabaseClient,
  maxFiles: number,
): Promise<RepoIndexResult> {
  const { getGitHubHeaders } = await import('@/lib/devstudio/github-token');
  const { studioRepository } = await import('@/lib/devstudio/repository');
  const base = `https://api.github.com/repos/${studioRepository()}`;
  const headers = await getGitHubHeaders();
  async function read(endpoint: string) {
    const response = await fetch(base + endpoint, {
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new Error(`Repository metadata read failed (HTTP ${response.status})`);
    return response.json();
  }
  const ref = await read('/git/ref/heads/main');
  const commitSha = ref.object?.sha;
  if (typeof commitSha !== 'string' || !/^[a-f0-9]{40}$/.test(commitSha))
    throw new Error('Repository main revision is invalid');
  const commit = await read(`/git/commits/${commitSha}`);
  const treeSha = commit.tree?.sha;
  if (typeof treeSha !== 'string' || !/^[a-f0-9]{40}$/.test(treeSha))
    throw new Error('Repository tree revision is invalid');
  const tree = await read(`/git/trees/${treeSha}?recursive=1`);
  if (tree.truncated || !Array.isArray(tree.tree))
    throw new Error('Repository tree is incomplete; indexing was not performed');
  const files = (tree.tree as Array<{ type: string; path: string; sha: string; size?: number }>)
    .filter(
      (file) =>
        file.type === 'blob' &&
        typeof file.path === 'string' &&
        INDEX_ROOTS.some((root) => file.path.startsWith(root + '/')) &&
        !file.path.split('/').some((part) => SKIP_DIRS.has(part) || part.startsWith('.env')),
    )
    .slice(0, maxFiles);
  if (!files.length) throw new Error('Repository index source contains no matching files');
  const timestamp = new Date().toISOString();
  const rows = files.map((file) => {
    const ext = file.path.split('.').pop()?.toLowerCase() ?? '';
    return {
      repo_path: file.path,
      file_path: file.path,
      file_hash: file.sha,
      file_type: EXT_LANG[ext] ?? ext,
      last_indexed_at: timestamp,
      updated_at: timestamp,
      metadata: {
        source: 'github-tree',
        commit_sha: commitSha,
        size: file.size ?? null,
        content_indexed: false,
        file_hash_algorithm: 'git-blob-sha',
      },
    };
  });
  for (let offset = 0; offset < rows.length; offset += 100) {
    const { error } = await db
      .from('ai_repo_index')
      .upsert(rows.slice(offset, offset + 100), { onConflict: 'repo_path' });
    if (error) throw new Error(`Repository index write failed: ${error.code ?? 'unknown'}`);
  }
  return { indexed: rows.length, skipped: 0, paths: files.map((file) => file.path) };
}

export async function indexRepository(
  db: SupabaseClient,
  options?: { roots?: string[]; maxFiles?: number },
): Promise<RepoIndexResult> {
  const requested = options?.maxFiles ?? 400;
  if (!Number.isInteger(requested) || requested < 1 || requested > 2000)
    throw new Error('Repository index file limit must be an integer between 1 and 2000');
  if (!options?.roots) return indexGitHubRepository(db, requested);
  const roots = options.roots;
  const maxFiles = options?.maxFiles ?? 400;
  const paths: string[] = [];

  for (const root of roots) {
    const abs = path.join(ROOT, root);
    try {
      const st = await stat(abs);
      if (!st.isDirectory()) continue;
    } catch {
      continue;
    }
    await walkFiles(abs, paths);
    if (paths.length >= maxFiles) break;
  }

  const limited = paths.slice(0, maxFiles);
  let indexed = 0;
  let skipped = 0;

  for (const repoPath of limited) {
    const abs = path.join(ROOT, repoPath);
    const ext = repoPath.split('.').pop()?.toLowerCase() ?? '';
    const language = EXT_LANG[ext] ?? ext;

    let content: string;
    try {
      const st = await stat(abs);
      if (st.size > 256_000) {
        skipped += 1;
        continue;
      }
      content = await readFile(abs, 'utf8');
    } catch {
      skipped += 1;
      continue;
    }

    const symbols = extractSymbols(content, language);
    const fileHash = hashContent(content);

    const { error } = await db.from('ai_repo_index').upsert(
      {
        repo_path: repoPath,
        file_path: repoPath,
        file_hash: fileHash,
        file_type: language,
        last_indexed_at: new Date().toISOString(),
        metadata: { size: content.length, symbols },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'repo_path' },
    );

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') {
        throw new Error('ai_repo_index table not found — apply migration 20260708000005');
      }
      throw new Error(`Repository index write failed: ${error.code ?? 'unknown'}`);
    } else {
      indexed += 1;
    }
  }

  return { indexed, skipped, paths: limited };
}

export async function searchRepoIndex(
  db: SupabaseClient,
  query: string,
  limit = 30,
): Promise<Array<{ repo_path: string; language: string | null; symbols: unknown }>> {
  const q = query.trim().toLowerCase();
  if (!q) {
    const { data, error } = await db
      .from('ai_repo_index')
      .select('repo_path:file_path, language:file_type, symbols:metadata->symbols')
      .order('last_indexed_at', { ascending: false })
      .limit(limit);
    if (error) throw new Error('Repository index unavailable');
    return data ?? [];
  }

  const { data, error } = await db
    .from('ai_repo_index')
    .select('repo_path:file_path, language:file_type, symbols:metadata->symbols')
    .ilike('file_path', `%${q}%`)
    .limit(limit);

  if (error) throw new Error('Repository index unavailable');
  return data ?? [];
}
