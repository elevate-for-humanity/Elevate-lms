import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ send: vi.fn(), db: null as any, patch: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('web-push', () => ({ default: { sendNotification: mocks.send } }));
vi.mock('@/lib/secrets', () => ({
  getSecrets: async () => ({ VAPID_PUBLIC_KEY: 'public', VAPID_PRIVATE_KEY: 'private' }),
}));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => mocks.db }));
import { processPwaAlerts } from '@/lib/notifications/pwa-alert-delivery';
beforeEach(() => {
  vi.clearAllMocks();
  mocks.db = {
    rpc: vi.fn(async (name: string) => ({
      error: null,
      data:
        name === 'claim_pwa_alert_deliveries'
          ? [{ notification_id: 'notice-1', user_id: 'owner', kind: 'email' }]
          : null,
    })),
    from: (name: string) => {
      if (name === 'pwa_alert_preferences')
        return {
          select: () => ({
            eq: () => ({ maybeSingle: async () => ({ data: { sound: 'silent', volume: 0 } }) }),
          }),
        };
      if (name === 'push_subscriptions')
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                limit: async () => ({
                  data: [
                    { endpoint: 'https://fcm.googleapis.com/test', p256dh: 'key', auth: 'key' },
                  ],
                  error: null,
                }),
              }),
            }),
          }),
        };
      return {
        update: (patch: any) => {
          mocks.patch(patch);
          return { eq: () => ({ eq: async () => ({ error: null }) }) };
        },
      };
    },
  };
});
it('sends a generic private alert and honors silent mode without claiming the person heard it', async () => {
  mocks.send.mockResolvedValue({});
  const result = await processPwaAlerts();
  expect(result.accepted).toBe(1);
  const payload = JSON.parse(mocks.send.mock.calls[0][1]);
  expect(payload).toMatchObject({ silent: true, body: 'Elevate, you have a new email.' });
  expect(payload.body).not.toContain('subject');
  expect(mocks.patch).toHaveBeenCalledWith(
    expect.objectContaining({ status: 'accepted', accepted_devices: 1 }),
  );
});
it('records an ambiguous push failure for review instead of reporting delivery or resending', async () => {
  mocks.send.mockRejectedValue(Error('timeout'));
  const result = await processPwaAlerts();
  expect(result).toMatchObject({ accepted: 0, review: 1 });
  expect(mocks.send).toHaveBeenCalledTimes(1);
  expect(mocks.patch).toHaveBeenCalledWith(expect.objectContaining({ status: 'review_required' }));
});
