import { describe, it, expect, vi, beforeEach } from 'vitest';

// Real payment-gate code under test; only the database transport is stubbed.
const fixture = vi.hoisted(() => ({
  user: { id: 'student-1', email: 'apprentice@example.org' } as any,
  invoice: {} as any,
  program: {} as any,
  enrollment: {} as any,
  writes: [] as any[],
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user: fixture.user } }) } }),
}));

vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: async () => ({
    from(table: string) {
      let value: any;
      const filters: Record<string, any> = {};
      const query: any = {
        select: () => query,
        eq: (key: string, v: any) => { filters[key] = v; return query; },
        is: () => query,
        in: () => query,
        update: (v: any) => { value = v; return query; },
        upsert: (v: any) => { fixture.writes.push({ table, value: v, filters }); return query; },
        maybeSingle: async () => ({ data: table === 'billing_invoices' ? fixture.invoice
          : table === 'programs' ? fixture.program
          : table === 'program_enrollments' ? fixture.enrollment
          : null, error: null }),
        single: async () => { fixture.writes.push({ table, value, filters }); return { data: { id: filters.id }, error: null }; },
        then: (resolve: any) => { fixture.writes.push({ table, value, filters }); return Promise.resolve({ error: null }).then(resolve); },
      };
      return query;
    },
  }),
}));

vi.mock('@/lib/enrollment/apprenticeship-welcome', () => ({
  queuePaidProgramWelcome: vi.fn(async () => {}),
}));

import { queuePaidProgramWelcome } from '@/lib/enrollment/apprenticeship-welcome';
import { verifyPaidApplication, activatePaidApplication } from '@/lib/enrollment/paid-application';
import { requiresSelfPayProgramPayment, paidInvoiceMatchesProgram } from '@/lib/programs/paid-intake-policy.mjs';
import { getInitialProgramInvoiceCents } from '@/lib/programs/deposit-policy';
import { apprenticeshipPaymentError } from '@/lib/programs/apprenticeship-payment-policy';

// The three beauty apprenticeships share one intake path and one payment gate.
const BEAUTY = [
  { slug: 'barber-apprenticeship', title: 'Barber Apprenticeship' },
  { slug: 'cosmetology-apprenticeship', title: 'Cosmetology Apprenticeship' },
  { slug: 'esthetician-apprenticeship', title: 'Esthetician Apprenticeship' },
];
const TUITION_CENTS = 600000;
const REQUIRED_DEPOSIT_CENTS = 60000; // $600

function programFor(slug: string) {
  return { id: `program-${slug}`, slug, is_apprenticeship: true, is_free: false, price: TUITION_CENTS / 100 };
}

function paidInvoiceFor(slug: string, overrides: Record<string, any> = {}) {
  return {
    id: 'invoice-1',
    status: 'paid',
    paid_at: '2026-11-11T10:00:00Z',
    total_cents: REQUIRED_DEPOSIT_CENTS,
    customer_email: 'APPRENTICE@example.org',
    fulfillment_type: 'apprenticeship_deposit',
    provider: 'quickbooks',
    fulfillment_payload: {
      student_id: 'student-1',
      program_slug: slug,
      program_id: `program-${slug}`,
      enrollment_id: 'enrollment-1',
      required_amount_cents: REQUIRED_DEPOSIT_CENTS,
    },
    ...overrides,
  };
}

beforeEach(() => {
  fixture.user = { id: 'student-1', email: 'apprentice@example.org' };
  fixture.writes = [];
  fixture.enrollment = { id: 'enrollment-1', status: 'pending', student_id: 'student-1', program_id: 'program-barber-apprenticeship' };
});

describe.each(BEAUTY)('$title — payment is required before the application proceeds', ({ slug }) => {
  beforeEach(() => {
    fixture.program = programFor(slug);
    fixture.enrollment = { id: 'enrollment-1', status: 'pending', student_id: 'student-1', program_id: `program-${slug}` };
    fixture.invoice = paidInvoiceFor(slug);
  });

  it('blocks a full-enrollment application when no payment evidence exists', async () => {
    // No invoice id at all: the route returns 402 before saving the application.
    expect(await verifyPaidApplication(slug, undefined)).toBeNull();
    expect(fixture.writes).toEqual([]);
  });

  it('requires a self-pay deposit for this apprenticeship regardless of funding', () => {
    expect(requiresSelfPayProgramPayment(programFor(slug), 'wioa')).toBe(true);
    expect(requiresSelfPayProgramPayment(programFor(slug), 'self_pay')).toBe(true);
    expect(requiresSelfPayProgramPayment(programFor(slug), undefined)).toBe(true);
  });

  it('charges the $600 apprenticeship deposit, never a quarter of tuition', () => {
    expect(getInitialProgramInvoiceCents(slug, TUITION_CENTS)).toBe(REQUIRED_DEPOSIT_CENTS);
  });

  it('rejects every funded repayment method for this apprenticeship', () => {
    for (const method of ['wioa', 'wrg', 'fssa', 'jri', 'employer', 'employer_sponsored']) {
      expect(apprenticeshipPaymentError(slug, method)).toMatch(/self-pay only/i);
    }
    for (const method of ['self_pay', 'self-pay', 'payment_plan', 'bnpl']) {
      expect(apprenticeshipPaymentError(slug, method)).toBeNull();
    }
  });

  it('accepts an owned, matching, fully-paid deposit as evidence', async () => {
    const proof = await verifyPaidApplication(slug, 'invoice-1');
    expect(proof).not.toBeNull();
    expect(fixture.writes).toEqual([]); // verification alone writes nothing
  });

  it.each([
    ['unpaid invoice', { status: 'open' }],
    ['missing payment date', { paid_at: null }],
    ['another learner\'s invoice', { customer_email: 'someone.else@example.org' }],
    ['an underpaid deposit', { total_cents: 35000 }],
    ['a non-deposit fulfillment', { fulfillment_type: 'store_order' }],
  ])('still blocks on %s', async (_label, overrides) => {
    fixture.invoice = paidInvoiceFor(slug, overrides);
    expect(await verifyPaidApplication(slug, 'invoice-1')).toBeNull();
    expect(fixture.writes).toEqual([]);
  });

  it('blocks when the paid invoice belongs to a different program', async () => {
    fixture.invoice = paidInvoiceFor(slug);
    fixture.invoice.fulfillment_payload.program_id = 'program-somewhere-else';
    expect(await verifyPaidApplication(slug, 'invoice-1')).toBeNull();
  });

  it('blocks a revoked enrollment even with a valid paid deposit', async () => {
    fixture.enrollment = { id: 'enrollment-1', status: 'pending', student_id: 'student-1',
      program_id: `program-${slug}`, revoked_at: '2026-11-01' };
    expect(await verifyPaidApplication(slug, 'invoice-1')).toBeNull();
  });

  it('activates enrollment, application and dashboard only after verified payment', async () => {
    const proof = await verifyPaidApplication(slug, 'invoice-1');
    const destination = await activatePaidApplication(proof!, 'application-1');
    expect(destination).toBe('https://app.elevateforhumanity.org/apprentice');
    expect(fixture.writes).toEqual(expect.arrayContaining([
      expect.objectContaining({ table: 'applications', value: expect.objectContaining({ payment_status: 'paid' }) }),
      expect.objectContaining({ table: 'program_enrollments', value: expect.objectContaining({ status: 'active' }) }),
      expect.objectContaining({ table: 'profiles', value: expect.objectContaining({ portal_type: 'apprentice' }) }),
    ]));
  });

  it('never treats a client-supplied paid flag as evidence', async () => {
    // paidInvoiceMatchesProgram is the server-side authority; a URL flag is only a locator.
    expect(paidInvoiceMatchesProgram({ status: 'open', total_cents: REQUIRED_DEPOSIT_CENTS,
      fulfillment_type: 'apprenticeship_deposit', customer_email: 'apprentice@example.org',
      fulfillment_payload: { program_slug: slug } }, programFor(slug), 'apprentice@example.org')).toBe(false);
  });

  it('sends no welcome notification until payment is verified and the application is activated', async () => {
    vi.mocked(queuePaidProgramWelcome).mockClear();
    // An unpaid attempt must not notify the learner at all.
    expect(await verifyPaidApplication(slug, undefined)).toBeNull();
    expect(queuePaidProgramWelcome).not.toHaveBeenCalled();

    // Activation is the only path that queues the welcome.
    const proof = await verifyPaidApplication(slug, 'invoice-1');
    await activatePaidApplication(proof!, 'application-1');
    expect(queuePaidProgramWelcome).toHaveBeenCalledWith(expect.anything(), 'enrollment-1');
  });
});

describe('beauty programs stay isolated from one another', () => {
  it('a barber deposit cannot unlock cosmetology or esthetician', async () => {
    fixture.invoice = paidInvoiceFor('barber-apprenticeship');
    for (const slug of ['cosmetology-apprenticeship', 'esthetician-apprenticeship']) {
      fixture.program = programFor(slug);
      fixture.enrollment = { id: 'enrollment-1', status: 'pending', student_id: 'student-1', program_id: `program-${slug}` };
      expect(await verifyPaidApplication(slug, 'invoice-1')).toBeNull();
    }
  });

  it('a free program is never payment-gated', () => {
    expect(requiresSelfPayProgramPayment({ id: 'p', slug: 'barber-apprenticeship', is_free: true }, undefined)).toBe(false);
  });

  it('rejects incomplete program metadata rather than guessing', () => {
    expect(() => requiresSelfPayProgramPayment({ slug: 'barber-apprenticeship' }, 'self_pay')).toThrow(/metadata unavailable/i);
  });
});
