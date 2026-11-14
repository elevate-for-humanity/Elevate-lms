import { beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ mode: 'holder', hasStudent: true, slug: 'hvac-technician', lookupError: false, writes: [] as { table: string; payload: any }[] }));
vi.mock('@/lib/auth/require-program-holder', () => ({
  requireProgramHolder: async () => ({
    mode: state.mode, holderId: 'holder-a', programIds: ['program-a'], user: { id: 'holder-user' }, profile: { full_name: 'Test Holder' },
    db: { from: (table: string) => {
      const q: any = {};
      q.select = () => q; q.eq = () => q;
      q.maybeSingle = async () => table === 'programs'
        ? { data: { slug: state.slug }, error: state.lookupError ? { message: 'unavailable' } : null }
        : { data: state.hasStudent ? { user_id: 'student-a', student_id: 'student-a', program_id: 'program-a', full_name: 'Test Student', applicant_name: 'Test Student' } : null, error: null };
      q.update = (payload: any) => { state.writes.push({ table, payload }); return q; };
      q.insert = async (payload: any) => { state.writes.push({ table, payload }); return { error: null }; };
      q.then = (resolve: any, reject: any) => Promise.resolve({ error: null }).then(resolve, reject);
      return q;
    } },
  }),
}));
import { POST } from '../../apps/lms/app/api/program-holder/student-testing-readiness/route';
const request = (source = 'enrollment') => new Request('https://app.example.test/api/program-holder/student-testing-readiness', { method: 'POST', body: JSON.stringify({ studentId: '00000000-0000-4000-8000-000000000001', source }) });
beforeEach(() => { state.mode = 'holder'; state.hasStudent = true; state.slug = 'hvac-technician'; state.lookupError = false; state.writes = []; });
it.each(['enrollment', 'holder_student'])('rejects a non-HVAC %s before changing records or notifying staff', async source => {
  state.slug = 'bookkeeping';
  expect((await POST(request(source))).status).toBe(400);
  expect(state.writes).toEqual([]);
});
it('denies an unassigned student before testing program eligibility', async () => {
  state.hasStudent = false;
  expect((await POST(request())).status).toBe(403);
  expect(state.writes).toEqual([]);
});
it('requires a live holder session for mutations', async () => {
  state.mode = 'preview';
  expect((await POST(request())).status).toBe(403);
  expect(state.writes).toEqual([]);
});
it('fails closed when program eligibility cannot be verified', async () => {
  state.lookupError = true;
  expect((await POST(request())).status).toBe(503);
  expect(state.writes).toEqual([]);
});
it('routes a verified HVAC readiness request to administrative review', async () => {
  expect((await POST(request())).status).toBe(200);
  expect(state.writes.map(write => write.table)).toEqual(['program_enrollments', 'staff_notifications']);
  expect(state.writes[0].payload.next_required_action).toContain('Admin review');
});
