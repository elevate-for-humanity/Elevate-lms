import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
const refresh = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));
import HoursQueue from '@/apps/admin/app/apprenticeships/ApprenticeshipHoursClient';
const entry = {
  id: 'entry-1',
  apprentice_id: 'apprentice',
  program_id: 'program',
  status: 'submitted',
  work_date: '2026-10-06',
  week_ending: '2026-10-11',
  hours_worked: 8.25,
  notes: null,
  tasks_completed: null,
  clock_in_at: null,
  clock_out_at: null,
  name: 'Example Student',
  program_title: 'Example Apprenticeship',
  approval_blocker: null,
};
const fetchMock = vi.fn();
const response = (data: object, ok = true) => ({ ok, json: async () => data });
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe('hours queue', () => {
  it('keeps disputed hours explicitly unresolved while bulk approval stays disabled', async () => {
    fetchMock.mockResolvedValue(response({entries:[],incompleteCount:56,disputedCount:3,disputedHours:30}));
    render(<HoursQueue />);
    expect(await screen.findByText(/3 disputed entries \(30 hours\)/)).toBeInTheDocument();
    expect(screen.getByRole('button',{name:/Approve all eligible/})).toBeDisabled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('lets an administrator inspect blocked hours and their matching ledger without approving them', async () => {
    fetchMock.mockResolvedValue(response({ entries: [{ ...entry, student_id: 'student', approval_blocker: 'Duplicate date', review_ledger: [{ id: 'ledger', source_type: 'timeclock', status: 'approved', hours_claimed: 8.25, accepted_hours: 8.25 }] }], incompleteCount: 0 }));
    render(<HoursQueue />);
    fireEvent.click(await screen.findByRole('button', { name: /Review Example Student/ }));
    expect(screen.getByRole('region', { name: 'Review hours for Example Student' })).toHaveTextContent('8.25 accepted');
    expect(screen.getByRole('link', { name: 'Open student record' })).toHaveAttribute('href', '/students/student');
    expect(screen.getByRole('button', { name: /Approve Example Student/ })).toBeDisabled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('provides sign-in recovery for an expired session without parsing login HTML', async () => {
    fetchMock.mockResolvedValue({ status: 401, ok: false, json: vi.fn() });
    render(<HoursQueue />);
    expect(await screen.findByRole('link', { name: 'Sign in to approve hours' })).toHaveAttribute(
      'href',
      '/login?redirect=%2Fapprenticeships',
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Your session expired');
    expect(screen.getByRole('button', { name: /Approve all eligible/ })).toBeDisabled();
  });
  it('explains an HTML server failure without displaying a JSON parser exception', async () => {
    fetchMock.mockResolvedValue({
      status: 502,
      ok: false,
      json: async () => {
        throw new SyntaxError("Unexpected token '<'");
      },
    });
    render(<HoursQueue />);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The hours service could not return the queue',
    );
    expect(screen.queryByText(/Unexpected token/)).not.toBeInTheDocument();
  });

  it('shows load errors and disables approval instead of pretending the queue is empty', async () => {
    fetchMock.mockResolvedValue(response({ error: 'Could not load hours' }, false));
    render(<HoursQueue />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load hours');
    expect(screen.getByRole('button', { name: /Approve all eligible/ })).toBeDisabled();
    expect(screen.queryByText('No completed hours awaiting approval.')).not.toBeInTheDocument();
  });
  it('approves the reviewed eligible IDs and values, then refreshes persisted totals', async () => {
    fetchMock
      .mockResolvedValueOnce(
        response({
          entries: [entry, { ...entry, id: 'blocked', approval_blocker: 'Duplicate date' }],
          incompleteCount: 3,
        }),
      )
      .mockResolvedValueOnce(response({ ok: true, approvedCount: 1 }))
      .mockResolvedValueOnce(response({ entries: [], incompleteCount: 3 }));
    render(<HoursQueue />);
    fireEvent.click((await screen.findAllByRole('button', { name: /Review Example Student/ }))[0]);
    expect(screen.getByRole('region', { name: 'Review hours for Example Student' })).toBeInTheDocument();
    const approve = await screen.findByRole('button', { name: 'Approve all eligible (1)' });
    fireEvent.click(approve);
    expect(screen.getByRole('alertdialog')).toHaveTextContent('8.25 hours');
    fireEvent.click(screen.getByRole('button', { name: 'Confirm approvals' }));
    expect(await screen.findByText('1 entry approved.')).toBeInTheDocument();
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(screen.queryByRole('region', { name: 'Review hours for Example Student' })).not.toBeInTheDocument();
    const body = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(body.ids).toEqual(['entry-1']);
    expect(body.expected).toEqual([
      expect.objectContaining({ id: 'entry-1', hours_worked: 8.25, work_date: '2026-10-06' }),
    ]);
  });
});
