// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ db: vi.fn(), provider: vi.fn(), email: vi.fn(), sms: vi.fn() }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: mocks.db }));
vi.mock('@/lib/phone/telnyx', () => ({ verifyTelnyxWebhook: mocks.provider, telnyxClient: mocks.provider }));
vi.mock('@/lib/email/sendgrid', () => ({ sendEmail: mocks.email }));
vi.mock('@/lib/notifications/sms', () => ({ sendSMS: mocks.sms }));
import { POST } from '@/apps/admin/app/api/webhooks/telnyx/route';
import { POST as failover } from '@/apps/admin/app/api/webhooks/telnyx/failover/route';
afterEach(() => { vi.clearAllMocks(); vi.unstubAllGlobals(); });

// Active routing acceptance belongs to Twilio/Asterisk. Every legacy event
// must now terminate without writes, provider calls, or notification delivery.
describe('retired Telnyx webhook boundaries', () => {
  it.each([
    'call.initiated', 'call.answered', 'call.hangup',
    'call.gather.ended', 'call.gather.invalid', 'call.speak.ended',
    'call.recording.saved', 'call.recording.transcription.saved',
    'call.ai_gather.ended', 'message.received', 'message.sent', 'message.finalized',
  ])('rejects %s on primary and failover without side effects', async (event_type) => {
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    for (const handler of [POST, failover]) {
      const request = new Request('https://admin.example/api/webhooks/telnyx', {
        method: 'POST', body: JSON.stringify({ data: { event_type } }),
      });
      const response = await handler(request);
      expect(response.status).toBe(410);
      expect(await response.json()).toMatchObject({ retired: true, provider: 'telnyx' });
      expect(request.bodyUsed).toBe(false);
    }
    for (const mock of Object.values(mocks)) expect(mock).not.toHaveBeenCalled();
    expect(fetcher).not.toHaveBeenCalled();
  });
});
