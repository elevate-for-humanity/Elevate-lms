import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({ access: vi.fn(), limit: vi.fn() }));
vi.mock('@/lib/tax-software/server/office-access', () => ({
  officeAccess: mocks.access,
  OfficeAccessError: class extends Error {
    constructor(
      public status: number,
      public code: string,
    ) {
      super(code);
    }
  },
}));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: mocks.limit }));
import { POST } from '@/apps/marketing/app/api/tax/office/agents/route';
const officeId = '11111111-1111-4111-8111-111111111111';
const applicationId = '22222222-2222-4222-8222-222222222222';
const input = {
  applicationId,
  officeId,
  firstName: 'Test',
  lastName: 'Applicant',
  ptin: 'P12345678',
  identityAndPtinVerified: true,
};
function request(body: unknown = input) {
  return new NextRequest('https://example.com/api/tax/office/agents', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
function setup({ owner = true, confirmed = true, existing = false } = {}) {
  const insert = vi.fn();
  const lookup = vi.fn(async () => ({
    data: {
      user: {
        email: 'candidate@example.invalid',
        email_confirmed_at: confirmed ? '2026-01-01' : null,
      },
    },
    error: null,
  }));
  const from = vi.fn((table: string) => {
    const chain: Record<string, unknown> = {};
    chain.select = () => chain;
    chain.eq = () => chain;
    chain.maybeSingle = async () => ({
      data:
        table === 'job_applications'
          ? { id: applicationId, user_id: 'candidate-id' }
          : existing
            ? { id: 'existing' }
            : null,
      error: null,
    });
    chain.insert = (value: unknown) => {
      insert(value);
      return chain;
    };
    chain.single = async () => ({ data: { id: 'agent', status: 'pending' }, error: null });
    return chain;
  });
  mocks.access.mockResolvedValue({
    db: { from, auth: { admin: { getUserById: lookup } } },
    user: { id: 'owner-id' },
    ownedIds: owner ? [officeId] : [],
    offices: [{ id: officeId, office_code: 'SFC-IND-001' }],
  });
  return { insert, lookup, from };
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.limit.mockResolvedValue(null);
});
describe('owner-controlled agent linking', () => {
  it('does not let a preparer resolve applicant identities', async () => {
    const { lookup, from } = setup({ owner: false });
    expect((await POST(request())).status).toBe(403);
    expect(from).not.toHaveBeenCalled();
    expect(lookup).not.toHaveBeenCalled();
  });
  it('rejects fabricated access status and caller-selected account IDs', async () => {
    const { insert } = setup();
    expect(
      (await POST(request({ ...input, status: 'active', userId: 'someone-else' }))).status,
    ).toBe(400);
    expect(insert).not.toHaveBeenCalled();
  });
  it('requires the existing account email to be verified', async () => {
    const { insert } = setup({ confirmed: false });
    expect((await POST(request())).status).toBe(409);
    expect(insert).not.toHaveBeenCalled();
  });
  it('refuses to overwrite or move an existing staff membership', async () => {
    const { insert } = setup({ existing: true });
    expect((await POST(request())).status).toBe(409);
    expect(insert).not.toHaveBeenCalled();
  });
  it('links the application identity as pending with no filing authority', async () => {
    const { insert, lookup } = setup();
    const response = await POST(request());
    expect(response.status).toBe(201);
    expect(lookup).toHaveBeenCalledWith('candidate-id');
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'candidate-id',
        office_id: officeId,
        status: 'pending',
        efin_authorized: false,
        ero_authorized: false,
        created_by: 'owner-id',
      }),
    );
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(await response.json()).toMatchObject({ agent: { status: 'pending' } });
  });
});
