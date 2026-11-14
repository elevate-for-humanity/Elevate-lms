// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ admin: vi.fn(), verify: vi.fn(), sms: vi.fn(), email: vi.fn() }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: mocks.admin }));
vi.mock('@/lib/phone/telnyx', () => ({ verifyTelnyxWebhook: mocks.verify, telnyxClient: mocks.verify }));
vi.mock('@/lib/notifications/sms', () => ({ sendSMS: mocks.sms }));
vi.mock('@/lib/email/sendgrid', () => ({ sendEmail: mocks.email }));
import { POST } from '@/apps/admin/app/api/webhooks/telnyx/route';
afterEach(() => vi.clearAllMocks());

// Retirement supersedes active carrier persistence. Replayed payloads must
// neither alter historical evidence nor trigger the replacement provider.
describe('retired carrier persistence boundary', () => {
  it.each([
    '{}', 'invalid JSON',
    JSON.stringify({ data: { id: 'old-receipt', event_type: 'call.hangup' } }),
    JSON.stringify({ data: { event_type: 'call.recording.transcription.saved', payload: { transcription_text: '<script>untrusted</script>' } } }),
    JSON.stringify({ data: { event_type: 'message.received', payload: { text: 'legacy replay' } } }),
  ])('rejects a legacy payload without loading credentials or touching history: %s', async (body) => {
    mocks.admin.mockRejectedValue(new Error('database unavailable'));
    mocks.verify.mockRejectedValue(new Error('invalid signature'));
    const request = new Request('https://example.invalid/api/webhooks/telnyx', { method: 'POST', body });
    const response = await POST(request);
    expect(response.status).toBe(410);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(request.bodyUsed).toBe(false);
    expect(await response.json()).toMatchObject({ retired: true });
    for (const mock of Object.values(mocks)) expect(mock).not.toHaveBeenCalled();
  });
});
