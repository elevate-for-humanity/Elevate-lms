import { beforeEach, describe, expect, it, vi } from 'vitest';
const fulfill = vi.hoisted(() => vi.fn());
vi.mock('@/lib/platform/fulfillment', () => ({ fulfillPlatformSaasSubscription: fulfill }));
import { fulfillPaidBillingInvoice } from '@/lib/billing/fulfillment';
const job = {
  billing_invoice_id: 'invoice',
  fulfillment_type: 'platform_subscription',
  paid_at: '2026-01-31T15:45:00Z',
  customer_email: 'buyer@example.test',
  payload: {
    organization_id: 'billing-org',
    tenant_id: 'tenant',
    plan_id: 'business',
    billing_interval: 'monthly',
    addon_codes: ['ai-team'],
  },
};
beforeEach(() => {
  fulfill.mockReset();
  fulfill.mockResolvedValue({ ok: true });
});
describe('Paid invoice uses canonical SaaS delivery', () => {
  it('keeps billing and tenant identities separate and uses verified payment time', async () => {
    await fulfillPaidBillingInvoice({}, job);
    expect(fulfill).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        billing_organization_id: 'billing-org',
        tenant_id: 'tenant',
        billing_provider: 'quickbooks',
        customer_email: 'buyer@example.test',
        addon_slugs: 'ai-team',
        current_period_start: '2026-01-31T15:45:00.000Z',
        current_period_end: '2026-02-28T15:45:00.000Z',
      }),
    );
  });
  it('does not extend the paid period when a queue job is retried', async () => {
    await fulfillPaidBillingInvoice({}, job);
    await fulfillPaidBillingInvoice({}, job);
    expect(fulfill.mock.calls[0]).toEqual(fulfill.mock.calls[1]);
  });
  it('clamps annual leap-day renewals to the calendar', async () => {
    await fulfillPaidBillingInvoice(
      {},
      {
        ...job,
        paid_at: '2028-02-29T15:45:00Z',
        payload: { ...job.payload, billing_interval: 'annual' },
      },
    );
    expect(fulfill.mock.calls[0][1].current_period_end).toBe('2029-02-28T15:45:00.000Z');
  });
  it('does not report success after an atomic delivery failure', async () => {
    fulfill.mockResolvedValue({ ok: false, error: 'transaction rolled back' });
    await expect(fulfillPaidBillingInvoice({}, job)).rejects.toThrow('transaction rolled back');
  });
  it('requires a durable verified payment timestamp', async () => {
    await expect(fulfillPaidBillingInvoice({}, { ...job, paid_at: undefined })).rejects.toThrow(
      'Verified payment timestamp',
    );
    expect(fulfill).not.toHaveBeenCalled();
  });
});
