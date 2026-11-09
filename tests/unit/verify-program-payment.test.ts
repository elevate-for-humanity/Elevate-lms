import { beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ invoice: {} as any, writes: [] as any[], reads: vi.fn() }));
vi.mock('@/lib/integrations/quickbooks-client', () => ({ loadQuickBooksConfig: async () => ({}), quickBooksRequest: async () => { state.reads(); return { Invoice: state.invoice }; } }));
import { refreshOwnedProgramPayment } from '@/lib/billing/verify-program-payment';
const row = { id: 'ledger', customer_external_key: 'user:u', provider: 'quickbooks', provider_invoice_id: 'invoice', status: 'open', total_cents: 60000,
  fulfillment_type: 'program_enrollment', fulfillment_payload: { student_id: 'u', enrollment_id: 'e' }, provider_payload: { CustomerRef: { value: 'customer' } } };
const db = { from: (table: string) => {
  const q: any = { update: (value: any) => { state.writes.push({ table, value }); return q; }, eq: () => q, in: () => q,
    upsert: async (value: any) => { state.writes.push({ table, value }); return { error: null }; },
    then: (resolve: any) => Promise.resolve({ error: null }).then(resolve) };
  return q;
} };
beforeEach(() => { state.invoice = { Id: 'invoice', CustomerRef: { value: 'customer' }, TotalAmt: 600, Balance: 0 }; state.writes = []; state.reads.mockReset(); });
it('records provider-confirmed payment and queues fulfillment when a callback is delayed', async () => {
  await refreshOwnedProgramPayment(db, row, 'u');
  expect(state.writes[0]).toMatchObject({ table: 'billing_invoices', value: { status: 'paid' } });
  expect(state.writes[1]).toMatchObject({ table: 'billing_fulfillment_jobs', value: { billing_invoice_id: 'ledger', status: 'pending' } });
});
it.each([{ Balance: 600 }, { Balance: 100 }, { TxnStatus: 'voided' }])('does not mark an unpaid/partial/void invoice paid: %j', async changes => {
  Object.assign(state.invoice, changes); await refreshOwnedProgramPayment(db, row, 'u'); expect(state.writes).toEqual([]);
});
it.each([{ Id: 'other' }, { TotalAmt: 350 }, { CustomerRef: { value: 'other' } }, { Balance: undefined }])('rejects mismatched or incomplete provider evidence: %j', async changes => {
  Object.assign(state.invoice, changes); await expect(refreshOwnedProgramPayment(db, row, 'u')).rejects.toThrow(); expect(state.writes).toEqual([]);
});
it('rejects another learner before contacting the provider', async () => {
  await expect(refreshOwnedProgramPayment(db, row, 'other')).rejects.toThrow(); expect(state.reads).not.toHaveBeenCalled();
});
it('does not replay a recorded paid invoice', async () => {
  await refreshOwnedProgramPayment(db, { ...row, status: 'paid' }, 'u'); expect(state.reads).not.toHaveBeenCalled(); expect(state.writes).toEqual([]);
});
