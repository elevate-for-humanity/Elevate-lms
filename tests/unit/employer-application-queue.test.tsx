// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
const state = vi.hoisted(() => ({ role: vi.fn(), admin: vi.fn(), fail: '', reads: [] as string[] }));
vi.mock('@/lib/auth/require-role', () => ({ requireRole: state.role }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: state.admin }));
import EmployerApplicationsPage from '@/apps/admin/app/employers/applications/page';
beforeEach(() => {
 vi.clearAllMocks(); state.fail = ''; state.reads = []; state.role.mockResolvedValue({ user: { id: 'admin' } });
 const fixtures: Record<string, unknown[]> = {
   employer_applications: [{ id: 'submitted', company_name: 'Submitted Employer', status: 'pending', state: 'submitted' }],
   applications: [{ id: 'legacy', first_name: 'Earlier', last_name: 'Contact', type: 'student', status: 'under_review' }],
   partners: [{ id: 'seed', name: 'Directory Fixture', account_status: 'draft', approval_status: 'pending', notes: 'Reported failed application attempt' }],
   application_intake: [{ id: 'unprocessed', payload: { company_name: 'Saved Intake' }, status: 'received' }],
 };
 state.admin.mockResolvedValue({ from: (table: string) => {
   state.reads.push(table);
   const chain: any = { select: () => chain, eq: () => chain, neq: () => chain, or: () => chain, order: async () => ({ data: fixtures[table], error: state.fail === table ? { message: 'unavailable' } : null }) };
   return chain;
 } });
});
it('loads every review source and keeps directory drafts distinct from submitted applications', async () => {
 const html = renderToStaticMarkup(await EmployerApplicationsPage());
 expect(state.reads).toEqual(['employer_applications', 'applications', 'partners', 'application_intake']);
 expect(html).toContain('/employers/applications/submitted'); expect(html).toContain('/applications/review/legacy');
 expect(html).toContain('Directory drafts (1)'); expect(html).toContain('No linked application');
 expect(html).toContain('Reported failed application attempt'); expect(html).toContain('Submissions needing processing (1)');
});
it.each(['employer_applications', 'applications', 'partners', 'application_intake'])('surfaces %s failures instead of claiming the queue is empty', async table => {
 state.fail = table;
 const html = renderToStaticMarkup(await EmployerApplicationsPage());
 expect(html).toContain('Employer applications unavailable'); expect(html).not.toContain('No saved employer applications');
});
it('requires an administrative role before loading records', async () => {
 state.role.mockRejectedValue(new Error('DENIED'));
 await expect(EmployerApplicationsPage()).rejects.toThrow('DENIED'); expect(state.admin).not.toHaveBeenCalled();
});
