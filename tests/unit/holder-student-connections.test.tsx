import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
vi.mock('next/image', () => ({ default: (props: any) => <img alt={props.alt} /> }));
vi.mock('@/components/CalendarWidget', () => ({
  CalendarWidget: (props: any) => (
    <p>Calendar: {props.additionalEvents.map((event: any) => event.title).join(', ')}</p>
  ),
}));
import { ProgramHolderOfficeTools } from '@/components/program-holder/ProgramHolderOfficeTools';
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it('shows assigned contacts, meeting calendar and student-facing link controls', async () => {
  const copy = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: copy }, configurable: true });
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => ({
          userId: 'holder',
          videoReady: true,
          applicants: [
            {
              id: 'assigned',
              applicant_name: 'Assigned Student',
              applicant_email: 'student@example.com',
              applicant_phone: '317-555-1234',
            },
          ],
          meetings: [
            {
              id: 'meeting',
              program_holder_student_id: 'assigned',
              title: 'Course support',
              status: 'scheduled',
              starts_at: '2026-10-23T14:00:00Z',
              duration_minutes: 30,
              meeting_method: 'video',
              communication_room_id: 'room-1',
            },
          ],
        }),
      }),
  );
  render(<ProgramHolderOfficeTools mode="meetings" />);
  expect(await screen.findByText('Calendar: Course support')).toBeInTheDocument();
  expect(
    screen.getByRole('option', { name: 'Assigned Student · student@example.com' }),
  ).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'student@example.com', hidden: true })).toHaveAttribute(
    'href',
    '/communications/email?to=student%40example.com',
  );
  expect(screen.getByRole('link', { name: 'Email student' })).toHaveAttribute(
    'href',
    expect.stringContaining('student%40example.com'),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Copy student link' }));
  expect(copy).toHaveBeenCalledWith(expect.stringContaining('/lms/meetings/room-1'));
  expect(
    await screen.findAllByText('Student meeting link copied. Send it using interoffice email.'),
  ).not.toHaveLength(0);
});
it('submits a chosen student and local meeting time as an explicit UTC instant', async () => {
  const response = {
    userId: 'holder',
    videoReady: true,
    applicants: [
      {
        id: 'assigned',
        user_id: 'student-user',
        applicant_name: 'Assigned Student',
        applicant_email: 'student@example.com',
      },
    ],
    meetings: [],
  };
  const fetcher = vi
    .fn()
    .mockImplementation(async (_url, options) => ({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () =>
        options?.method === 'POST' ? { invitationDelivery: 'accepted' } : response,
    }));
  vi.stubGlobal('fetch', fetcher);
  render(<ProgramHolderOfficeTools mode="meetings" />);
  await screen.findByRole('option', { name: 'Assigned Student · student@example.com' });
  fireEvent.change(screen.getByRole('combobox', { name: 'Student' }), {
    target: { value: 'assigned' },
  });
  fireEvent.change(screen.getByLabelText('Meeting date and time in your local timezone'), {
    target: { value: '2026-10-23T10:00' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Schedule meeting' }));
  await screen.findAllByText('Meeting scheduled. Student invitation accepted for email delivery.');
  const request = fetcher.mock.calls.find(([, options]) => options?.method === 'POST');
  expect(JSON.parse(request![1].body)).toMatchObject({
    programHolderStudentId: 'assigned',
    startsAt: new Date('2026-10-23T10:00').toISOString(),
  });
});
