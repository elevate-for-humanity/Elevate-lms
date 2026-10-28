// @vitest-environment node
import { expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ from: vi.fn(), ensureRoom: vi.fn() }));
vi.mock('@/lib/auth/require-program-holder', () => ({ requireProgramHolder: async () => ({ mode: 'holder', user: { id: 'holder-user' }, holderId: 'holder', db: { from: mocks.from } }) }));
vi.mock('@/lib/calendar/google-calendar', () => { class CalendarConflictError extends Error {} return { CalendarConflictError, assertGoogleCalendarAvailable: async () => { throw new CalendarConflictError('This time overlaps a busy event in your Google Calendar. Choose another time.'); } }; });
vi.mock('@/lib/communications/livekit', () => ({ ensureLiveKitRoom: mocks.ensureRoom, liveKitReadiness: () => ({ ready: true }) }));
vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: async () => {} }));
vi.mock('@/lib/email/sendgrid', () => ({ sendEmail: vi.fn() }));
vi.mock('@/lib/email/assigned-student-directory', () => ({ studentContactHolderIds: vi.fn() }));
import { POST } from '@/apps/lms/app/api/program-holder/meetings/route';
it('rejects Google conflicts before creating a room, saving a meeting, or sending an invitation', async () => {
  const query: any = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: { id: 'assigned', user_id: 'student', applicant_name: 'Student' } }) };
  mocks.from.mockReturnValue(query);
  const response = await POST(new Request('https://app.elevateforhumanity.org/api/program-holder/meetings', { method: 'POST', body: JSON.stringify({ programHolderStudentId: 'assigned', startsAt: '2026-11-01T14:00:00Z', durationMinutes: 30, meetingMethod: 'video' }) }));
  expect(response.status).toBe(409);
  expect((await response.json()).error).toContain('overlaps');
  expect(mocks.ensureRoom).not.toHaveBeenCalled();
  expect(mocks.from.mock.calls.map(call => call[0])).toEqual(['program_holder_students']);
});
