import { afterEach, expect, it, vi } from 'vitest';
vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: async () => {} }));
import { sendTwilioMessage } from '@/lib/phone/twilio';
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
it.each(['', 'MG' + 'c'.repeat(32)])('preserves the selected sender with service %s', async service => {
  vi.stubEnv('TWILIO_ACCOUNT_SID', 'AC' + 'a'.repeat(32));
  vi.stubEnv('TWILIO_AUTH_TOKEN', 'test-token');
  vi.stubEnv('TWILIO_MESSAGING_SERVICE_SID', service);
  const fetcher = vi.fn(async () => new Response(JSON.stringify({ sid: 'SM' + 'b'.repeat(32) }), { status: 201 }));
  vi.stubGlobal('fetch', fetcher);
  await sendTwilioMessage({ from: '+14632401404', to: '+13175550100', body: 'Hello' });
  const body = new URLSearchParams(String((fetcher.mock.calls[0] as unknown as [string, RequestInit])[1].body));
  expect(body.get('From')).toBe('+14632401404');
  expect(body.get('MessagingServiceSid')).toBe(service || null);
});
