import { describe, expect, it, vi } from 'vitest';
import { createHmac } from 'node:crypto';
import { verifyTwilioVoiceRequest } from '@/lib/phone/twilio-voice-signature';

vi.mock('server-only', () => ({}));
const account = 'AC' + 'a'.repeat(32);
const call = 'CA' + 'b'.repeat(32);
const url = 'https://admin.elevateforhumanity.org/api/webhooks/twilio/voice';
const authToken = 'test-voice-token';
const form = new URLSearchParams({ AccountSid: account, CallSid: call, From: '+15551234567', To: '+15557654321' });
const signature = () => createHmac('sha1', authToken).update(url + [...form.keys()].sort().map(k => k + form.get(k)).join('')).digest('base64');
const subject = (overrides: Record<string, unknown> = {}) => verifyTwilioVoiceRequest({
  url, canonicalUrl: url, form, signature: signature(), authToken, accountSid: account, ...overrides,
} as Parameters<typeof verifyTwilioVoiceRequest>[0]);
describe('Twilio voice callback authentication', () => {
  it('accepts the configured account, call and valid signed form', () => {
    expect(subject().callSid).toBe(call);
  });
  it('rejects an invalid signature', () => {
    expect(() => subject({ signature: 'not-valid' })).toThrow();
  });
  it('rejects a mismatched account', () => {
    expect(() => subject({ accountSid: 'AC' + 'c'.repeat(32) })).toThrow();
  });
  it('rejects a different forwarded URL', () => {
    expect(() => subject({ url: 'https://untrusted.invalid/callback' })).toThrow();
  });
  it('rejects missing authorization', () => {
    expect(() => subject({ authToken: '' })).toThrow();
  });
});
