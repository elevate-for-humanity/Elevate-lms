// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocked = vi.hoisted(() => ({ process: vi.fn(), stats: vi.fn() }));
vi.mock('@/lib/api/withRuntime', () => ({ withRuntime: (handler: any) => handler }));
vi.mock('@/lib/audit/withApiAudit', () => ({
  withApiAudit: (_name: any, handler: any) => handler,
}));
vi.mock('@/lib/notifications/processor', () => ({
  processNotificationQueue: mocked.process,
  getQueueStats: mocked.stats,
  NOTIFICATION_DELIVERY_CONTRACT: 2,
}));
import * as admin from '../../apps/admin/app/api/cron/process-notifications/route';
import * as lms from '../../apps/lms/app/api/cron/process-notifications/route';
const request = (authorized = true) =>
  new Request('https://example.invalid/api/cron/process-notifications', {
    method: 'POST',
    headers: authorized ? { authorization: 'Bearer fixture-only' } : {},
  }) as any;
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('CRON_SECRET', 'fixture-only');
});
afterEach(() => vi.unstubAllEnvs());
for (const [name, route] of [
  ['admin', admin],
  ['lms', lms],
] as const)
  describe(`${name} notification route`, () => {
    it('rejects unauthorized processing before claiming rows', async () => {
      expect((await route.POST(request(false))).status).toBe(401);
      expect(mocked.process).not.toHaveBeenCalled();
    });
    it('returns failure when any delivery or finalization is uncertain', async () => {
      mocked.process.mockResolvedValue({
        processed: 1,
        sent: 0,
        failed: 1,
        errors: [{ id: 'fixture', error: 'review' }],
      });
      const response = await route.POST(request());
      expect(response.status).toBe(503);
      expect(await response.json()).toMatchObject({ success: false, deliveryContract: 2 });
    });
    it('GET advertises the contract and never drains the queue', async () => {
      mocked.stats.mockResolvedValue({ queued: 1, review_required: 1 });
      const response = await route.GET(request());
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ success: true, deliveryContract: 2 });
      expect(mocked.process).not.toHaveBeenCalled();
    });
  });
