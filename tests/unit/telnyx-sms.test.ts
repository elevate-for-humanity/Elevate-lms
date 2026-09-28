import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: vi.fn(async () => {}) }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock('@/lib/supabase/admin', () => ({ getAdminClient: vi.fn(async () => null) }));

import { smsService } from '@/lib/notifications/sms';

describe('operational text delivery', () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.TELNYX_API_KEY;
  const originalNumber = process.env.TELNYX_PHONE_NUMBER;

  beforeEach(() => {
    process.env.TELNYX_API_KEY = 'test-key';
    process.env.TELNYX_PHONE_NUMBER = '+13175550000';
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.TELNYX_API_KEY;
    else process.env.TELNYX_API_KEY = originalKey;
    if (originalNumber === undefined) delete process.env.TELNYX_PHONE_NUMBER;
    else process.env.TELNYX_PHONE_NUMBER = originalNumber;
  });

  it('sends a consented operational message to the configured Telnyx sender', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ data: { id: 'message-123' } }), { status: 200 }));
    globalThis.fetch = fetchMock as typeof fetch;
    const result = await smsService.send({ to: '(317) 555-0100', message: 'Your appointment is tomorrow.' });
    expect(result).toEqual({ success: true, messageId: 'message-123' });
    const [url, options] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.telnyx.com/v2/messages');
    expect(JSON.parse(String(options.body))).toEqual({
      to: '+13175550100', from: '+13175550000', text: 'Your appointment is tomorrow.',
    });
  });

  it('fails closed when a sender is not configured', async () => {
    delete process.env.TELNYX_API_KEY;
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;
    const result = await smsService.send({ to: '3175550100', message: 'Hello' });
    expect(result.success).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
