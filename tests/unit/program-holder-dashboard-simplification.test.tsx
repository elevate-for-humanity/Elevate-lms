import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ProgramHolderWorkspaceView } from '@/components/program-holder/ProgramHolderWorkspaceView';
const fixture = vi.hoisted(() => ({
  mode: 'holder',
  holder: {
    organization_name: 'Training Partner',
    status: 'active',
    mou_signed: true,
    features: {} as Record<string, unknown>,
  },
  profile: { full_name: 'Program Lead', role: 'program_holder' },
  programs: [],
  enrollments: [
    {
      id: 'enrollment',
      full_name: 'Assigned learner',
      status: 'active',
      training_start_date: '2026-10-25',
      expected_end_date: '2026-12-06',
    },
  ],
  hours: [],
  documents: [],
  acknowledgements: [],
  applicants: [],
  courseAssignments: [],
  reports: [],
  payoutSchedules: [],
  upcomingEnrollments: [],
  schoolApplicants: [],
}));
vi.mock('@/lib/program-holder/workspace', () => ({
  getProgramHolderWorkspace: async () => fixture,
  programTitle: () => 'Assigned program',
}));
vi.mock('next/image', () => ({
  default: ({ fill, sizes, priority, ...props }: any) => <img {...props} />,
}));
afterEach(cleanup);
it('shows one overview and one roster snapshot, with full work retained at canonical destinations', async () => {
  render(await ProgramHolderWorkspaceView({ section: 'dashboard' }));
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  expect(screen.getAllByText('Assigned learner', { exact: true })).toHaveLength(1);
  expect(screen.getByRole('heading', { name: 'Choose your next task' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Open all 1 students →' })).toHaveAttribute(
    'href',
    '/program-holder/students',
  );
  expect(screen.getByRole('link', { name: /Weekly progress reports/ })).toHaveAttribute(
    'href',
    '/program-holder/reports',
  );
  expect(screen.queryByRole('heading', { name: 'Program readiness' })).not.toBeInTheDocument();
  expect(
    screen.queryByRole('heading', { name: 'Current and incoming students' }),
  ).not.toBeInTheDocument();
});
it('teaches the real student email selector and keeps long references collapsed', async () => {
  const { container } = render(await ProgramHolderWorkspaceView({ section: 'dashboard' }));
  fireEvent.change(screen.getByRole('combobox', { name: 'Choose an orientation topic' }), {
    target: { value: '8' },
  });
  expect(
    screen.getByRole('heading', { name: 'Email a student from your assigned roster' }),
  ).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Open program email →' })).toHaveAttribute(
    'href',
    '/program-holder/email',
  );
  expect([...container.querySelectorAll('details')].every((detail) => !detail.open)).toBe(true);
});
