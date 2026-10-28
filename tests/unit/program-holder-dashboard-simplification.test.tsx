import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
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
vi.mock('@/components/communications/CommunicationTodos', () => ({
  CommunicationTodos: () => <p>Communication alerts</p>,
}));
vi.mock('@/components/program-holder/ProgramHolderPaymentAddendum', () => ({
  ProgramHolderPaymentAddendum: () => null,
}));
afterEach(cleanup);
it('shows only To-dos and Alerts at home; the roster and guide belong to their task tabs', async () => {
  render(await ProgramHolderWorkspaceView({ section: 'dashboard' }));
  expect(screen.getAllByRole('heading').map((heading) => heading.textContent)).toEqual([
    'To-dos',
    'Alerts',
  ]);
  expect(screen.queryByText('Assigned learner', { exact: true })).not.toBeInTheDocument();
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('combobox', { name: 'Choose an orientation topic' }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Weekly progress reports/ })).toHaveAttribute(
    'href',
    '/program-holder/reports',
  );
});
it('links an actual outstanding action once without repeating it in Alerts', async () => {
  render(await ProgramHolderWorkspaceView({ section: 'dashboard' }));
  const todos = screen.getByRole('region', { name: 'To-dos' });
  const action = within(todos).getByRole('link', { name: /Resolve .* compliance requirement/ });
  expect(action).toHaveAttribute('href', '/program-holder/compliance');
  expect(screen.getAllByRole('link', { name: /Resolve .* compliance requirement/ })).toHaveLength(
    1,
  );
  expect(screen.queryByRole('heading', { name: 'Your office' })).not.toBeInTheDocument();
});
it('keeps the same focused home in reading-support mode', async () => {
  fixture.holder.features = { reading_support: true };
  render(await ProgramHolderWorkspaceView({ section: 'dashboard' }));
  expect(screen.getAllByRole('heading').map((heading) => heading.textContent)).toEqual([
    'To-dos',
    'Alerts',
  ]);
  fixture.holder.features = {};
});
it('keeps the reporting summary and report submission tools in the Reports tab', async () => {
  render(await ProgramHolderWorkspaceView({ section: 'reports' }));
  expect(screen.getByText('Total Enrolled')).toBeInTheDocument();
  expect(screen.getByText('Currently Active')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Submitted reports' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'To-dos' })).not.toBeInTheDocument();
});
