import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: vi.fn(async () => {}) }));
import { inboundTwilioMedia, sendTwilioMessage, TWILIO_SMS_WEBHOOK, validTwilioSignature } from '@/lib/phone/twilio';

const account = 'AC' + 'a'.repeat(32), sid = 'SM' + 'b'.repeat(32), mediaSid = 'ME' + 'c'.repeat(32);
beforeEach(() => {
  vi.stubEnv('TWILIO_ACCOUNT_SID', account);
  vi.stubEnv('TWILIO_AUTH_TOKEN', 'test-token');
  vi.stubEnv('TWILIO_API_KEY_SID', '');
  vi.stubEnv('TWILIO_API_KEY_SECRET', '');
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('Twilio carrier messaging', () => {
  it('validates Twilio published signature vector and rejects changed destinations', () => {
    // https://www.twilio.com/docs/usage/security — published algorithm example.
    const url = 'https://example.com/myapp.php?foo=1&bar=2';
    const params = new URLSearchParams({ CallSid:'CA1234567890ABCDE', Caller:'+14158675310', Digits:'1234', From:'+14158675310', To:'+18005551212' });
    const signature = 'L/OH5YylLD5NRKLltdqwSvS0BnU=';
    expect(validTwilioSignature('12345', url, params, signature)).toBe(true);
    expect(validTwilioSignature('12345', url + '&changed=1', params, signature)).toBe(false);
    params.set('To', '+18005550000');
    expect(validTwilioSignature('12345', url, params, signature)).toBe(false);
    params.append('To', '+18005551212');
    expect(validTwilioSignature('12345', url, params, signature)).toBe(false);
  });

  it('uses Twilio form API, supplied business sender, media and delivery callback', async () => {
    const request = vi.fn(async () => new Response(JSON.stringify({ sid }), { status: 201 }));
    vi.stubGlobal('fetch', request);
    expect(await sendTwilioMessage({ from:'+14632401404', to:'+13175550100', body:'Picture', mediaUrls:['https://storage.example.test/photo?token=signed'] })).toEqual({ messageId: sid });
    const [url, options] = request.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`https://api.twilio.com/2010-04-01/Accounts/${account}/Messages.json`);
    const body = new URLSearchParams(String(options.body));
    expect(body.get('From')).toBe('+14632401404');
    expect(body.get('To')).toBe('+13175550100');
    expect(body.get('StatusCallback')).toBe(TWILIO_SMS_WEBHOOK + '/status');
    expect(body.getAll('MediaUrl')).toEqual(['https://storage.example.test/photo?token=signed']);
    expect(options.redirect).toBe('error');
  });

  it('does not send without credentials or retry ambiguous acceptance', async () => {
    const request = vi.fn(async () => new Response('{}', { status: 201 }));
    vi.stubGlobal('fetch', request);
    vi.stubEnv('TWILIO_AUTH_TOKEN', '');
    await expect(sendTwilioMessage({from:'+14632401404',to:'+13175550100',body:'Hello'})).rejects.toThrow();
    expect(request).not.toHaveBeenCalled();
    vi.stubEnv('TWILIO_AUTH_TOKEN', 'test-token');
    await expect(sendTwilioMessage({from:'+14632401404',to:'+13175550100',body:'Hello'})).rejects.toThrow('acceptance');
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('stores only account-bound media identifiers and rejects arbitrary fetch URLs', () => {
    const params = new URLSearchParams({ MessageSid:sid, NumMedia:'1', MediaUrl0:`https://api.twilio.com/2010-04-01/Accounts/${account}/Messages/${sid}/Media/${mediaSid}`, MediaContentType0:'image/jpeg' });
    expect(inboundTwilioMedia(params)).toEqual([{kind:'twilio',sid:mediaSid,contentType:'image/jpeg'}]);
    params.set('MediaUrl0','https://example.test/private');
    expect(() => inboundTwilioMedia(params)).toThrow();
    params.set('NumMedia','11');
    expect(() => inboundTwilioMedia(params)).toThrow();
  });
});
