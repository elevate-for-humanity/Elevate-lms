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

it('advances one durable turn per request and resumes the same branch through validation handoff', async () => {
  h.actions = [{type:'read',path:'lib/example.ts'}, ...patch];
  let checkpoint: import('@/lib/devstudio/paris-code-engineer').ParisRepairCheckpoint | undefined;
  const save=vi.fn(async state=>{checkpoint=structuredClone(state);});
  for(let turn=0;turn<3;turn++){
    const response=await stageParisCodeRepair('Fix retry','repair','owner',{checkpoint,save});
    expect(response.status).toBe(202);
    expect(await response.json()).toMatchObject({pending:true,turn:turn+1});
    expect(h.prompts).toHaveLength(turn+1);
  }
  const response=await stageParisCodeRepair('Fix retry','repair','owner',{checkpoint,save});
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({changed_files:['lib/example.ts','tests/unit/example-regression.test.ts'],release:{verifiedLive:false}});
  expect(h.writes).toHaveLength(2);
  expect(vi.mocked(fetch).mock.calls.filter(([u,o])=>String(u).endsWith('/git/refs')&&o?.method==='POST')).toHaveLength(1);
  expect(checkpoint).toMatchObject({nextTurn:4,writes:2,complete:true});
  expect(JSON.stringify(checkpoint)).not.toContain('Bearer');
});
it('refuses a branch changed outside the saved continuation without more inference or writes',async()=>{
  let checkpoint: import('@/lib/devstudio/paris-code-engineer').ParisRepairCheckpoint | undefined;
  h.actions=[{type:'read',path:'lib/example.ts'}];
  await stageParisCodeRepair('Fix retry','repair','owner',{save:async state=>{checkpoint=state;}});
  h.sha='d'.repeat(40);
  await expect(stageParisCodeRepair('Fix retry','repair','owner',{checkpoint,save:async()=>{}})).rejects.toThrow('CHECKPOINT_BRANCH_CHANGED');
  expect(h.prompts).toHaveLength(1);expect(h.writes).toHaveLength(0);
});
it('does not acknowledge an unsaved initial checkpoint or infer after persistence failure',async()=>{
  const response=await stageParisCodeRepair('Fix retry','repair','owner',{save:async()=>{throw Error('storage unavailable');}});
  expect(response.status).toBe(500);expect(h.prompts).toHaveLength(0);expect(h.writes).toHaveLength(0);
});
it('requires a new regression even when a continued planner declares completion',async()=>{
  h.actions=[patch[0],patch[2]];
  let checkpoint: import('@/lib/devstudio/paris-code-engineer').ParisRepairCheckpoint | undefined;
  const save=async(state: import('@/lib/devstudio/paris-code-engineer').ParisRepairCheckpoint)=>{checkpoint=state;};
  expect((await stageParisCodeRepair('Fix retry','repair','owner',{checkpoint,save})).status).toBe(202);
  expect((await stageParisCodeRepair('Fix retry','repair','owner',{checkpoint,save})).status).toBe(422);
});
