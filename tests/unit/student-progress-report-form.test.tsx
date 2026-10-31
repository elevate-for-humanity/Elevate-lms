import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { StudentProgressReportForm } from '@/components/program-holder/StudentProgressReportForm';

const mocks = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
const students = [{ id: 'enrollment-one', full_name: 'Assigned learner' }];
beforeEach(() => vi.clearAllMocks());
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('leaves an unassigned student query unselected', () => {
  render(
    <StudentProgressReportForm students={students} initialEnrollmentId="other-holder-student" />,
  );
  expect(screen.getByRole('combobox', { name: 'Student name' })).toHaveValue('');
  expect(screen.queryByRole('option', { name: 'other-holder-student' })).not.toBeInTheDocument();
});

function fillReport() {
  fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2026-10-26' } });
  fireEvent.change(screen.getByLabelText('End date'), { target: { value: '2026-10-30' } });
  fireEvent.change(screen.getByLabelText('Reported hours'), { target: { value: '0' } });
  fireEvent.change(screen.getByLabelText('Notes and next steps'), {
    target: { value: 'Practice evidence reviewed; follow up on the next lesson.' },
  });
  fireEvent.click(screen.getByRole('checkbox', { name: 'Practiced skills' }));
}

it('submits the selected learner report without a clock record and refreshes saved reports', async () => {
  const send = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ ok: true }), {
      status: 201,
      headers: { 'content-type': 'application/json' },
    }),
  );
  vi.stubGlobal('fetch', send);
  render(<StudentProgressReportForm students={students} initialEnrollmentId="enrollment-one" />);
  fillReport();
  fireEvent.click(screen.getByRole('button', { name: 'Submit report for review' }));
  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent('Report submitted for review.'),
  );
  expect(JSON.parse(send.mock.calls[0][1].body)).toMatchObject({
    enrollmentId: 'enrollment-one',
    hours: 0,
    progress: 'on_track',
    checks: ['practice'],
  });
  expect(JSON.parse(send.mock.calls[0][1].body)).not.toHaveProperty('hour_entry_id');
  expect(mocks.refresh).toHaveBeenCalledOnce();
});

it('keeps the report editable after a failed save instead of claiming submission', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: 'Unable to submit progress report.' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      }),
    ),
  );
  render(<StudentProgressReportForm students={students} initialEnrollmentId="enrollment-one" />);
  fillReport();
  fireEvent.click(screen.getByRole('button', { name: 'Submit report for review' }));
  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent('Unable to submit progress report.'),
  );
  expect(screen.getByLabelText('Notes and next steps')).toHaveValue(
    'Practice evidence reviewed; follow up on the next lesson.',
  );
  expect(mocks.refresh).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Submit report for review' })).toBeEnabled();
});
