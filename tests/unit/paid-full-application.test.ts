import { describe, it, expect, vi, beforeEach } from 'vitest';

const fixture = vi.hoisted(() => ({ user: { id: 'u', email: 'learner@example.org' } as any, rows: {} as Record<string, any>, writes: [] as any[] }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser: async () => ({ data: { user: fixture.user } }) } }) }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({ from(table: string) {
  let value: any;
  const filters: Record<string, any> = {};
  const query: any = {
    select: () => query, eq: (key: string, v: any) => { filters[key] = v; return query; },
    is: () => query, in: () => query,
    update: (v: any) => { value = v; return query; },
    maybeSingle: async () => ({ data: fixture.rows[table], error: null }),
    single: async () => { fixture.writes.push({ table, value, filters }); return { data: { id: filters.id }, error: null }; },
    then: (resolve: any) => { fixture.writes.push({ table, value, filters }); return Promise.resolve({ error: null }).then(resolve); },
  }; return query;
} }) }));
vi.mock('@/lib/enrollment/apprenticeship-welcome', () => ({ queuePaidProgramWelcome: vi.fn(async () => {}) }));
import { verifyPaidApplication, activatePaidApplication } from '@/lib/enrollment/paid-application';
import { getInitialProgramInvoiceCents } from '@/lib/programs/deposit-policy';
import { resolveQuickBooksProgramPromotion } from '@/lib/payments/quickbooks-program-promotion';

beforeEach(() => {
  fixture.user = { id: 'u', email: 'learner@example.org' };
  fixture.writes = [];
  fixture.rows = {
    programs: { id: 'p', slug: 'nail-technician-apprenticeship', price: 6000 },
    program_enrollments: { id: 'e', status: 'pending', student_id: 'u', program_id: 'p' },
    billing_invoices: { id: 'i', status: 'paid', paid_at: '2026-11-09T10:00:00Z', total_cents: 60000,
      customer_email: 'LEARNER@example.org', fulfillment_type: 'program_enrollment', provider: 'quickbooks',
      fulfillment_payload: { student_id: 'u', program_slug: 'nail-technician-apprenticeship', program_id: 'p', enrollment_id: 'e', required_amount_cents: 60000 } },
  };
});
describe('paid full application gate', () => {
  it('preserves approved admission state when the same paid invoice is retried', async () => {
    Object.assign(fixture.rows.program_enrollments, {
      status: 'active', payment_reference: 'i', payment_status: 'paid',
      approved_at: '2026-11-09T11:00:00Z', approved_by: 'admin',
      access_granted_at: '2026-11-09T11:00:00Z', access_status: 'active',
    });
    const proof = await verifyPaidApplication('nail-technician-apprenticeship', 'i');
    expect(await activatePaidApplication(proof!, 'original-application')).toBe('https://app.elevateforhumanity.org/lms/dashboard');
    expect(fixture.writes).toEqual([]);
  });
  it('never relinks an active enrollment to a different invoice', async () => {
    Object.assign(fixture.rows.program_enrollments, { status: 'active', payment_reference: 'other-invoice' });
    const proof = await verifyPaidApplication('nail-technician-apprenticeship', 'i');
    await expect(activatePaidApplication(proof!, 'original-application')).rejects.toThrow('administrator review');
    expect(fixture.writes).toEqual([]);
  });
  it('does not grant access to an active enrollment lacking approval evidence on retry', async () => {
    Object.assign(fixture.rows.program_enrollments, { status: 'active', payment_reference: 'i' });
    const proof = await verifyPaidApplication('nail-technician-apprenticeship', 'i');
    expect(await activatePaidApplication(proof!, 'original-application')).toBe('https://app.elevateforhumanity.org/lms/access-pending');
    expect(fixture.writes).toEqual([]);
  });
  it('verifies owned paid deposit without trusting a URL flag', async () => {
    expect(await verifyPaidApplication('nail-technician-apprenticeship', 'i')).not.toBeNull();
    expect(fixture.writes).toEqual([]);
  });
  it.each(['unsigned', 'open', 'no-date', 'other-user', 'wrong-program', 'wrong-email', 'underpayment', 'revoked'])('rejects %s', async condition => {
    const invoice = fixture.rows.billing_invoices;
    if (condition === 'unsigned') fixture.user = null;
    if (condition === 'open') invoice.status = 'open';
    if (condition === 'no-date') invoice.paid_at = null;
    if (condition === 'other-user') invoice.fulfillment_payload.student_id = 'other';
    if (condition === 'wrong-program') invoice.fulfillment_payload.program_id = 'other';
    if (condition === 'wrong-email') invoice.customer_email = 'other@example.org';
    if (condition === 'underpayment') invoice.total_cents = 35000;
    if (condition === 'revoked') fixture.rows.program_enrollments.revoked_at = '2026-11-08';
    expect(await verifyPaidApplication('nail-technician-apprenticeship', 'i')).toBeNull();
    expect(fixture.writes).toEqual([]);
  });
  it('records payment but keeps enrollment pending until administrator approval', async () => {
    const proof = await verifyPaidApplication('nail-technician-apprenticeship', 'i');
    expect(await activatePaidApplication(proof!, 'original-application')).toBe('https://app.elevateforhumanity.org/lms/access-pending');
    expect(fixture.writes[0]).toMatchObject({ table: 'applications', filters: { id: 'original-application' }, value: { enrollment_id: 'e', payment_status: 'paid' } });
    expect(fixture.writes[1]).toMatchObject({ table: 'program_enrollments', filters: { id: 'e', student_id: 'u' }, value: { payment_status: 'paid', next_required_action: 'ADMIN_APPROVAL_REQUIRED' } });
    expect(fixture.writes[1].value.access_granted_at).toBeUndefined();
    expect(fixture.writes[1].value.approved_at).toBeUndefined();
    expect(fixture.writes[2]).toMatchObject({ table: 'profiles', filters: { id: 'u' }, value: { enrollment_status: 'pending' } });
  });
});
describe('standard deposit and validated promotional deposit', () => {
  it('uses $600 for apprenticeships and never $350', () => {
    for (const slug of ['barber-apprenticeship', 'nail-technician-apprenticeship', 'esthetician-apprenticeship', 'cosmetology-apprenticeship'])
      expect(getInitialProgramInvoiceCents(slug, 600000)).toBe(60000);
  });
  function promo(row: any): any { const q: any = { select: () => q, eq: () => q, maybeSingle: async () => ({ data: row, error: null }) }; return { from: () => q }; }
  it('only an active valid coupon can reduce the deposit to $300', async () => {
    expect(await resolveQuickBooksProgramPromotion({ admin: promo(null), code: 'OCT300', amountCents: 600000, depositCents: 60000 })).toHaveProperty('error');
    const row = { code: 'SPECIAL', discount_type: 'fixed', discount_value: 300, applies_to: 'program_deposit' };
    expect(await resolveQuickBooksProgramPromotion({ admin: promo(row), code: 'SPECIAL', amountCents: 600000, depositCents: 60000 })).toEqual({ promotion: { code: 'SPECIAL', scope: 'deposit', discountAmountCents: 30000 } });
    expect(await resolveQuickBooksProgramPromotion({ admin: promo({ ...row, valid_until: '2026-10-31' }), code: 'SPECIAL', amountCents: 600000, depositCents: 60000 })).toHaveProperty('error');
    expect(await resolveQuickBooksProgramPromotion({ admin: promo(row), code: 'SPECIAL', amountCents: 600000 })).toHaveProperty('error');
  });
});
