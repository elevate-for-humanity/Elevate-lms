import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  upsertResult: null as { id: string } | null,
  existing: { id: 'existing-repair' } as { id: string } | null,
  writes: [] as Record<string, unknown>[],
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/devstudio/github-token', () => ({
  getGitHubHeaders: async () => ({ Authorization: 'Bearer test-installation-token' }),
}));
vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: async () => ({
    from: () => {
      let inserted = false;
      const query: any = {
        upsert: (values: Record<string, unknown>) => {
          h.writes.push(values);
          inserted = true;
          return query;
        },
        select: () => query,
        eq: () => query,
        maybeSingle: async () => ({
          data: inserted ? h.upsertResult : h.existing,
          error: null,
        }),
      };
      return query;
    },
  }),
}));

import { diagnoseParisGitHubCredential, enqueueParisRepair } from '@/lib/ai/runtime/code-repair';

beforeEach(() => {
  h.upsertResult = null;
  h.existing = { id: 'existing-repair' };
  h.writes = [];
});
afterEach(() => vi.unstubAllGlobals());

it('checks repository and workflow access with an installation token without requiring a personal user identity', async () => {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (url.endsWith('/user')) return new Response(null, { status: 403 });
    if (url.endsWith('/git/ref/heads/main')) return Response.json({ object: { sha: 'a'.repeat(40) } });
    if (url.endsWith('/actions/workflows/paris-code-repair.yml')) return Response.json({ state: 'active' });
    return Response.json({ full_name: 'elevate-for-humanity/Elevate-lms' });
  }));
  const result = await diagnoseParisGitHubCredential();
  expect(result).toMatchObject({ repository: { ok: true }, contents: { ok: true }, workflow: { ok: true } });
  expect(vi.mocked(fetch).mock.calls.some(([url]) => String(url).endsWith('/user'))).toBe(false);
  expect(vi.mocked(fetch).mock.calls.every(([, options]) => !options?.method || options.method === 'GET')).toBe(true);
  expect(JSON.stringify(result)).not.toContain('test-installation-token');
});

it('reports denied workflow access without treating repository readability as dispatch authority', async () => {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (url.includes('/actions/workflows/')) return new Response(null, { status: 403 });
    return Response.json({ object: { sha: 'a'.repeat(40) } });
  }));
  const result = await diagnoseParisGitHubCredential();
  expect(result).toMatchObject({ repository: { ok: true }, workflow: { ok: false, status: 403 } });
});

it('returns the existing durable repair id when the same incident is queued twice', async () => {
  const result = await enqueueParisRepair({ actorId: 'owner', goal: 'Repair the approved workflow', fingerprint: 'portal-workflow:incident' });
  expect(result).toEqual({ id: 'existing-repair' });
  expect(h.writes).toHaveLength(1);
});

it('does not acknowledge a repair when neither insertion nor duplicate lookup returns durable evidence', async () => {
  h.existing = null;
  await expect(enqueueParisRepair({ actorId: 'owner', goal: 'Repair the approved workflow', fingerprint: 'portal-workflow:incident' }))
    .rejects.toThrow('REPAIR_QUEUE_RECORD_REQUIRED');
});
