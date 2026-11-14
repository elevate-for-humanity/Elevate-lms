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
it('opens progress reporting for the selected student from both roster layouts', async () => {
  render(await ProgramHolderWorkspaceView({ section: 'students' }));
  const links = screen.getAllByRole('link', { name: 'Record progress' });
  expect(links).toHaveLength(2);
  for (const link of links) {
    expect(link).toHaveAttribute(
      'href',
      '/program-holder/reports?student=enrollment#student-progress-report',
    );
  }
});
it('selects only an assigned student when opening a progress-report link', async () => {
  render(
    await ProgramHolderWorkspaceView({ section: 'reports', reportEnrollmentId: 'enrollment' }),
  );
  expect(screen.getByRole('combobox', { name: 'Student name' })).toHaveValue('enrollment');
});
it('offers instructional progress reports when no clock hours have been verified', async () => {
  render(await ProgramHolderWorkspaceView({ section: 'hours' }));
  expect(screen.getByRole('heading', { name: 'Student progress report' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Submit report for review' })).toBeEnabled();
  expect(screen.getByRole('combobox', { name: /^Verified clock record/ })).toHaveDisplayValue(
    'Choose verified training hours',
  );
});
it('shows exact submitted exit reports and a review-only second installment', async () => {
  const workspace = {
    ...fixture,
    reports: [
      {
        id: 'report',
        title: 'Student exit',
        status: 'submitted',
        content: 'Assessment A: 90 percent\nPractical work verified by instructor',
        metadata: {
          report_kind: 'testing_readiness',
          completion_invoice: {
            status: 'draft_pending_completion_review',
            amount_cents: 60000,
            reason: 'Verify individual terms before approval.',
          },
        },
      },
    ],
  };
  render(
    await ProgramHolderWorkspaceView({ section: 'ready-to-test', workspace: workspace as any }),
  );
  expect(screen.getByRole('heading', { name: 'Ready to Test' })).toBeInTheDocument();
  expect(
    screen.getByText(/Second-payment invoice: draft_pending_completion_review/),
  ).toHaveTextContent('$600.00');
  expect(screen.getByText(/Assessment A: 90 percent/)).toHaveTextContent(
    'Practical work verified by instructor',
  );
  expect(screen.queryByRole('button', { name: /transfer|pay now/i })).not.toBeInTheDocument();
});
it('shows persisted build progress beside the exact uploaded syllabus and protected download link', async () => {
  const workspace = {
    ...fixture,
    documents: [
      {
        id: 'syllabus',
        document_type: 'training_plan',
        file_name: 'Approved syllabus.pdf',
        file_url: 'protected/syllabus.pdf',
        status: 'approved',
      },
    ],
    courseAssignments: [
      {
        id: 'link',
        course_id: 'course',
        custom_syllabus_path: 'protected/syllabus.pdf',
        title: 'Assigned curriculum',
        build: { status: 'generating', percent: 45, review: 'draft', published: false },
      },
    ],
  };
  render(await ProgramHolderWorkspaceView({ section: 'documents', workspace: workspace as any }));
  expect(screen.getByRole('progressbar', { name: 'Curriculum build progress' })).toHaveAttribute(
    'value',
    '45',
  );
  expect(screen.getByRole('link', { name: 'View your syllabus' })).toHaveAttribute(
    'href',
    '/api/program-holder/documents/syllabus/download',
  );
  expect(screen.getByText(/Publication: Not published/)).toBeInTheDocument();
});
it('keeps recruiting tools out of the ordinary holder workspace', async () => {
  render(await ProgramHolderWorkspaceView({ section: 'recruiting', workspace: fixture as any }));
  expect(screen.getByText('Recruiting assignment required.')).toBeInTheDocument();
  expect(screen.queryByText('Call Notes')).not.toBeInTheDocument();
});
