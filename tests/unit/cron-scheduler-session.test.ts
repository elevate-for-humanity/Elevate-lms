// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const { admin, chain, state } = vi.hoisted(() => ({ admin: vi.fn(), chain: {} as Record<string, any>, state: { rows: [] as any[] } }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: admin }));
vi.mock('@/lib/supabase/server', () => ({ createClient: () => { throw new Error('Scheduler must not use a browser session'); } }));
vi.mock('@/lib/api/withRuntime', () => ({ withRuntime: (fn: any) => fn }));
vi.mock('@/lib/audit/withApiAudit', () => ({ withApiAudit: (_path: string, fn: any) => fn }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));
import { GET as missed } from '../../apps/admin/app/api/cron/missed-checkins/route';
import { GET as morning } from '../../apps/admin/app/api/cron/morning-reminders/route';
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('CRON_SECRET', 'scheduler-secret');
  state.rows = [];
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ success: true })));
  for (const op of ['from', 'select', 'eq', 'contains', 'update']) chain[op] = vi.fn(() => chain);
  chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  chain.then = (resolve: any) => Promise.resolve({ data: state.rows, error: null }).then(resolve);
  admin.mockResolvedValue({ from: chain.from });
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
for (const [name, handler] of [['missed-checkins', missed], ['morning-reminders', morning]] as const) {
  describe(name, () => {
    it('rejects a missing configured secret, even with Bearer undefined', async () => {
      vi.stubEnv('CRON_SECRET', undefined);
      const r = await handler(new NextRequest(`https://admin.elevateforhumanity.org/api/cron/${name}`, { headers: { authorization: 'Bearer undefined' } }));
      expect(r.status).toBe(401);
      expect(admin).not.toHaveBeenCalled();
    });
    it('forwards scheduler authorization to the LMS alert receiver', async () => {
      const apprenticeship = { id: 'enrollment', student: { full_name: 'Learner', email: 'learner@example.test' }, employer: { contact_email: 'host@example.test', contact_name: 'Host' }, program: { name: 'Training' } };
      state.rows = name === 'morning-reminders' ? [{ id: 'reminder', apprenticeship }] : [apprenticeship];
      const r = await handler(new NextRequest(`https://admin.elevateforhumanity.org/api/cron/${name}`, { headers: { authorization: 'Bearer scheduler-secret' } }));
      expect(r.status).toBe(200);
      expect(fetch).toHaveBeenCalledWith('https://app.elevateforhumanity.org/api/apprentice/email-alerts', expect.objectContaining({ headers: expect.objectContaining({ authorization: 'Bearer scheduler-secret' }), signal: expect.any(AbortSignal) }));
    });
    it('returns success for an empty queue without a user cookie', async () => {
      const r = await handler(new NextRequest(`https://admin.elevateforhumanity.org/api/cron/${name}`, { headers: { authorization: 'Bearer scheduler-secret' } }));
      expect(r.status).toBe(200);
      expect(await r.json()).toMatchObject({ success: true, results: [] });
      expect(admin).toHaveBeenCalledOnce();
    });
  });
}
