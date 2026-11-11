// @vitest-environment node
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
const m = vi.hoisted(() => ({
  access: vi.fn(),
  limit: vi.fn(),
  write: vi.fn(),
  rpc: vi.fn(),
  filters: vi.fn(),
  row: null as any,
}));
vi.mock('@/lib/tax-software/server/expert-access', () => ({ expertAccess: m.access }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: m.limit }));
import { OfficeAccessError } from '@/lib/tax-software/server/office-access';
import { GET, POST } from '@/apps/marketing/app/api/tax/office/payroll/route';
const office = '11111111-1111-4111-8111-111111111111',
  company = '22222222-2222-4222-8222-222222222222',
  run = '33333333-3333-4333-8333-333333333333';
function context(ownedIds = [office]) {
  return {
    ownedIds,
    officeIds: [office],
    offices: [{ id: office, status: 'active' }],
    user: { id: 'owner' },
    db: {
      rpc: m.rpc,
      from: () => {
        const q: any = {};
        for (const k of ['select', 'eq', 'in', 'order', 'limit'])
          q[k] = (...a: any[]) => {
            m.filters(k, ...a);
            return q;
          };
        q.insert = q.update = (v: any) => {
          m.write(v);
          return q;
        };
        q.single = q.maybeSingle = async () => ({ data: m.row, error: null });
        q.then = (f: any) => Promise.resolve({ data: [], error: null }).then(f);
        return q;
      },
    },
  };
}
const req = (b: unknown) =>
  new NextRequest('https://example.test/api/tax/office/payroll', {
    method: 'POST',
    body: JSON.stringify(b),
  });
beforeEach(() => {
  vi.clearAllMocks();
  m.limit.mockResolvedValue(null);
  m.access.mockResolvedValue(context());
  m.row = { id: company, office_id: office, version: 1, frequency: 'weekly', employees: [] };
  m.rpc.mockResolvedValue({
    data: [{ id: run, status: 'approved_for_export', version: 2 }],
    error: null,
  });
});
describe('Supersonic payroll authorization and evidence boundaries', () => {
  it('rejects cross-site writes before reaching account or database operations', async () => {
    const r = await POST(
      new NextRequest('https://example.test/api/tax/office/payroll', {
        method: 'POST',
        headers: { origin: 'https://other.test', 'sec-fetch-site': 'cross-site' },
        body: '{}',
      }),
    );
    expect(r.status).toBe(403);
    expect(m.access).not.toHaveBeenCalled();
    expect(m.write).not.toHaveBeenCalled();
  });
  it('denies anonymous reads and writes before accessing payroll', async () => {
    m.access.mockRejectedValue(new OfficeAccessError(401, 'SIGN_IN_REQUIRED'));
    expect((await GET(new NextRequest('https://example.test/api/tax/office/payroll'))).status).toBe(
      401,
    );
    expect((await POST(req({}))).status).toBe(401);
    expect(m.write).not.toHaveBeenCalled();
    expect(m.rpc).not.toHaveBeenCalled();
  });
  it('denies preparers without active office ownership', async () => {
    m.access.mockResolvedValue(context([]));
    expect(
      (
        await POST(
          req({
            action: 'create_company',
            officeId: office,
            name: 'Fictional company',
            frequency: 'weekly',
          }),
        )
      ).status,
    ).toBe(403);
    expect(m.write).not.toHaveBeenCalled();
  });
  it('rejects an unrelated office even when the caller owns another one', async () => {
    expect(
      (
        await POST(
          req({
            action: 'create_company',
            officeId: company,
            name: 'Fictional company',
            frequency: 'weekly',
          }),
        )
      ).status,
    ).toBe(403);
    expect(m.write).not.toHaveBeenCalled();
  });
  it('rejects an unrelated company instead of trusting submitted company ids', async () => {
    m.row.office_id = company;
    expect(
      (
        await POST(
          req({
            action: 'review_run',
            companyId: company,
            runId: run,
            expectedRunVersion: 1,
            decision: 'approve',
          }),
        )
      ).status,
    ).toBe(404);
    expect(m.rpc).not.toHaveBeenCalled();
  });
  it('does not accept payment or filing completion flags and invented send actions', async () => {
    for (const body of [
      { action: 'send_payroll', companyId: company },
      {
        action: 'review_run',
        companyId: company,
        runId: run,
        expectedRunVersion: 1,
        decision: 'approve',
        paid: true,
      },
    ])
      expect((await POST(req(body))).status).toBe(400);
    expect(m.rpc).not.toHaveBeenCalled();
  });
  it('returns a reopened approval with explicit no-payment/no-filing evidence', async () => {
    const r = await POST(
      req({
        action: 'review_run',
        companyId: company,
        runId: run,
        expectedRunVersion: 1,
        decision: 'approve',
      }),
    );
    expect(r.status).toBe(200);
    expect(await r.json()).toMatchObject({
      run: { id: run, status: 'approved_for_export' },
      paymentsSent: false,
      taxesFiled: false,
    });
    expect(m.rpc).toHaveBeenCalledWith(
      'sfc_review_payroll_run',
      expect.objectContaining({ p_actor: 'owner', p_expected_version: 1 }),
    );
    expect(r.headers.get('cache-control')).toBe('private, no-store');
  });
  it('does not report an approval when the atomic database gate rejects it', async () => {
    m.rpc.mockResolvedValue({ data: null, error: { message: 'PAYROLL_PROFILE_CHANGED' } });
    const r = await POST(
      req({
        action: 'review_run',
        companyId: company,
        runId: run,
        expectedRunVersion: 1,
        decision: 'approve',
      }),
    );
    expect(r.status).toBe(409);
    expect((await r.json()).run).toBeUndefined();
  });
  it('scopes all company reads to saved owned office ids and disables live execution', async () => {
    const r = await GET(new NextRequest('https://example.test/api/tax/office/payroll'));
    expect(await r.json()).toMatchObject({ paymentsEnabled: false, taxFilingEnabled: false });
    expect(m.filters).toHaveBeenCalledWith('in', 'office_id', [office]);
  });
});
