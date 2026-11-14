import { describe, it, expect, vi } from 'vitest';
import {
  storeBillingKeys,
  loadStoreBilling,
  quickBooksPaymentHref,
} from '@/lib/store/customer-billing';
import { recordStoreSubscriptionPayment } from '@/lib/store/subscription-ledger';
const user = '11111111-1111-4111-8111-111111111111';
function fixture(rows: Record<string, any[]> = {}, failure = '') {
  const calls: any[] = [];
  const db = {
    from: (table: string) => {
      const call = { table, filters: [] as any[] };
      calls.push(call);
      const q: any = {
        select: () => q,
        eq: (...args: any[]) => {
          call.filters.push(['eq', ...args]);
          return q;
        },
        in: (...args: any[]) => {
          call.filters.push(['in', ...args]);
          return q;
        },
        order: () => q,
        limit: () => q,
        then: (resolve: any) =>
          Promise.resolve({
            data: rows[table] || [],
            error: failure === table ? { message: 'private error' } : null,
          }).then(resolve),
      };
      return q;
    },
  };
  return { db, calls };
}
describe('Store billing ownership and QuickBooks delivery', () => {
  it('individual customers need no organization to see their invoices', async () => {
    const f = fixture();
    expect(await storeBillingKeys(f.db, user)).toEqual(['user:' + user]);
    expect(f.calls.some((c) => c.table === 'profiles')).toBe(false);
  });
  it('uses explicit owner memberships rather than profile organization pointers', async () => {
    const f = fixture({
      tenant_memberships: [{ tenant_id: 'tenant' }],
      organizations: [{ id: 'org' }],
    });
    expect(await storeBillingKeys(f.db, user)).toEqual(['user:' + user, 'organization:org']);
    expect(f.calls[0].filters).toContainEqual(['in', 'role', ['owner', 'admin']]);
    expect(f.calls[1].filters).toContainEqual(['eq', 'status', 'active']);
  });
  it('fails closed if membership lookup fails', async () => {
    await expect(storeBillingKeys(fixture({}, 'tenant_memberships').db, user)).rejects.toThrow(
      'ownership',
    );
  });
  it('does not authorize invoices by a mutable email address', async () => {
    const f = fixture({
      billing_invoices: [{ payment_url: 'https://connect.intuit.com/pay/123' }],
    });
    const result = await loadStoreBilling(f.db, user);
    expect(result.invoices[0].payment_url).toBe('https://connect.intuit.com/pay/123');
    const invoice = f.calls.find((c) => c.table === 'billing_invoices');
    expect(invoice.filters).toContainEqual(['in', 'customer_external_key', ['user:' + user]]);
    expect(JSON.stringify(invoice.filters)).not.toContain('customer_email');
  });
  it('does not display an empty billing success on a database failure', async () => {
    await expect(loadStoreBilling(fixture({}, 'billing_invoices').db, user)).rejects.toThrow(
      'temporarily unavailable',
    );
  });
  it.each([
    'javascript:alert(1)',
    'https://intuit.com.evil.test/pay',
    'https://intuit.com@evil.test/pay',
    'http://connect.intuit.com/pay',
  ])('rejects unsafe invoice URL %s', (value) => expect(quickBooksPaymentHref(value)).toBeNull());
  it('preserves official QuickBooks payment links', () =>
    expect(quickBooksPaymentHref('https://connect.intuit.com/portal/invoice')).toBe(
      'https://connect.intuit.com/portal/invoice',
    ));
  it('requires Store acknowledgement before reporting subscription delivery', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://cuxzzpsyufcewtmicszk.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'fixture-private');
    const request = vi.fn(async () =>
      Response.json({ ok: true, subscription_id: user, replayed: true }),
    );
    expect(await recordStoreSubscriptionPayment(user, request as any)).toEqual({
      subscriptionId: user,
      replayed: true,
    });
    const [url, init] = request.mock.calls[0] as any;
    expect(url).toContain('ebnbeqdsuxygopetptlv.supabase.co/functions/');
    expect(JSON.parse(init.body)).toEqual({ invoice_id: user });
    expect(init.redirect).toBe('error');
  });
  it('keeps a failed Store acknowledgement retryable and suppresses private error details', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://cuxzzpsyufcewtmicszk.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'fixture-private');
    await expect(
      recordStoreSubscriptionPayment(user, async () =>
        Response.json({ error: 'private provider payload' }, { status: 503 }),
      ),
    ).rejects.toThrow('Store database has not confirmed');
  });
});
