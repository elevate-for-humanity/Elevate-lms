// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { openTaxPrivateFields } from '@/lib/tax-software/security/encryption';
const state = vi.hoisted(() => ({
  user: { id: 'owner' } as { id: string } | null,
  found: true,
  saved: true,
  writes: [] as Record<string, unknown>[],
  filters: [] as [string, unknown][],
}));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/secrets', () => ({
  getSecrets: async () => ({ TAX_DATA_ENCRYPTION_KEY: 'ab'.repeat(32) }),
}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user } }) },
    from: () => {
      let write = false;
      const q = {
        select: () => q,
        eq: (k: string, v: unknown) => {
          state.filters.push([k, v]);
          return q;
        },
        update: (v: Record<string, unknown>) => {
          write = true;
          state.writes.push(v);
          return q;
        },
        maybeSingle: async () => ({
          error: null,
          data: write
            ? state.saved
              ? { id: 'return' }
              : null
            : state.found
              ? {
                  id: 'return',
                  filing_status: 'single',
                  updated_at: 'before',
                  return_json: {
                    calculation: { calculationDigest: 'tax-digest', sourceDigest: 'source-digest' },
                  },
                }
              : null,
        }),
      };
      return q;
    },
  }),
}));
import { POST } from '@/apps/marketing/app/api/tax/returns/profile/route';
const fields = {
  profile: {
    firstName: 'Test',
    lastName: 'Taxpayer',
    ssn: '400001037',
    birthDate: '1986-02-07',
    address: { line1: '1 Main St', city: 'Austin', state: 'TX', zip: '78701' },
  },
  signature: {
    taxpayerPin: '12345',
    signatureDate: '2026-02-28',
    priorYearAgi: 0,
    authorizationRecorded: true,
  },
};
const request = () =>
  new NextRequest('https://www.elevateforhumanity.org/api/tax/returns/profile', {
    method: 'POST',
    body: JSON.stringify({ returnId: 'return', privateFields: fields }),
    headers: { 'content-type': 'application/json' },
  });
beforeEach(() => {
  state.user = { id: 'owner' };
  state.found = true;
  state.saved = true;
  state.writes = [];
  state.filters = [];
});
describe('secure taxpayer save', () => {
  it('requires sign-in without writing', async () => {
    state.user = null;
    expect((await POST(request())).status).toBe(401);
    expect(state.writes).toHaveLength(0);
  });
  it('requires an owned self-file return', async () => {
    state.found = false;
    expect((await POST(request())).status).toBe(404);
    expect(state.writes).toHaveLength(0);
    expect(state.filters).toContainEqual(['created_by_user_id', 'owner']);
    expect(state.filters).toContainEqual(['service_type', 'self_file']);
  });
  it('stores encrypted identity and the authorized calculation and source digests', async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    const json = state.writes[0].return_json as Record<string, unknown>;
    expect(JSON.stringify(json)).not.toContain(fields.profile.ssn);
    expect(
      openTaxPrivateFields(
        json.privateFieldsEncrypted as string,
        'owner',
        'return',
        'ab'.repeat(32),
      ),
    ).toMatchObject({
      authorizedCalculationDigest: 'tax-digest',
      authorizedSourceDigest: 'source-digest',
    });
    expect(state.filters).toContainEqual(['updated_at', 'before']);
  });
  it('reports concurrent modification without claiming the save succeeded', async () => {
    state.saved = false;
    expect((await POST(request())).status).toBe(409);
  });
});
