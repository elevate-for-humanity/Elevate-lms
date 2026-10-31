// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
const owner = '11111111-1111-4111-8111-111111111111',
  entityId = '22222222-2222-4222-8222-222222222222',
  grantId = '33333333-3333-4333-8333-333333333333';
const state = vi.hoisted(() => ({
  authorized: true,
  unavailable: false,
  plan: 'professional',
  calls: [] as any[],
  rpcError: null as any,
  quota: true,
  saveError: false,
  owned: true,
  providerError: false,
}));
vi.mock('@/lib/admin/guards', () => ({
  apiRequireRoles: async () =>
    state.authorized
      ? { id: '11111111-1111-4111-8111-111111111111' }
      : { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) },
}));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/apps/sync-subscription', async () => ({
  ...(await vi.importActual<any>('@/lib/apps/sync-subscription')),
  syncIndividualAppSubscription: async () => ({
    plan: state.plan,
    status: 'active',
    current_period_end: '2099-01-01',
  }),
}));
vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: async () => {
    if (state.unavailable) throw new Error('Service unavailable');
    return db;
  },
}));
vi.mock('@/lib/integrations/grants-gov', () => ({
  searchOpportunities: async () => {
    if (state.providerError) throw new Error('Provider unavailable');
    return {
      totalCount: 1,
      opportunities: [
        {
          id: '123456',
          number: 'FIXTURE',
          title: 'Fixture opportunity',
          agency: { name: 'Fixture agency', code: 'EX' },
          dates: { closeDate: '2099-01-01', postDate: '2026-01-01' },
          status: 'posted',
          opportunityUrl: 'https://www.grants.gov/search-results-detail/123456',
        },
      ],
    };
  },
}));
const db: any = {
  rpc: async (name: string, args: any) => {
    state.calls.push({ rpc: name, args });
    return {
      data:
        name === 'reserve_grants_search'
          ? [{ allowed: state.quota, remaining: 49 }]
          : { id: entityId },
      error: state.rpcError,
    };
  },
  storage: {
    from: (bucket: string) => ({
      upload: async (path: string, _file: any, options: any) => {
        state.calls.push({ upload: path, bucket, options });
        return { error: null };
      },
      remove: async (paths: string[]) => {
        state.calls.push({ remove: paths });
        return { error: null };
      },
      createSignedUrl: async (path: string, ttl: number, options: any) => {
        state.calls.push({ signed: path, ttl, options });
        return { data: { signedUrl: 'https://storage.example.test/private-download' } };
      },
    }),
  },
  from: (table: string) => {
    const call: any = { table, filters: [] };
    state.calls.push(call);
    const one = () =>
      table === 'sam_entities'
        ? { id: entityId }
        : table === 'sam_documents'
          ? { storage_path: 'private/fixture' }
          : table === 'grant_opportunities'
            ? {
                id: grantId,
                title: 'Fixture grant',
                agency: 'Fixture',
                url: 'https://www.grants.gov/search-results-detail/123456',
              }
            : null;
    const q: any = {
      select: () => q,
      eq: (key: string, value: any) => {
        call.filters.push([key, value]);
        return q;
      },
      in: () => q,
      limit: () => q,
      upsert: (value: any, options: any) => {
        call.value = value;
        call.options = options;
        return q;
      },
      insert: (value: any) => {
        call.value = value;
        return q;
      },
      update: (value: any) => {
        call.value = value;
        return q;
      },
      maybeSingle: async () => ({ data: state.owned ? one() : null, error: null }),
      single: async () => ({ data: { id: grantId }, error: null }),
      then: (resolve: any) =>
        Promise.resolve({
          data:
            table === 'grant_opportunities' && call.value
              ? [{ id: grantId, ...call.value[0] }]
              : [],
          error:
            state.saveError && table === 'sam_documents'
              ? { message: 'Storage record failed' }
              : null,
        }).then(resolve),
    };
    return q;
  },
};
import {
  POST as samPost,
  GET as samGet,
} from '@/apps/marketing/app/api/apps/sam-gov/workspace/route';
import { POST as grantsPost } from '@/apps/marketing/app/api/apps/grants/workspace/route';
function request(app: string, body: any) {
  return new NextRequest(`https://example.test/api/apps/${app}/workspace`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
beforeEach(() => {
  state.authorized = true;
  state.unavailable = false;
  state.plan = 'professional';
  state.calls = [];
  state.rpcError = null;
  state.quota = true;
  state.saveError = false;
  state.owned = true;
  state.providerError = false;
});
describe('Individual app authenticated workflows', () => {
  it('requires authentication before either app touches data', async () => {
    state.authorized = false;
    expect((await samPost(request('sam-gov', {}))).status).toBe(401);
    expect((await grantsPost(request('grants', {}))).status).toBe(401);
    expect(state.calls).toEqual([]);
  });
  it('saves an entity under the verified subscriber identity', async () => {
    const response = await samPost(
      request('sam-gov', {
        user_id: 'forged',
        legal_business_name: 'Fixture business',
        uei: '',
        cage_code: '',
        registration_status: 'draft',
        registration_expires_on: '',
        notes: '',
      }),
    );
    expect(response.status).toBe(200);
    expect(state.calls[0]).toMatchObject({
      rpc: 'save_sam_entity',
      args: { p_user_id: owner, p_entity_id: null },
    });
    expect(state.calls[0].args.p_values).not.toHaveProperty('user_id');
  });
  it('returns a plan-limit error without claiming that the entity was saved', async () => {
    state.rpcError = { message: 'Entity limit reached' };
    const response = await samPost(
      request('sam-gov', {
        legal_business_name: 'Fixture',
        uei: '',
        cage_code: '',
        registration_status: 'draft',
        registration_expires_on: '',
        notes: '',
      }),
    );
    expect(response.status).toBe(409);
  });
  it('validates UEI and CAGE values before persistence', async () => {
    expect(
      (
        await samPost(
          request('sam-gov', {
            legal_business_name: 'Fixture',
            uei: 'invalid',
            cage_code: '',
            registration_status: 'draft',
            registration_expires_on: '',
            notes: '',
          }),
        )
      ).status,
    ).toBe(400);
    expect(state.calls).toEqual([]);
  });
  it('checks document ownership before signing a private download', async () => {
    const response = await samGet(
      new NextRequest(`https://example.test/api/apps/sam-gov/workspace?document=${entityId}`),
    );
    expect(response.status).toBe(307);
    expect(state.calls[0].filters).toContainEqual(['user_id', owner]);
    expect(state.calls.find((c) => c.signed)).toMatchObject({
      ttl: 60,
      options: { download: true },
    });
  });
  it('does not sign another subscriber document', async () => {
    state.owned = false;
    expect(
      (
        await samGet(
          new NextRequest(`https://example.test/api/apps/sam-gov/workspace?document=${entityId}`),
        )
      ).status,
    ).toBe(404);
    expect(state.calls.some((c) => c.signed)).toBe(false);
  });
  it('removes a newly uploaded object if its database record fails', async () => {
    state.saveError = true;
    const form = new FormData();
    form.set('entity_id', entityId);
    form.set('file', new File(['%PDF-1.7 fixture'], 'fixture.pdf', { type: 'application/pdf' }));
    const response = await samPost(
      new NextRequest('https://example.test/api/apps/sam-gov/workspace', {
        method: 'POST',
        body: form,
      }),
    );
    expect(response.status).toBe(503);
    expect(state.calls.find((c) => c.upload).upload).toMatch(
      new RegExp(`^${owner}/sam/${entityId}/`),
    );
    expect(state.calls.find((c) => c.remove).remove).toHaveLength(1);
  });
  it('does not consume search allowance during a provider outage', async () => {
    state.providerError = true;
    expect(
      (await grantsPost(request('grants', { action: 'search', keyword: 'workforce' }))).status,
    ).toBe(502);
    expect(state.calls).toEqual([]);
  });
  it('enforces monthly search capacity before returning results', async () => {
    state.quota = false;
    expect(
      (await grantsPost(request('grants', { action: 'search', keyword: 'workforce' }))).status,
    ).toBe(429);
    expect(state.calls.some((c) => c.value)).toBe(false);
  });
  it('persists current official opportunities and returns the remaining allowance', async () => {
    const response = await grantsPost(
      request('grants', { action: 'search', keyword: 'workforce' }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ remaining: 49, total: 1 });
    expect(
      state.calls.find((c) => c.table === 'grant_opportunities' && c.value).value[0],
    ).toMatchObject({ source: 'grants.gov', external_id: 'grants-gov:123456' });
  });
  it('saves a grant under the subscriber account rather than a supplied user ID', async () => {
    expect(
      (
        await grantsPost(
          request('grants', { action: 'save', grant_id: grantId, user_id: 'forged' }),
        )
      ).status,
    ).toBe(200);
    expect(state.calls.find((c) => c.table === 'user_saved_grants').value.user_id).toBe(owner);
  });
  it('gates paid application tracking for the Starter plan', async () => {
    state.plan = 'starter';
    expect(
      (await grantsPost(request('grants', { action: 'draft', grant_id: grantId }))).status,
    ).toBe(403);
    expect(state.calls.some((c) => c.table === 'grant_applications')).toBe(false);
  });
  it('scopes application updates to the verified owner', async () => {
    const response = await grantsPost(
      request('grants', {
        action: 'application',
        id: grantId,
        status: 'submitted',
        notes: 'Fixture note',
        user_id: 'forged',
      }),
    );
    expect(response.status).toBe(404);
    expect(state.calls[0].filters).toContainEqual(['created_by', owner]);
  });
  it('rejects malformed JSON rather than treating it as a service failure', async () => {
    const r = new NextRequest('https://example.test/api/apps/grants/workspace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{',
    });
    expect((await grantsPost(r)).status).toBe(400);
  });
});

it('returns an availability error instead of an upgrade request when billing storage is unavailable', async () => {
  state.unavailable = true;
  expect(
    (await grantsPost(request('grants', { action: 'search', keyword: 'workforce' }))).status,
  ).toBe(503);
  expect(state.calls).toEqual([]);
});
