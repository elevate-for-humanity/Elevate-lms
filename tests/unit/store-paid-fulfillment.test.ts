import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const state = vi.hoisted(() => ({ status: 'paid', type: 'platform_subscription', completeError: false, claimed: true, calls: [] as any[] }));
vi.mock('@/lib/billing/fulfillment', () => ({ fulfillPaidBillingInvoice: async (_db: unknown, job: any) => { state.calls.push(job); } }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({
  from: (table: string) => {
    let update: any;
    const job = { id: 'job', billing_invoice_id: 'invoice', fulfillment_type: 'platform_subscription', payload: { organization_id: 'wrong' }, attempts: 0 };
    const q: any = { select: () => q, eq: () => q, in: () => q, lt: () => q, order: () => q,
      limit: async () => ({ data: [job], error: null }),
      update: (value: any) => { update = value; return q; },
      maybeSingle: async () => table === 'billing_invoices'
        ? { data: { status: state.status, fulfillment_type: state.type, fulfillment_payload: { organization_id: 'authorized' } } }
        : { data: state.claimed ? { id: 'job' } : null },
      then: (resolve: any) => Promise.resolve({ error: state.completeError && update?.status === 'completed' ? new Error('database failed') : null }).then(resolve),
    }; return q;
  },
}) }));
import { POST } from '@/apps/admin/app/api/cron/process-billing-fulfillment/route';
function request(auth = true) { return new NextRequest('https://example.test/api/cron/process-billing-fulfillment', { method: 'POST', headers: auth ? { authorization: 'Bearer test-cron' } : {} }); }
beforeEach(() => { vi.stubEnv('CRON_SECRET', 'test-cron'); state.status = 'paid'; state.type = 'platform_subscription'; state.completeError = false; state.claimed = true; state.calls.length = 0; });
describe('Paid subscription delivery', () => {
  it('uses the authoritative paid invoice snapshot rather than queue payload', async () => {
    const response = await POST(request()); expect(response.status).toBe(200);
    expect(state.calls[0].payload).toEqual({ organization_id: 'authorized' });
    expect(await response.json()).toMatchObject({ ok: true, completed: 1, failed: 0 });
  });
  for (const status of ['open', 'draft', 'void', 'failed']) it(`does not grant access for a ${status} invoice`, async () => {
    state.status = status; const response = await POST(request()); expect(response.status).toBe(207); expect(state.calls).toHaveLength(0);
  });
  it('rejects a mismatched fulfillment type', async () => { state.type = 'individual_app_subscription'; expect((await POST(request())).status).toBe(207); expect(state.calls).toHaveLength(0); });
  it('does not report completion when its durable completion write fails', async () => { state.completeError = true; const response = await POST(request()); expect(response.status).toBe(207); expect(await response.json()).toMatchObject({ ok: false, completed: 0, failed: 1 }); });
  it('skips a job claimed by another worker', async () => { state.claimed = false; const response = await POST(request()); expect(await response.json()).toMatchObject({ skipped: 1, completed: 0, failed: 0 }); expect(state.calls).toHaveLength(0); });
  it('requires the scheduler secret', async () => { expect((await POST(request(false))).status).toBe(401); expect(state.calls).toHaveLength(0); });
});
