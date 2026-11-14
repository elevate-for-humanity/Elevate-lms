import { beforeEach, describe, expect, it, vi } from 'vitest';
const { sendEmail } = vi.hoisted(() => ({ sendEmail: vi.fn() }));
vi.mock('@/lib/email/sendgrid', () => ({ sendEmail }));
import { notifyAdminOfStudentPayment } from '@/lib/billing/notify-student-payment';
function database(alreadySent = false) {
  return {
    from: vi.fn((table: string) => {
      const result =
        table === 'email_logs'
          ? { data: alreadySent ? [{ id: 'mail' }] : [], error: null }
          : table === 'profiles'
            ? { data: { full_name: '<Student>', email: 'student@example.com' }, error: null }
            : { data: { user_id: 'user', program_slug: 'cdl-training' }, error: null };
      const chain: any = {};
      for (const method of ['select', 'eq']) chain[method] = vi.fn(() => chain);
      chain.limit = vi.fn(async () => result);
      chain.maybeSingle = vi.fn(async () => result);
      return chain;
    }),
  };
}
describe('confirmed student payment notification', () => {
  beforeEach(() => {
    sendEmail.mockReset();
    sendEmail.mockResolvedValue({ success: true });
  });
  it('sends an escaped student summary and enrollment action without claiming full tuition paid', async () => {
    await notifyAdminOfStudentPayment(database(), 'invoice-1', {
      enrollment_id: 'enrollment',
      amount_cents: 125000,
    });
    expect(sendEmail).toHaveBeenCalledOnce();
    const message = sendEmail.mock.calls[0][0];
    expect(message.html).toContain('&lt;Student&gt;');
    expect(message.html).toContain('$1250.00');
    expect(message.html).toContain('confirm the training provider and start date');
    expect(message.html).toContain('does not establish that all tuition is paid');
  });
  it('does not resend a previously accepted notification', async () => {
    await notifyAdminOfStudentPayment(database(true), 'invoice-1', {});
    expect(sendEmail).not.toHaveBeenCalled();
  });
  it('fails the job when the email transport fails so the worker can retry', async () => {
    sendEmail.mockResolvedValue({ success: false, error: 'Transport unavailable' });
    await expect(
      notifyAdminOfStudentPayment(database(), 'invoice-1', {
        enrollment_id: 'enrollment',
        amount_cents: 125000,
      }),
    ).rejects.toThrow('Transport unavailable');
  });
});
