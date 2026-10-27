// @vitest-environment node
import { beforeEach, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
const state = vi.hoisted(() => ({
  user: { id: 'user-1', email: 'test@example.invalid' } as { id: string; email: string } | null,
  found: true,
  saved: true,
  writes: [] as Record<string, unknown>[],
  filters: [] as [string, unknown][],
  offer: {} as Record<string, unknown>,
  secrets: {} as Record<string, string>,
  companyName: 'Elevate for Humanity',
  invoices: 0,
}));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/secrets', () => ({ getSecrets: async () => state.secrets }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user } }) },
    from: () => {
      const q = {
        update: (data: Record<string, unknown>) => {
          state.writes.push(data);
          return q;
        },
        eq: (k: string, v: unknown) => {
          state.filters.push([k, v]);
          return q;
        },
        select: () => q,
        maybeSingle: async () => ({ data: state.saved ? { id: 'return-1' } : null, error: null }),
      };
      return q;
    },
  }),
}));
vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: async () => ({
    from: () => {
      const q = {
        select: () => q,
        eq: () => q,
        single: async () => ({ data: { id: 'invoice-1' }, error: null }),
      };
      return q;
    },
  }),
}));
vi.mock('@/lib/billing/providers/quickbooks', () => ({
  createQuickBooksBillingProvider: () => ({
    createManualInvoice: async () => {
      state.invoices++;
      return { paymentUrl: 'https://connect.intuit.com/portal/invoice-1', totalCents: 5000 };
    },
  }),
}));
vi.mock('@/lib/integrations/quickbooks-client', () => ({
  loadQuickBooksConfig: async () => ({ realmId: '123456' }),
  quickBooksRequest: async () => ({
    CompanyInfo: { LegalName: state.companyName, CompanyName: state.companyName },
  }),
}));
vi.mock('@/lib/tax-software/server/checkout-offer', () => ({
  loadTaxCheckoutOffer: async (_db: unknown, _id: string, owner: string) => {
    state.filters.push(['offerOwner', owner]);
    return state.found ? state.offer : null;
  },
}));
import { GET, POST } from '@/apps/marketing/app/api/tax/returns/checkout/route';
const id = '00000000-0000-4000-8000-000000000010',
  digest = 'a'.repeat(64);
const req = (body: Record<string, unknown>) =>
  new NextRequest('https://www.elevateforhumanity.org/api/tax/returns/checkout', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ returnId: id, quoteDigest: digest, ...body }),
  });
beforeEach(() => {
  state.user = { id: 'user-1', email: 'test@example.invalid' };
  state.found = true;
  state.saved = true;
  state.writes = [];
  state.filters = [];
  state.secrets = {};
  state.invoices = 0;
  state.companyName = 'Elevate for Humanity';
  state.offer = {
    record: { id, status: 'in_progress', return_json: {}, updated_at: 'stamp' },
    quoteDigest: digest,
    options: {
      noFeeDue: false,
      canRequestRefundTransfer: true,
      upfrontAmountCents: 5000,
      providerFeeCents: null,
      feeSchedule: null,
    },
  };
});
it('requires authentication and does not overpost fees or approval', async () => {
  state.user = null;
  expect((await POST(req({ method: 'upfront' }))).status).toBe(401);
  state.user = { id: 'user-1', email: 'test@example.invalid' };
  expect((await POST(req({ method: 'refund_transfer', bankSubmitted: true }))).status).toBe(400);
  expect(state.writes).toHaveLength(0);
  expect(state.invoices).toBe(0);
});
it('looks up only the authenticated owner and conceals missing returns', async () => {
  state.found = false;
  expect((await POST(req({ method: 'refund_transfer' }))).status).toBe(404);
  expect(state.filters).toContainEqual(['offerOwner', 'user-1']);
});
it('saves an EPS request without bank consent, payment or submission claims', async () => {
  const response = await POST(req({ method: 'refund_transfer' }));
  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toContain('no-store');
  expect(state.writes[0].return_json).toMatchObject({
    checkout: {
      provider: 'eps',
      status: 'awaiting_eps_application',
      officeDba: 'Supersonic Fast Cash',
      officeDepositBank: 'Lili',
      bankAgreementSigned: false,
      consent7216Recorded: false,
      bankSubmitted: false,
    },
  });
  expect(state.filters).toContainEqual(['updated_at', 'stamp']);
  expect(state.invoices).toBe(0);
});
it('saves upfront preference without using the platform merchant when the tax account is not verified', async () => {
  const response = await POST(req({ method: 'upfront' }));
  expect((await response.json()).status).toBe('awaiting_office_payment_setup');
  expect(state.invoices).toBe(0);
});
it('rejects an Elevate merchant before any invoice is created', async () => {
  state.secrets.TAX_OFFICE_PAYMENT_PROFILE_JSON = JSON.stringify({
    legalName: 'HOTT KAMODITTY',
    dba: 'Supersonic Fast Cash',
    depositBank: 'Lili',
    accountLast4: '1234',
    settlementAccountReference: 'synthetic',
    verificationReference: 'synthetic',
    verifiedAt: '2026-01-01T00:00:00Z',
    quickbooksRealmId: '123456',
  });
  expect((await POST(req({ method: 'upfront' }))).status).toBe(503);
  expect(state.invoices).toBe(0);
  expect(state.writes).toHaveLength(0);
});
it('rejects stale quotes and conflicting return updates', async () => {
  expect((await POST(req({ method: 'refund_transfer', quoteDigest: 'b'.repeat(64) }))).status).toBe(
    409,
  );
  state.saved = false;
  expect((await POST(req({ method: 'refund_transfer' }))).status).toBe(409);
});
it('creates an unpaid invoice only for the verified Supersonic merchant', async () => {
  state.companyName = 'HOTT KAMODITTY';
  state.secrets.TAX_OFFICE_PAYMENT_PROFILE_JSON = JSON.stringify({
    legalName: 'HOTT KAMODITTY',
    dba: 'Supersonic Fast Cash',
    depositBank: 'Lili',
    accountLast4: '1234',
    settlementAccountReference: 'synthetic',
    verificationReference: 'synthetic',
    verifiedAt: '2026-01-01T00:00:00Z',
    quickbooksRealmId: '123456',
  });
  const response = await POST(req({ method: 'upfront' }));
  expect(response.status).toBe(200);
  expect(state.invoices).toBe(1);
  expect(await response.json()).toMatchObject({ status: 'invoice_open', invoiceId: 'invoice-1' });
  expect(state.writes[0].return_json).toMatchObject({
    checkout: { status: 'invoice_open', officeDba: 'Supersonic Fast Cash' },
  });
});
it('refuses pay-by-refund when the calculated refund cannot cover fees', async () => {
  (state.offer.options as Record<string, unknown>).canRequestRefundTransfer = false;
  expect((await POST(req({ method: 'refund_transfer' }))).status).toBe(422);
  expect(state.writes).toHaveLength(0);
  expect(state.invoices).toBe(0);
});
it('returns only display options and never private taxpayer data', async () => {
  const response = await GET(
    new NextRequest('https://www.elevateforhumanity.org/api/tax/returns/checkout?returnId=' + id),
  );
  const json = await response.json();
  expect(json).not.toHaveProperty('record');
  expect(json.upfrontConfigured).toBe(false);
});
