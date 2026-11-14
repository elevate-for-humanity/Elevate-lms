import { afterEach, expect, it, vi } from 'vitest';
import { indexRepository } from '@/lib/devstudio/os/repo-indexer';
vi.mock('@/lib/devstudio/github-token', () => ({
  getGitHubHeaders: async () => ({ Authorization: 'Bearer fixture' }),
}));
vi.mock('@/lib/devstudio/repository', () => ({ studioRepository: () => 'owner/repo' }));
afterEach(() => vi.unstubAllGlobals());
it('indexes pinned GitHub path metadata in batches without pretending to extract symbols', async () => {
  const commit = 'a'.repeat(40),
    tree = 'b'.repeat(40);
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ object: { sha: commit } }))
    .mockResolvedValueOnce(Response.json({ tree: { sha: tree } }))
    .mockResolvedValueOnce(
      Response.json({
        truncated: false,
        tree: [
          { type: 'blob', path: 'components/Studio.tsx', sha: 'blob', size: 40 },
          { type: 'blob', path: 'lib/.env.private', sha: 'secret' },
          { type: 'blob', path: 'node_modules/file.js', sha: 'ignored' },
        ],
      }),
    );
  vi.stubGlobal('fetch', fetcher);
  const upsert = vi.fn(async () => ({ error: null }));
  const db = { from: vi.fn(() => ({ upsert })) };
  const result = await indexRepository(db as never, { maxFiles: 100 });
  expect(result.indexed).toBe(1);
  expect(fetcher.mock.calls.map(([url]) => url)).toEqual([
    'https://api.github.com/repos/owner/repo/git/ref/heads/main',
    `https://api.github.com/repos/owner/repo/git/commits/${commit}`,
    `https://api.github.com/repos/owner/repo/git/trees/${tree}?recursive=1`,
  ]);
  expect(upsert).toHaveBeenCalledWith(
    [
      expect.objectContaining({
        file_path: 'components/Studio.tsx',
        repo_path: 'components/Studio.tsx',
        metadata: expect.objectContaining({ commit_sha: commit, content_indexed: false }),
      }),
    ],
    { onConflict: 'repo_path' },
  );
  expect(upsert.mock.calls[0][0][0].metadata).not.toHaveProperty('symbols');
});
it('refuses a truncated tree before writing a partial index', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ object: { sha: 'a'.repeat(40) } }))
    .mockResolvedValueOnce(Response.json({ tree: { sha: 'b'.repeat(40) } }))
    .mockResolvedValueOnce(Response.json({ truncated: true, tree: [] }));
  vi.stubGlobal('fetch', fetcher);
  const from = vi.fn();
  await expect(indexRepository({ from } as never)).rejects.toThrow('tree is incomplete');
  expect(from).not.toHaveBeenCalled();
});
it('rejects invalid indexing limits before external requests', async () => {
  const fetcher = vi.fn();
  vi.stubGlobal('fetch', fetcher);
  await expect(indexRepository({} as never, { maxFiles: -1 })).rejects.toThrow('file limit');
  expect(fetcher).not.toHaveBeenCalled();
});
