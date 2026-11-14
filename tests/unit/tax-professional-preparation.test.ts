// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const m = vi.hoisted(() => ({
  access: vi.fn(),
  limit: vi.fn(),
  write: vi.fn(),
  filters: vi.fn(),
  rows: {} as Record<string, unknown>,
  save: { data: { id: 'saved', updated_at: '2026-11-02T12:01:00.000Z' }, error: null } as any,
}));
vi.mock('@/lib/tax-software/server/expert-access', () => ({ expertAccess: m.access }));
vi.mock('@/lib/tax-software/server/office-access', () => ({
  OfficeAccessError: class extends Error {
    constructor(
      public status: number,
      public code: string,
    ) {
      super(code);
    }
  },
}));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: m.limit }));
import { GET, POST } from '@/apps/marketing/app/api/tax/office/preparation/route';
const office = '11111111-1111-4111-8111-111111111111',
  client = '22222222-2222-4222-8222-222222222222',
  id = '33333333-3333-4333-8333-333333333333';
const save = {
  action: 'save_return',
  returnId: id,
  expectedUpdatedAt: '2026-11-02T12:00:00.000Z',
  worksheet: {
    w2: [
      {
        employerName: 'Fictional employer',
        owner: 'primary',
        wages: 40000,
        federalWithholding: 3200,
      },
    ],
    extra: {},
  },
  submitForReview: true,
};
function req(body: unknown) {
  return new NextRequest('https://example.com/api/tax/office/preparation', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
function context(owner = true) {
  return {
    user: { id: 'actor' },
    officeIds: [office],
    ownedIds: owner ? [office] : [],
    offices: [{ id: office, status: 'active' }],
    db: {
      from: (table: string) => {
        let writing = false;
        const c: any = {};
        for (const method of ['select', 'eq', 'in', 'order', 'limit'])
          c[method] = (...args: unknown[]) => {
            m.filters(method, ...args);
            return c;
          };
        c.update = c.insert = (v: unknown) => {
          writing = true;
          m.write(v);
          return c;
        };
        c.maybeSingle = c.single = async () =>
          writing ? m.save : { data: m.rows[table] ?? null, error: null };
        c.then = (r: any) => Promise.resolve({ data: m.rows[table] ?? [], error: null }).then(r);
        return c;
      },
    },
  };
}
beforeEach(() => {
  vi.clearAllMocks();
  m.limit.mockResolvedValue(null);
  m.save = { data: { id: 'saved', updated_at: '2026-11-02T12:01:00.000Z' }, error: null };
  m.rows = {
    tax_returns: {
      id,
      office_id: office,
      preparer_user_id: 'actor',
      client_id: client,
      status: 'in_progress',
      tax_year: 2026,
      filing_status: 'single',
      return_json: {},
      updated_at: save.expectedUpdatedAt,
    },
  };
  m.access.mockResolvedValue(context());
});
describe('professional client/return isolation', () => {
  it('cannot create a client in an unrelated office', async () => {
    const r = await POST(
      req({
        action: 'create_client',
        officeId: client,
        firstName: 'Test',
        lastName: 'Client',
        email: '',
        phone: '',
      }),
    );
    expect(r.status).toBe(403);
    expect(m.write).not.toHaveBeenCalled();
  });
  it('denies another preparer’s return even within the same office', async () => {
    m.access.mockResolvedValue(context(false));
    (m.rows.tax_returns as any).preparer_user_id = 'different-actor';
    expect((await POST(req(save))).status).toBe(404);
    expect(m.write).not.toHaveBeenCalled();
  });
  it('scopes list queries to the current preparer for nonowners', async () => {
    m.access.mockResolvedValue(context(false));
    m.rows = { tax_clients: [], tax_returns: [] };
    expect(
      (await GET(new NextRequest('https://example.com/api/tax/office/preparation'))).status,
    ).toBe(200);
    expect(m.filters).toHaveBeenCalledWith('eq', 'preparer_id', 'actor');
    expect(m.filters).toHaveBeenCalledWith('eq', 'preparer_user_id', 'actor');
  });
  it('rejects callers trying to mark a worksheet filed', async () => {
    expect((await POST(req({ ...save, status: 'filed' }))).status).toBe(400);
    expect(m.write).not.toHaveBeenCalled();
  });
  it('uses optimistic concurrency instead of overwriting a changed return', async () => {
    m.save = { data: null, error: null };
    expect((await POST(req(save))).status).toBe(409);
    expect(m.filters).toHaveBeenCalledWith('eq', 'updated_at', save.expectedUpdatedAt);
  });
  it('calculates saved source amounts and queues review without claiming IRS acceptance', async () => {
    const r = await POST(req(save));
    expect(r.status).toBe(200);
    const b = await r.json();
    expect(b.status).toBe('in_review');
    expect(b.calculation.totalPayments).toBe(3200);
    expect(m.write).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'in_review',
        return_json: expect.objectContaining({ officeWorksheetSavedBy: 'actor' }),
      }),
    );
  });
  it('never edits a return that has already been filed', async () => {
    (m.rows.tax_returns as any).status = 'filed';
    expect((await POST(req(save))).status).toBe(409);
    expect(m.write).not.toHaveBeenCalled();
  });
  it('downloads only the authorized saved revision without an IRS acceptance claim', async () => {
    m.rows.tax_clients = { id: client, first_name: 'Fictional', last_name: 'Client' };
    const r = await GET(
      new NextRequest(
        `https://example.com/api/tax/office/preparation?returnId=${id}&download=review&revision=${encodeURIComponent(save.expectedUpdatedAt)}`,
      ),
    );
    expect(r.status).toBe(200);
    expect(r.headers.get('cache-control')).toBe('private, no-store');
    expect(r.headers.get('content-disposition')).toContain('attachment;');
    const b = await r.json();
    expect(b.purpose).toBe('supersonic-saved-preparation-review');
    expect(b.thisExportTransmittedToIrs).toBe(false);
    expect(b.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(b.providerReceipt).toBeUndefined();
    expect(m.write).not.toHaveBeenCalled();
  });
  it('rejects an export if the saved return changed after the displayed revision', async () => {
    const r = await GET(
      new NextRequest(
        `https://example.com/api/tax/office/preparation?returnId=${id}&download=review&revision=2026-10-01T00%3A00%3A00.000Z`,
      ),
    );
    expect(r.status).toBe(409);
    expect(m.write).not.toHaveBeenCalled();
  });
  it('denies an export belonging to another preparer', async () => {
    m.access.mockResolvedValue(context(false));
    (m.rows.tax_returns as any).preparer_user_id = 'different-actor';
    const r = await GET(
      new NextRequest(
        `https://example.com/api/tax/office/preparation?returnId=${id}&download=review&revision=${encodeURIComponent(save.expectedUpdatedAt)}`,
      ),
    );
    expect(r.status).toBe(404);
  });
});
