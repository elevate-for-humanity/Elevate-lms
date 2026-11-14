import { expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/secrets', () => ({
  getSecrets: async () => ({
    STUDIO_BROWSER_URL: process.env.STUDIO_BROWSER_URL,
    STUDIO_BROWSER_SECRET: process.env.STUDIO_BROWSER_SECRET,
  }),
}));
import { containerTree, readContainerRepository } from '@/lib/studio/container-repository';
it('shows nested source files and untracked files while excluding environment and git internals', () => {
  const result = containerTree([
    'package.json',
    'apps/admin/app/page.tsx',
    'apps/admin/.env.local',
    '.git/config',
    'node_modules/a',
    'notes.html',
  ]);
  expect(result.map((n) => n.name)).toEqual(['apps', 'notes.html', 'package.json']);
  expect(result[0].children?.[0].children?.[0].children?.[0].path).toBe('apps/admin/app/page.tsx');
  expect(JSON.stringify(result)).not.toContain('.env');
  expect(JSON.stringify(result)).not.toContain('.git');
});
it('does not label a failed container file-list request as an empty connected repository', async () => {
  vi.stubEnv('STUDIO_BROWSER_URL', 'https://studio.example.run.app');
  vi.stubEnv('STUDIO_BROWSER_SECRET', 'test-only');
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ error: 'unavailable' }), { status: 503 })),
  );
  await expect(readContainerRepository()).rejects.toThrow('HTTP 503');
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
it('uses structured git arguments and reads the existing container rather than GitHub for files', async () => {
  vi.stubEnv('STUDIO_BROWSER_URL', 'https://studio.example.run.app');
  vi.stubEnv('STUDIO_BROWSER_SECRET', 'test-only');
  const calls: any[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, options: any) => {
      calls.push({ url, options });
      const args = options.body ? JSON.parse(options.body).args : [];
      return new Response(
        JSON.stringify(
          args[0] === 'ls-files'
            ? { exitCode: 0, stdout: 'lib/example.ts\nnew.html\n' }
            : { exitCode: 0, stdout: 'main\n' },
        ),
      );
    }),
  );
  const result = await readContainerRepository();
  expect(result.source).toBe('container');
  expect(result.tree).toHaveLength(2);
  expect(calls.every((c) => c.url.startsWith('https://studio.example.run.app/'))).toBe(true);
  expect(JSON.parse(calls[0].options.body).args).toEqual([
    'ls-files',
    '--cached',
    '--others',
    '--exclude-standard',
  ]);
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
it('opens an untracked container file when the runtime reports a missing git blob as HTTP 500', async () => {
  vi.stubEnv('STUDIO_BROWSER_URL', 'https://studio.example.run.app');
  vi.stubEnv('STUDIO_BROWSER_SECRET', 'test-only');
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) =>
      url.includes('/workspace/file?')
        ? new Response(JSON.stringify({ content: '<h1>Preview</h1>', size: 16 }))
        : new Response(JSON.stringify({ error: 'command_failed' }), { status: 500 }),
    ),
  );
  const result = await readContainerRepository('new.html');
  expect(result.content).toBe('<h1>Preview</h1>');
  expect(result.sha).toBe('');
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
it('reports the container revision separately from current repository main without synchronizing on a read', async () => {
  vi.stubEnv('STUDIO_BROWSER_URL', 'https://studio.example.run.app');
  vi.stubEnv('STUDIO_BROWSER_SECRET', 'test-only');
  const local = 'a'.repeat(40),
    remote = 'b'.repeat(40);
  const fetcher = vi.fn(async (_url: string, options: RequestInit = {}) => {
    const args = JSON.parse(String(options.body)).args;
    const stdout =
      args[0] === 'ls-files'
        ? 'README.md\n'
        : args[0] === 'ls-remote'
          ? remote + '\trefs/heads/main\n'
          : args.includes('--abbrev-ref')
            ? 'main\n'
            : local + '\n';
    return Response.json({ exitCode: 0, stdout });
  });
  vi.stubGlobal('fetch', fetcher);
  try {
    const result = await readContainerRepository();
    expect(result.commitSha).toBe(local);
    expect(result.remoteCommitSha).toBe(remote);
    expect(fetcher.mock.calls.every(([url]) => !url.includes('repository/sync'))).toBe(true);
  } finally {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  }
});
