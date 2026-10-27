import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const state = vi.hoisted(() => ({ assigned: true, tables: [] as string[], createInvoice: vi.fn() }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: vi.fn(async () => null) }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({
  auth: { getUser: async () => ({ data: { user: { id: 'student', email: 'student@example.test' } } }) },
  from(table: string) {
    const q: any = { select: () => q, eq: () => q, in: () => q,
      maybeSingle: async () => ({ data: table === 'profiles' ? { email: 'student@example.test', full_name: 'Test student' } : null }) };
    return q;
  },
}) }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({
  from(table: string) {
    state.tables.push(table);
    const q: any = { select: () => q, eq: () => q, insert: () => q,
      single: async () => ({ data: { id: 'enrollment' }, error: null }),
      maybeSingle: async () => ({ error: null, data: table === 'programs' ? {
        id: 'fb36dbf1-db3c-4d34-adf9-3f98f397d371', title: 'CNA', slug: 'cna', price: 1100, status: 'active',
      } : state.assigned ? { id: 'assignment' } : null }) };
    return q;
  },
}) }));
vi.mock('@/lib/billing/providers/quickbooks', () => ({ createQuickBooksBillingProvider: () => ({ createManualInvoice: state.createInvoice }) }));
vi.mock('@/lib/affirm/client', () => ({ affirm: {} }));
vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: vi.fn() }));

import { POST } from '../../apps/marketing/app/api/programs/enroll/checkout/route';
const request = (extra = {}) => new NextRequest('https://www.elevateforhumanity.org/api/programs/enroll/checkout', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ program_id: 'fb36dbf1-db3c-4d34-adf9-3f98f397d371', payment_method: 'quickbooks', ...extra }),
});

describe('school invoice tuition checkout', () => {
  beforeEach(() => {
    state.assigned = true; state.tables = [];
    state.createInvoice.mockReset().mockResolvedValue({ providerInvoiceId: '42', paymentUrl: 'https://example.test/pay' });
  });
  it('creates the $2,200 Elevate invoice without requiring a school checkout or PayPal payout account', async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, url: 'https://example.test/pay' });
    expect(state.createInvoice).toHaveBeenCalledOnce();
    const input = state.createInvoice.mock.calls[0][0];
    expect(input.lines[0].unitAmountCents).toBe(220000);
    expect(input.fulfillment.payload.program_holder_id).toBe('ac01769d-c1d9-496c-981e-f7963e6d0f48');
    expect(state.tables).not.toContain('payout_schedules');
    expect(state.tables).not.toContain('program_holder_payouts');
  });
  it('does not issue a school-program invoice when its assignment is inactive', async () => {
    state.assigned = false;
    expect((await POST(request())).status).toBe(409);
    expect(state.createInvoice).not.toHaveBeenCalled();
  });
  it('rejects partial tuition before creating an invoice', async () => {
    expect((await POST(request({ payment_plan: 'installments' }))).status).toBe(400);
    expect(state.createInvoice).not.toHaveBeenCalled();
  });
});
