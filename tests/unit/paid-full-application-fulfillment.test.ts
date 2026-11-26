import { beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ writes: [] as any[], welcome: vi.fn() }));
vi.mock('@/lib/store/fulfill-hvac-course', () => ({ fulfillHvacCourseBundle: vi.fn() }));
vi.mock('@/lib/platform/fulfillment', () => ({ fulfillPlatformSaasSubscription: vi.fn() }));
vi.mock('@/lib/enrollment/apprenticeship-welcome', () => ({ queuePaidProgramWelcome: state.welcome, queueApprenticeshipWelcome: state.welcome }));
vi.mock('@/lib/email/sendgrid', () => ({ sendEmail: vi.fn() }));
vi.mock('@/lib/billing/notify-student-payment', () => ({ notifyAdminOfStudentPayment: vi.fn() }));
vi.mock('@/lib/billing/school-invoice-order', () => ({ recordSchoolInvoiceOrder: async () => null }));
import { fulfillPaidBillingInvoice } from '@/lib/billing/fulfillment';
// Model the persisted enrollment and the read-back used by the real access
// grant, rather than stubbing out the payment/approval predicate.
let enrollment: Record<string, unknown>;
const reads: Array<{ table: string; columns: string }> = [];
const db = { from: (table: string) => {
  let values: Record<string, unknown> | undefined;
  const filters: Array<[string, unknown]> = [];
  const matches = () => filters.every(([key, value]) => enrollment[key] === value);
  const q: any = {
    update: (value: Record<string, unknown>) => { values = value; return q; },
    select: (columns: string) => { reads.push({ table, columns }); return q; },
    eq: (key: string, value: unknown) => { filters.push([key, value]); return q; },
    maybeSingle: async () => ({ data: matches() ? { ...enrollment } : null, error: null }),
    then: (resolve: any) => {
      if (values && matches()) {
        state.writes.push({ table, value: values });
        enrollment = { ...enrollment, ...values };
      }
      return Promise.resolve({ error: null }).then(resolve);
    },
  };
  return q;
} };
beforeEach(() => {
  state.writes = [];
  reads.length = 0;
  state.welcome.mockReset();
  enrollment = { id: 'e', status: 'pending', payment_status: 'pending', funding_source: 'self_pay' };
});
it('confirmed deposit fully enrolls the student; the full application stays a follow-up, not a blocker', async () => {
  await fulfillPaidBillingInvoice(db, { billing_invoice_id: 'invoice', fulfillment_type: 'program_enrollment',
    payload: { enrollment_id: 'e', student_id: 'u', amount_cents: 60000, full_application_required: true } });
  expect(state.writes[0].value).toMatchObject({
    status: 'active', payment_status: 'paid', enrollment_state: 'active',
    next_required_action: 'FULL_APPLICATION',
  });
  expect(reads).toEqual([{ table: 'program_enrollments', columns: expect.stringContaining('payment_reference') }]);
  expect(state.writes).toHaveLength(2);
  expect(state.writes[1].value).toMatchObject({ access_status: 'active', access_granted_at: expect.any(String), self_pay_application_verified_at: expect.any(String) });
  expect(enrollment.payment_reference).toBe('invoice');
  expect(state.welcome).toHaveBeenCalledWith(db, 'e');
});
it('preserves the existing legacy paid enrollment fulfillment contract', async () => {
  await fulfillPaidBillingInvoice(db, { billing_invoice_id: 'invoice', fulfillment_type: 'program_enrollment',
    payload: { enrollment_id: 'e', student_id: 'u', amount_cents: 60000 } });
  expect(state.writes[0].value).toMatchObject({ status: 'active', payment_status: 'paid' });
  expect(reads).toEqual([{ table: 'program_enrollments', columns: expect.stringContaining('payment_reference') }]);
  expect(state.writes).toHaveLength(2);
  expect(state.writes[1].value).toMatchObject({ access_status: 'active', access_granted_at: expect.any(String), self_pay_application_verified_at: expect.any(String) });
  expect(enrollment.payment_reference).toBe('invoice');
  expect(state.welcome).toHaveBeenCalledWith(db, 'e');
});

