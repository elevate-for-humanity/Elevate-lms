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
    const approve = await screen.findByRole('button', { name: 'Approve all eligible (1)' });
    fireEvent.click(approve);
    expect(screen.getByRole('alertdialog')).toHaveTextContent('8.25 hours');
    fireEvent.click(screen.getByRole('button', { name: 'Confirm approvals' }));
    expect(await screen.findByText('1 entry approved.')).toBeInTheDocument();
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    const body = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(body.ids).toEqual(['entry-1']);
    expect(body.expected).toEqual([
      expect.objectContaining({ id: 'entry-1', hours_worked: 8.25, work_date: '2026-10-06' }),
    ]);
  });
});
