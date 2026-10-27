import { beforeEach, afterEach, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  actions: [] as Record<string, unknown>[],
  prompts: [] as any[],
  files: {} as Record<string, string>,
  writes: [] as string[],
  sha: 'a'.repeat(40),
  denyReads: false,
}));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: async () => {} }));
vi.mock('@/lib/devstudio/github-token', () => ({ getGitHubHeaders: async () => ({ Authorization: 'Bearer test-only' }), githubApiErrorMessage: (status: number) => `GitHub diagnostic ${status}` }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({}) }));
vi.mock('@/lib/ai/paid-inference-gateway', () => ({
  paidArtifactFingerprint: () => 'test-fingerprint',
  reservePaidInference: vi.fn(),
  executePaidInference: async ({ dispatch }: any) => ({ decision: 'approved', value: await dispatch() }),
}));
vi.mock('@/lib/ai/ai-service', () => ({ aiChat: async (options: any) => {
  h.prompts.push(options);
  return { content: JSON.stringify(h.actions.shift() ?? { type: 'complete', summary: 'No further changes.' }), provider: 'openai' };
} }));

import { stageParisCodeRepair } from '@/lib/devstudio/paris-code-engineer';

beforeEach(() => {
  h.actions = []; h.prompts = []; h.writes = []; h.sha = 'a'.repeat(40); h.denyReads = false;
  h.files = { 'lib/example.ts': 'export const retries = 0;\n' };
  vi.stubEnv('AI_PROVIDER', 'openai');
  vi.stubGlobal('fetch', vi.fn(async (input: string, init: RequestInit = {}) => {
    const url = new URL(input);
    if (url.pathname.includes('/git/ref/heads/main')) return Response.json({ object: { sha: 'a'.repeat(40) } });
    if (url.pathname.includes('/git/ref/heads/')) return Response.json({ object: { sha: h.sha } });
    if (url.pathname.endsWith('/git/refs')) return Response.json({ ref: 'refs/heads/studio/task' }, { status: 201 });
    if (url.pathname === '/search/code') return Response.json({ message: 'API rate limit exceeded' }, { status: 429 });
    const path = decodeURIComponent(url.pathname.split('/contents/')[1] ?? '');
    if (init.method === 'PUT') {
      const body = JSON.parse(String(init.body));
      h.files[path] = Buffer.from(body.content, 'base64').toString('utf8');
      h.writes.push(path); h.sha = h.writes.length === 1 ? 'b'.repeat(40) : 'c'.repeat(40);
      return Response.json({ content: { sha: 'blob' }, commit: { sha: h.sha } });
    }
    if (h.denyReads) return Response.json({ message: 'Forbidden' }, { status: 403 });
    if (!path) return Response.json([
      { path: 'lib', type: 'dir' }, { path: '.env.production', type: 'file' }, { path: '.github', type: 'dir' },
    ]);
    if (path === 'lib') return Response.json([
      { path: 'lib/example.ts', type: 'file' }, { path: 'lib/secrets.ts', type: 'file' },
    ]);
    if (!(path in h.files)) return Response.json({ message: 'Not Found' }, { status: 404 });
    return Response.json({ type: 'file', sha: 'file-blob', content: Buffer.from(h.files[path]).toString('base64') });
  }));
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

const patch = [
  { type: 'replace', path: 'lib/example.ts', old: 'retries = 0', replacement: 'retries = 1' },
  { type: 'create', path: 'tests/unit/example-regression.test.ts', content: "import { it, expect } from 'vitest';\nimport { retries } from '../../lib/example';\nit('allows the authorized retry', () => expect(retries).toBe(1));\n" },
  { type: 'complete', summary: 'Candidate requires independent validation.' },
];

it('recovers a rejected read and discovers allowed source when GitHub code search is rate limited', async () => {
  h.actions = [
    { type: 'read', path: 'AGENTS.md' },
    { type: 'search', query: 'retry' },
    { type: 'list', path: '' },
    { type: 'list', path: 'lib' },
    ...patch,
  ];
  const response = await stageParisCodeRepair('Fix the known retry defect', 'repair', 'owner');
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ status: 'running', changed_files: ['lib/example.ts', 'tests/unit/example-regression.test.ts'], release: { verifiedLive: false } });
  expect(h.writes).toEqual(['lib/example.ts', 'tests/unit/example-regression.test.ts']);
  const observations = h.prompts.flatMap(prompt => JSON.parse(prompt.messages[1].content).observations);
  expect(observations.some((entry: string) => entry.includes('READ_REJECTED'))).toBe(true);
  const lists = observations.filter((entry: string) => entry.startsWith('LIST ')).join('\n');
  expect(lists).toContain('lib/example.ts');
  expect(lists).not.toContain('.env.production');
  expect(lists).not.toContain('lib/secrets.ts');
});

it('does not weaken protected writes or retry a GitHub permission failure as a missing file', async () => {
  h.actions = [{ type: 'create', path: '.github/workflows/release.yml', content: 'unsafe' }];
  expect((await stageParisCodeRepair('Fix the known retry defect', 'repair', 'owner')).status).toBe(500);
  expect(h.writes).toEqual([]);
  h.actions = [{ type: 'read', path: 'lib/example.ts' }, ...patch]; h.denyReads = true;
  expect((await stageParisCodeRepair('Fix the known retry defect', 'repair', 'owner')).status).toBe(500);
  expect(h.writes).toEqual([]);
});

it('will not hand off a patch without a new regression test', async () => {
  h.actions = [patch[0], patch[2]];
  const response = await stageParisCodeRepair('Fix the known retry defect', 'repair', 'owner');
  expect(response.status).toBe(422);
  expect(await response.json()).toMatchObject({ error: expect.stringContaining('new regression test') });
});

it.each(['lib/ai/runtime/repair-events.ts', 'lib/control-plane/workflow-repairs.ts', 'lib/control-plane/index.ts'])(
  'keeps the repair and approval control plane protected: %s', async path => {
    h.actions = [{ type: 'create', path, content: 'export const bypass = true;' }];
    expect((await stageParisCodeRepair('Repair an application workflow', 'repair', 'owner')).status).toBe(500);
    expect(h.writes).toEqual([]);
  },
);


it('recovers a genuine missing-file read while retaining HTTP status classification', async () => {
  h.actions = [{ type: 'read', path: 'lib/missing.ts' }, ...patch];
  const response = await stageParisCodeRepair('Fix the known retry defect', 'repair', 'owner');
  expect(response.status).toBe(200);
  expect(h.writes).toEqual(['lib/example.ts', 'tests/unit/example-regression.test.ts']);
});
