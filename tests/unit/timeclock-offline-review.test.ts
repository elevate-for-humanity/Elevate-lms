import { beforeEach, expect, it, vi } from 'vitest';
import { POST } from '@/apps/lms/app/api/timeclock/action/route';
const mocks = vi.hoisted(() => ({ upsert: vi.fn(), from: vi.fn() }));
vi.mock('@/lib/audit/withApiAudit', () => ({ withApiAudit: (_path: string, handler: unknown) => handler }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/barber/suspension', () => ({ checkBarberSuspension: async () => null }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({
  auth: { getUser: async () => ({ data: { user: { id: 'learner' } } }) },
}) }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({ from: mocks.from }) }));
vi.mock('@/lib/email/service', () => ({ sendEmail: vi.fn() }));
vi.mock('@/lib/events/emit', () => ({ emitEvent: vi.fn() }));
beforeEach(() => {
  vi.clearAllMocks();
  mocks.from.mockImplementation(table => {
    if (table === 'admin_alerts') return { upsert: mocks.upsert.mockResolvedValue({ error: null }) };
    const data = table === 'apprentices' ? { id: 'apprentice', shop_id: 'shop' } : { id: 'site', name: 'Assigned shop' };
    const chain = { select: () => chain, eq: () => chain, maybeSingle: async () => ({ data }) };
    return chain;
  });
});
const payload = { action: 'clock_in', apprentice_id: 'apprentice', site_id: 'site', offline_submission: true,
  client_recorded_at: '2026-11-03T14:00:00.000Z' };
function post(body: object) {
  return POST(new Request('https://lms.elevateforhumanity.org/api/timeclock/action',
    { method: 'POST', body: JSON.stringify(body) }) as Parameters<typeof POST>[0]);
}
it('recovers legacy attempts without GPS as a single review, never as attendance', async () => {
  expect((await post(payload)).status).toBe(202);
  expect((await post(payload)).status).toBe(202);
  const [[first, options], [retry]] = mocks.upsert.mock.calls;
  expect(first.id).toBe(retry.id);
  expect(first.metadata.location_captured).toBe(false);
  expect(options.ignoreDuplicates).toBe(true);
  expect(mocks.from).not.toHaveBeenCalledWith('progress_entries');
});
it('rejects a queued attempt belonging to another apprentice', async () => {
  expect((await post({ ...payload, apprentice_id: 'other' })).status).toBe(403);
  expect(mocks.upsert).not.toHaveBeenCalled();
});
