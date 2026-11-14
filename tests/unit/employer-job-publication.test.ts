// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  role: vi.fn(), db: { from: vi.fn() }, audit: vi.fn(), revalidate: vi.fn(), redirect: vi.fn(),
}));
vi.mock('@/lib/auth/require-role', () => ({ requireRole: mocks.role }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => mocks.db }));
vi.mock('@/lib/admin/audit-log', () => ({ logAdminAudit: mocks.audit, AdminAction: { JOB_CREATED: 'job.created', JOB_UPDATED: 'job.updated', EMPLOYER_CREATED: 'employer.created' } }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
import { createEmployer } from '../../apps/admin/app/employers/new/actions';
import { createJob, updateJob } from '../../apps/admin/app/jobs/actions';

function form(status = 'pending') {
  const f = new FormData();
  for (const [key, value] of Object.entries({ employer_id: 'employer-1', title: 'HVAC Technician', description: 'Maintain and repair residential heating and cooling equipment.', location: 'Indianapolis, IN', employment_type: 'Full-time', status })) f.set(key, value);
  return f;
}
function database(approved = true, failure = false) {
  const employerQuery: any = { select: vi.fn(() => employerQuery), eq: vi.fn(() => employerQuery), maybeSingle: vi.fn(async () => ({ data: { id: 'employer-1', approved }, error: null })) };
  const jobQuery: any = { insert: vi.fn(() => jobQuery), update: vi.fn(() => jobQuery), eq: vi.fn(() => jobQuery), select: vi.fn(() => jobQuery), single: vi.fn(async () => ({ data: failure ? null : { id: 'job-1' }, error: failure ? { message: 'failed' } : null })), maybeSingle: vi.fn(async () => ({ data: { id: 'job-1' }, error: null })) };
  mocks.db.from.mockImplementation((table: string) => {
    if (table === 'employers') return employerQuery;
    if (table === 'job_postings') return jobQuery;
    throw new Error(`Unexpected table: ${table}`);
  });
  return jobQuery;
}
beforeEach(() => { vi.clearAllMocks(); mocks.role.mockResolvedValue({ user: { id: 'admin-1' } }); });
describe('job publication', () => {
  it('creates an employer-linked posting in the same table used by review and employer views', async () => {
    const query = database(); await createJob(form());
    expect(query.insert).toHaveBeenCalledWith(expect.objectContaining({ employer_id: 'employer-1', status: 'pending', posted_by: 'admin-1', approved_at: null }));
    expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({ entityId: 'job-1', entityType: 'job_postings' }));
    expect(mocks.redirect).toHaveBeenCalledWith('/jobs/job-1');
  });
  it('requires an admin before any privileged write', async () => {
    database(); mocks.role.mockRejectedValue(new Error('Forbidden'));
    await expect(createJob(form())).rejects.toThrow('Forbidden'); expect(mocks.db.from).not.toHaveBeenCalled();
  });
  it('rejects publication for an unapproved employer', async () => {
    const query = database(false); await expect(createJob(form('active'))).rejects.toThrow('Approve the employer'); expect(query.insert).not.toHaveBeenCalled();
  });
  it('records approval when an admin publishes an approved employer listing', async () => {
    const query = database(); await updateJob('job-1', form('active'));
    expect(query.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'active', approved_by: 'admin-1', approved_at: expect.any(String) }));
    expect(query.eq).toHaveBeenCalledWith('id', 'job-1');
  });
  it('does not redirect or audit successful publication after a failed insert', async () => {
    database(true, true); await expect(createJob(form())).rejects.toThrow('Unable to save'); expect(mocks.redirect).not.toHaveBeenCalled(); expect(mocks.audit).not.toHaveBeenCalled();
  });
  it('rejects invalid form values before writing', async () => {
    const query = database(); const f = form(); f.set('employment_type', 'unexpected');
    await expect(createJob(f)).rejects.toThrow('Invalid employment type'); expect(query.insert).not.toHaveBeenCalled();
  });
});

describe('employer setup', () => {
  it('saves the required canonical business name without granting posting access', async () => {
    const query: any = { insert: vi.fn(() => query), select: vi.fn(() => query), single: vi.fn(async () => ({ data: { id: 'supersonic' }, error: null })) };
    mocks.db.from.mockReturnValue(query);
    const f = new FormData(); f.set('name', 'Supersonic Fast Cash');
    await createEmployer(f);
    expect(query.insert).toHaveBeenCalledWith(expect.objectContaining({ business_name: 'Supersonic Fast Cash', company_name: 'Supersonic Fast Cash', approved: false, status: 'pending' }));
    expect(mocks.redirect).toHaveBeenCalledWith('/employers/supersonic');
  });
  it('does not redirect on an employer save failure', async () => {
    const query: any = { insert: vi.fn(() => query), select: vi.fn(() => query), single: vi.fn(async () => ({ data: null, error: { message: 'failed' } })) };
    mocks.db.from.mockReturnValue(query);
    const f = new FormData(); f.set('name', 'Supersonic Fast Cash');
    await expect(createEmployer(f)).rejects.toThrow('EMPLOYER_CREATE_FAILED');
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
