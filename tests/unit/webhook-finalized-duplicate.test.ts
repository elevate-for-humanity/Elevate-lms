import { beforeEach, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({
  status: 'processing',
  duplicate: true,
  updateError: false,
  readError: false,
  missingUpdate: false,
}));
vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: async () => ({
    from: () => {
      const query: any = {
        insert: async () => ({ error: m.duplicate ? { code: '23505' } : null }),
        select: () => query,
        eq: () => query,
        update: () => query,
        maybeSingle: async () => ({
          data: { status: m.status },
          error: m.readError ? { message: 'Unavailable' } : null,
        }),
        then: (resolve: any) =>
          Promise.resolve({
            data: m.missingUpdate ? [] : [{ id: 'event' }],
            error: m.updateError ? { message: 'Unavailable' } : null,
          }).then(resolve),
      };
      return query;
    },
  }),
}));
import { claimWebhookEvent, finalizeWebhookEvent } from '@/lib/webhooks/event-tracker';
beforeEach(() => {
  Object.assign(m, {
    status: 'processing',
    duplicate: true,
    updateError: false,
    readError: false,
    missingUpdate: false,
  });
});
it.each(['processing', 'errored', 'failed', 'received', 'validated'])(
  'does not acknowledge a duplicate in %s state',
  async (status) => {
    m.status = status;
    expect(
      await claimWebhookEvent(
        'sendgrid-inbound',
        'event',
        'email.received',
        {},
        { requireFinalizedDuplicate: true },
      ),
    ).toMatchObject({ confident: false, shouldProcess: true });
  },
);
it.each(['processed', 'skipped'])(
  'acknowledges an already finalized %s event without replay',
  async (status) => {
    m.status = status;
    expect(
      await claimWebhookEvent(
        'sendgrid-inbound',
        'event',
        'email.received',
        {},
        { requireFinalizedDuplicate: true },
      ),
    ).toMatchObject({ confident: true, shouldProcess: false });
  },
);
it('preserves the existing duplicate contract for other webhook callers', async () => {
  expect(await claimWebhookEvent('stripe', 'event', 'payment')).toMatchObject({
    confident: true,
    shouldProcess: false,
  });
});
it('fails closed if duplicate lookup fails and propagates strict finalization failures', async () => {
  m.readError = true;
  expect(
    await claimWebhookEvent(
      'sendgrid-inbound',
      'event',
      'email.received',
      {},
      { requireFinalizedDuplicate: true },
    ),
  ).toMatchObject({ confident: false });
  m.updateError = true;
  await expect(
    finalizeWebhookEvent('sendgrid-inbound', 'event', 'processed', undefined, { strict: true }),
  ).rejects.toThrow('finalization');
});

it('strict finalization requires exactly one durable event row', async () => {
  await expect(
    finalizeWebhookEvent('sendgrid-inbound', 'event', 'processed', undefined, { strict: true }),
  ).resolves.toBeUndefined();
  m.missingUpdate = true;
  await expect(
    finalizeWebhookEvent('sendgrid-inbound', 'missing', 'processed', undefined, { strict: true }),
  ).rejects.toThrow('finalization');
});
