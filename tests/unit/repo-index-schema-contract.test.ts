import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { beforeEach, expect, it, vi } from 'vitest';
import { indexRepository, searchRepoIndex } from '@/lib/devstudio/os/repo-indexer';
const saved = vi.fn();
beforeEach(() => saved.mockReset());
it('writes the required file identity and stores symbols in existing metadata', async () => {
  const db: any = { from: () => ({ upsert: async (payload: unknown, options: unknown) => { saved(payload, options); return { error: null }; } }) };
  const fixtureRoot = await mkdtemp(path.join(process.cwd(), '.repo-index-contract-'));
  try {
    await writeFile(path.join(fixtureRoot, 'module.ts'), 'export const example = 1;\n');
    const result = await indexRepository(db, {
      roots: [path.relative(process.cwd(), fixtureRoot)],
      maxFiles: 1,
    });
    expect(result.indexed).toBe(1);
    const [payload, options] = saved.mock.calls[0];
    expect(payload.file_path).toBe(payload.repo_path);
    expect(payload.repo_path).toBe(path.relative(process.cwd(), path.join(fixtureRoot, 'module.ts')).replaceAll(path.sep, '/'));
    expect(payload.file_type).toBe('typescript');
    expect(payload.metadata.symbols).toEqual(['example']);
    expect(payload).not.toHaveProperty('language');
    expect(payload).not.toHaveProperty('symbols');
    expect(options).toEqual({ onConflict: 'repo_path' });
  } finally {
    await rm(fixtureRoot, { recursive: true, force: true });
  }
});
it('surfaces a failed index read instead of presenting a false empty index', async () => {
  const q: any = { select: () => q, ilike: () => q, limit: async () => ({ data: null, error: { code: '42703' } }) };
  await expect(searchRepoIndex({ from: () => q } as any, 'lesson')).rejects.toThrow('Repository index unavailable');
});
