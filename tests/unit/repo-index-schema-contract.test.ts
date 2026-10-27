import { beforeEach, expect, it, vi } from 'vitest';
import { indexRepository, searchRepoIndex } from '@/lib/devstudio/os/repo-indexer';
const saved = vi.fn();
beforeEach(() => saved.mockReset());
it('writes the required file identity and stores symbols in existing metadata', async () => {
  const db: any = { from: () => ({ upsert: async (payload: unknown, options: unknown) => { saved(payload, options); return { error: null }; } }) };
  const result = await indexRepository(db, { roots: ['lib/learner'], maxFiles: 1 });
  expect(result.indexed).toBe(1);
  const [payload, options] = saved.mock.calls[0];
  expect(payload.file_path).toBe(payload.repo_path);
  expect(payload.file_type).toBe('typescript');
  expect(payload.metadata.symbols).toEqual(expect.any(Array));
  expect(payload).not.toHaveProperty('language');
  expect(payload).not.toHaveProperty('symbols');
  expect(options).toEqual({ onConflict: 'repo_path' });
});
it('surfaces a failed index read instead of presenting a false empty index', async () => {
  const q: any = { select: () => q, ilike: () => q, limit: async () => ({ data: null, error: { code: '42703' } }) };
  await expect(searchRepoIndex({ from: () => q } as any, 'lesson')).rejects.toThrow('Repository index unavailable');
});
