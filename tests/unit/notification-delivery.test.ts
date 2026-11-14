// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ db: null as any, send: vi.fn() }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => mocks.db }));
vi.mock('@/lib/email/sendgrid', () => ({ sendEmail: mocks.send }));
vi.mock('@/lib/notifications/templates', () => ({
  getTemplate: () => ({ subject: 'test fixture', html: '<p>fixture</p>', text: 'fixture' }),
}));
import { processNotificationQueue, getQueueStats } from '@/lib/notifications/processor';

function database({ claimError = false, finalError = false } = {}) {
  const patches: any[] = [];
  const rpc = vi
    .fn()
    .mockResolvedValue({
      error: claimError ? { message: 'db down' } : null,
      data: claimError
        ? null
        : [
            {
              id: 'fixture',
              to_email: 'fixture@example.invalid',
              template_key: 'welcome',
              template_data: {},
              attempts: 0,
              max_attempts: 5,
            },
          ],
    });
  const from = vi.fn(() => ({
    update: (patch: any) => {
      patches.push(patch);
      const q: any = {
        eq: vi.fn(() => q),
        select: vi.fn(() => q),
        single: vi.fn(async () =>
          finalError && patch.status === 'sent'
            ? { data: null, error: {} }
            : { data: { id: 'fixture' }, error: null },
        ),
      };
      return q;
    },
  }));
  mocks.db = { from, rpc };
  return { patches, rpc };
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.send.mockResolvedValue({ success: true, data: { messageId: 'provider-fixture' } });
});
describe('durable notification delivery', () => {
  it('does not send when atomic claims fail', async () => {
    database({ claimError: true });
    await expect(processNotificationQueue()).rejects.toThrow('claim failed');
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it('counts acceptance only after the exact claim is persisted', async () => {
    const { patches, rpc } = database();
    const result = await processNotificationQueue();
    expect(result).toMatchObject({ processed: 1, sent: 1, failed: 0 });
    expect(rpc).toHaveBeenCalledWith(
      'claim_notification_outbox',
      expect.objectContaining({ p_limit: 4 }),
    );
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ singleAttempt: true }));
    expect(patches[0]).toHaveProperty('delivery_started_at');
    expect(patches[1]).toMatchObject({ status: 'sent', provider_message_id: 'provider-fixture' });
  });
  it('holds an accepted send when persistence fails, rather than reporting success or requeueing', async () => {
    const { patches } = database({ finalError: true });
    const result = await processNotificationQueue();
    expect(result).toMatchObject({ sent: 0, failed: 1 });
    expect(patches.at(-1)).toMatchObject({ review_required: true });
    expect(patches.every((p) => p.status !== 'queued')).toBe(true);
    expect(mocks.send).toHaveBeenCalledOnce();
  });
  it('holds uncertain provider outcomes without automatic retries', async () => {
    const { patches } = database();
    mocks.send.mockRejectedValue(new Error('timeout'));
    const result = await processNotificationQueue();
    expect(result.sent).toBe(0);
    expect(result.errors).not.toHaveLength(0);
    expect(patches.at(-1).review_required).toBe(true);
    expect(mocks.send).toHaveBeenCalledOnce();
  });
  it('does not substitute empty statistics for unavailable storage', async () => {
    mocks.db = null;
    await expect(getQueueStats()).rejects.toThrow('database unavailable');
  });
});
