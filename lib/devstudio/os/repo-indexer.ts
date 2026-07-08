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

export async function indexRepository(
  db: SupabaseClient,
  options?: { roots?: string[]; maxFiles?: number },
): Promise<RepoIndexResult> {
  const roots = options?.roots ?? INDEX_ROOTS;
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
        file_hash: fileHash,
        language,
        symbols,
        last_indexed_at: new Date().toISOString(),
        metadata: { size: content.length },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'repo_path' },
    );

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') {
        throw new Error('ai_repo_index table not found — apply migration 20260708000005');
      }
      skipped += 1;
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
      .select('repo_path, language, symbols')
      .order('last_indexed_at', { ascending: false })
      .limit(limit);
    if (error?.code === '42P01' || error?.code === 'PGRST205') return [];
    return data ?? [];
  }

  const { data, error } = await db
    .from('ai_repo_index')
    .select('repo_path, language, symbols')
    .ilike('repo_path', `%${q}%`)
    .limit(limit);

  if (error?.code === '42P01' || error?.code === 'PGRST205') return [];
  return data ?? [];
}
