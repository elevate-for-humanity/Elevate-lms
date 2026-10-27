import { expect, it, vi } from 'vitest';
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: vi.fn() }));
vi.mock('@/lib/email/sendgrid', () => ({ sendEmail: vi.fn() }));
import { interviewReply, EMAIL_INTERVIEW_QUESTIONS } from '@/lib/email/paris-mail';
it('starts with question one and advances one answer at a time', () => {
  expect(interviewReply('Yes I am interested', 0, false).next).toBe(0);
  expect(interviewReply('I want barbering', 0, true).next).toBe(1);
  expect(EMAIL_INTERVIEW_QUESTIONS).toHaveLength(8);
});
it('finishes with staff review rather than claiming admission or funding', () => {
  const final = interviewReply('My last answer', 7, true);
  expect(final.next).toBe(8);
  expect(final.reply).toContain('admissions team to review');
});
it('honors an applicant asking to stop', () => {
  expect(interviewReply('Not interested, remove me', 3, true)).toMatchObject({
    closed: true,
    next: 3,
  });
});
