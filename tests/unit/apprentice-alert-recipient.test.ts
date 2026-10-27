// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const { admin, insert, enrollment } = vi.hoisted(() => ({ admin: vi.fn(), insert: vi.fn(), enrollment: { row: {} as any } }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: admin }));
vi.mock('@/lib/api/withRuntime', () => ({ withRuntime: (fn: any) => fn }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: vi.fn() }));
vi.mock('@/lib/audit/withApiAudit', () => ({ withApiAudit: (_path: string, fn: any) => fn }));
import { POST } from '../../apps/lms/app/api/apprentice/email-alerts/route';
beforeEach(() => {
  vi.clearAllMocks(); vi.stubEnv('CRON_SECRET', 'scheduler-secret');
  enrollment.row = { student_id: 'student', student: null, employer: { owner_user_id: 'host-owner', contact_name: 'Host' } };
  insert.mockResolvedValue({ error: null });
  admin.mockResolvedValue({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: enrollment.row, error: null }) }) }), insert }) });
});
afterEach(() => vi.unstubAllEnvs());
const request = () => new Request('https://app.elevateforhumanity.org/api/apprentice/email-alerts', { method: 'POST', headers: { authorization: 'Bearer scheduler-secret', 'content-type': 'application/json' }, body: JSON.stringify({ type: 'missed_checkin', apprenticeshipId: 'enrollment', data: {} }) });
describe('apprentice alert recipients', () => {
  it('uses the joined host owner rather than a nonexistent enrollment contact id', async () => {
    const r = await POST(request()); expect(r.status).toBe(200);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'host-owner', title: expect.stringContaining('Learner') }));
  });
  it('does not report success when persistence fails', async () => {
    insert.mockResolvedValue({ error: { code: '42501' } });
    const r = await POST(request()); expect(r.status).toBe(503);
  });
  it('rejects a missing recipient before attempting a notification write', async () => {
    enrollment.row.employer = null;
    const r = await POST(request()); expect(r.status).toBe(409); expect(insert).not.toHaveBeenCalled();
  });
});
