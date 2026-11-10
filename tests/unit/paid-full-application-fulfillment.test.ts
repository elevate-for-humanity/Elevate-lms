import { beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ writes: [] as any[], welcome: vi.fn() }));
vi.mock('@/lib/store/fulfill-hvac-course', () => ({ fulfillHvacCourseBundle: vi.fn() }));
vi.mock('@/lib/platform/fulfillment', () => ({ fulfillPlatformSaasSubscription: vi.fn() }));
vi.mock('@/lib/enrollment/apprenticeship-welcome', () => ({ queuePaidProgramWelcome: state.welcome, queueApprenticeshipWelcome: state.welcome }));
vi.mock('@/lib/email/sendgrid', () => ({ sendEmail: vi.fn() }));
vi.mock('@/lib/billing/notify-student-payment', () => ({ notifyAdminOfStudentPayment: vi.fn() }));
vi.mock('@/lib/billing/school-invoice-order', () => ({ recordSchoolInvoiceOrder: async () => null }));
import { fulfillPaidBillingInvoice } from '@/lib/billing/fulfillment';
const db = { from: (table: string) => {
  const q: any = { update: (value: any) => { state.writes.push({ table, value }); return q; }, eq: () => q,
    then: (resolve: any) => Promise.resolve({ error: null }).then(resolve) };
  return q;
} };
beforeEach(() => { state.writes = []; state.welcome.mockReset(); });
it('confirmed deposit waits for the full application, without activating access or sending an enrollment welcome', async () => {
  await fulfillPaidBillingInvoice(db, { billing_invoice_id: 'invoice', fulfillment_type: 'program_enrollment',
    payload: { enrollment_id: 'e', student_id: 'u', amount_cents: 60000, full_application_required: true } });
  expect(state.writes).toEqual([{ table: 'program_enrollments', value: expect.objectContaining({
    status: 'pending', payment_status: 'paid', next_required_action: 'FULL_APPLICATION',
  }) }]);
  expect(state.writes[0].value).not.toHaveProperty('access_granted_at');
  expect(state.welcome).not.toHaveBeenCalled();
});
it('preserves the existing legacy paid enrollment fulfillment contract', async () => {
  await fulfillPaidBillingInvoice(db, { billing_invoice_id: 'invoice', fulfillment_type: 'program_enrollment',
    payload: { enrollment_id: 'e', student_id: 'u', amount_cents: 60000 } });
  expect(state.writes[0].value).toMatchObject({ status: 'active', payment_status: 'paid' });
  expect(state.welcome).toHaveBeenCalledWith(db, 'e');
});
