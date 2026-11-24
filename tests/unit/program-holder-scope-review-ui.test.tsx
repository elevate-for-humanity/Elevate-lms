import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ fetch: vi.fn(), refresh: vi.fn(), success: vi.fn(), error: vi.fn(), requireRole: vi.fn(), catalogError: null as unknown }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: state.refresh }) }));
vi.mock('react-hot-toast', () => ({ default: { success: state.success, error: state.error } }));
vi.mock('next/link', () => ({ default: ({ children, href }: any) => <a href={href}>{children}</a> }));
vi.mock('@/lib/auth/require-role', () => ({ requireRole: state.requireRole }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({
  from: (table: string) => {
    const query: any = {
      select: () => query, eq: () => query, in: () => query, order: () => query, limit: () => query,
      then: (resolve: any) => Promise.resolve(table === 'program_holder_applications'
        ? { data: [{ id: applicationId, organization_name: 'Fixture organization', status: 'pending', data: reviewedData, created_at: updatedAt, updated_at: updatedAt }], error: null }
        : table === 'application_intake' ? { data: [{ id: 'intake-1', application_type: 'program_holder', destination_table: 'program_holder_applications', destination_id: applicationId, status: 'processed', payload: reviewedData }], error: null }
        : { data: [{ ...program, is_active: true, status: 'active' }, { id: 'archived-program', slug: 'hvac-technician', title: 'Archived fixture', is_active: true, status: 'archived' }], error: state.catalogError }).then(resolve),
    };
    return query;
  },
}) }));

import ProgramHolderApplicationActions from '@/apps/admin/app/program-holder-applications/ProgramHolderApplicationActions';
import ProgramHolderApplicationsPage from '@/apps/admin/app/program-holder-applications/page';

const applicationId = '11111111-1111-4111-8111-111111111111';
const updatedAt = '2026-11-24T15:00:00.000Z';
const program = { id: '22222222-2222-4222-8222-222222222222', slug: 'building-maintenance-wrg', title: 'Fixture verified program' };
const originalData = { requested_program_interest: 'janitorial', requested_program_slugs: [] };
const reviewedData = {
  ...originalData,
  program_scope_review: {
    requested_interest: 'janitorial', program_id: program.id, program_slug: program.slug,
    program_title: program.title, reviewed_by: 'reviewer-1', reviewed_at: updatedAt,
    note: 'Confirmed the fixture training scope with the applicant.',
  },
};
const props = { applicationId, applicationData: originalData, updatedAt, programs: [program] };

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', state.fetch);
  state.fetch.mockResolvedValue(Response.json({ success: true }));
  state.catalogError = null;
});

it('requires an explicit program, note and confirmation; saving scope never approves automatically', async () => {
  const view = render(<ProgramHolderApplicationActions {...props} />);
  expect(screen.getByRole('button', { name: 'Approve' })).toBeDisabled();
  expect(screen.getByLabelText('Verified active program')).toHaveValue('');
  expect(screen.getByRole('button', { name: 'Save scope review' })).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Verified active program'), { target: { value: program.id } });
  fireEvent.change(screen.getByLabelText('Scope review note'), { target: { value: 'Confirmed the fixture training scope with the applicant.' } });
  expect(screen.getByRole('button', { name: 'Save scope review' })).toBeDisabled();
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: 'Save scope review' }));
  await waitFor(() => expect(state.refresh).toHaveBeenCalledTimes(1));
  expect(state.fetch).toHaveBeenCalledTimes(1);
  expect(state.fetch).toHaveBeenCalledWith(`/api/program-holder/applications/${applicationId}/resolve-scope`, expect.objectContaining({
    method: 'POST',
    body: JSON.stringify({ programId: program.id, note: 'Confirmed the fixture training scope with the applicant.', confirmReviewed: true, expectedUpdatedAt: updatedAt }),
  }));
  expect(screen.getByRole('button', { name: 'Approve' })).toBeDisabled();

  view.rerender(<ProgramHolderApplicationActions {...props} applicationData={reviewedData} />);
  expect(screen.queryByRole('button', { name: 'Save scope review' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Approve' })).toBeEnabled();
  fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
  await waitFor(() => expect(state.fetch).toHaveBeenCalledWith(`/api/program-holder/applications/${applicationId}/approve`, { method: 'POST' }));
});

it('preserves the review form and reports a stale decision without approval or a false success', async () => {
  state.fetch.mockResolvedValue(Response.json({ error: 'This application changed. Refresh before continuing.' }, { status: 409 }));
  render(<ProgramHolderApplicationActions {...props} />);
  fireEvent.change(screen.getByLabelText('Verified active program'), { target: { value: program.id } });
  fireEvent.change(screen.getByLabelText('Scope review note'), { target: { value: 'Confirmed the fixture scope with the applicant.' } });
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: 'Save scope review' }));
  await waitFor(() => expect(state.error).toHaveBeenCalledWith('This application changed. Refresh before continuing.'));
  expect(state.success).not.toHaveBeenCalled();
  expect(state.refresh).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Scope review note')).toHaveValue('Confirmed the fixture scope with the applicant.');
  expect(screen.getByRole('button', { name: 'Approve' })).toBeDisabled();
});

it('cannot approve a reviewed program that disappeared from the active catalog', () => {
  render(<ProgramHolderApplicationActions {...props} applicationData={reviewedData} programs={[]} />);
  expect(screen.getByRole('button', { name: 'Approve' })).toBeDisabled();
  expect(screen.getByText(/no longer available in the active catalog/)).toBeInTheDocument();
});

it('requires a saved acknowledgement and refreshes a recorded review when application status changed', async () => {
  const view = render(<ProgramHolderApplicationActions {...props} />);
  fireEvent.change(screen.getByLabelText('Verified active program'), { target: { value: program.id } });
  fireEvent.change(screen.getByLabelText('Scope review note'), { target: { value: 'Confirmed the fixture scope with the applicant.' } });
  fireEvent.click(screen.getByRole('checkbox'));
  state.fetch.mockResolvedValue(Response.json({}));
  fireEvent.click(screen.getByRole('button', { name: 'Save scope review' }));
  await waitFor(() => expect(state.error).toHaveBeenCalledWith('Unable to confirm the saved program scope review.'));
  expect(state.success).not.toHaveBeenCalled();
  expect(state.refresh).not.toHaveBeenCalled();
  state.fetch.mockResolvedValue(Response.json({ error: 'The scope review was recorded, but the application changed.', scopeRecorded: true }, { status: 409 }));
  fireEvent.click(screen.getByRole('button', { name: 'Save scope review' }));
  await waitFor(() => expect(state.refresh).toHaveBeenCalledTimes(1));
  expect(state.success).not.toHaveBeenCalled();
  view.unmount();
});

it('retains existing ordinary approval behavior and disables closed application actions', () => {
  const view = render(<ProgramHolderApplicationActions applicationId={applicationId} applicationData={{ requested_program_slugs: ['hvac-technician'] }} />);
  expect(screen.getByRole('button', { name: 'Approve' })).toBeEnabled();
  expect(screen.queryByRole('button', { name: 'Save scope review' })).not.toBeInTheDocument();
  view.rerender(<ProgramHolderApplicationActions {...props} disabled />);
  expect(screen.getByRole('button', { name: 'Approve' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Deny' })).toBeDisabled();
  expect(screen.queryByRole('button', { name: 'Save scope review' })).not.toBeInTheDocument();
});

it('shows original interest alongside the saved staff decision in the authorized queue', async () => {
  render(await ProgramHolderApplicationsPage());
  expect(state.requireRole).toHaveBeenCalledWith(['admin']);
  expect(screen.getByText(/Janitorial \/ Building Services Technician/)).toBeInTheDocument();
  expect(screen.getByText(/Fixture verified program \(building-maintenance-wrg\)/)).toBeInTheDocument();
  expect(screen.getByText(reviewedData.program_scope_review.note)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Approve' })).toBeEnabled();
});

it('keeps reviewed-interest approval blocked and explains a catalog failure', async () => {
  state.catalogError = { message: 'Fixture catalog unavailable' };
  render(await ProgramHolderApplicationsPage());
  expect(screen.getByRole('alert')).toHaveTextContent('The program catalog could not be loaded');
  expect(screen.getByRole('button', { name: 'Approve' })).toBeDisabled();
});
