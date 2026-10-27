import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: vi.fn(async () => {}) }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock('@/lib/supabase/admin', () => ({ getAdminClient: vi.fn(async () => ({
  from: (table: string) => {
    const chain: any = { select: () => chain, is: () => chain, eq: () => chain,
      maybeSingle: async () => ({ data: table === 'phone_systems' ? {id:'platform'} : {e164:'+14632401404',capabilities:{sms:true}} }),
      insert: async () => ({error:null}) };
    return chain;
  },
})) }));
import { smsService } from '@/lib/notifications/sms';
const account = 'AC' + 'a'.repeat(32), sid = 'SM' + 'b'.repeat(32);
describe('operational Twilio text delivery', () => {
  beforeEach(() => {
    vi.stubEnv('TWILIO_ACCOUNT_SID', account);
    vi.stubEnv('TWILIO_AUTH_TOKEN', 'test-token');
    vi.stubEnv('TWILIO_API_KEY_SID', '');
    vi.stubEnv('TWILIO_API_KEY_SECRET', '');
    // A stale legacy number must never become the Twilio sender.
    vi.stubEnv('TWILIO_PHONE_NUMBER', '+13173143757');
    vi.stubEnv('TELNYX_PHONE_NUMBER', '+13179999620');
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
  it('sends a consented operational message using the active database sender', async () => {
    const request = vi.fn(async () => new Response(JSON.stringify({ sid }), { status:201 }));
    vi.stubGlobal('fetch', request);
    expect(await smsService.send({to:'(317) 555-0100',message:'Your appointment is tomorrow.'})).toEqual({success:true,messageId:sid});
    const [url, options] = request.mock.calls[0] as unknown as [string,RequestInit];
    expect(url).toContain(`api.twilio.com/2010-04-01/Accounts/${account}/Messages.json`);
    const params = new URLSearchParams(String(options.body));
    expect(params.get('From')).toBe('+14632401404');
    expect(params.get('To')).toBe('+13175550100');
    expect(params.get('Body')).toBe('Your appointment is tomorrow.');
  });
  it('fails closed without credentials and does not use Telnyx', async () => {
    vi.stubEnv('TWILIO_AUTH_TOKEN','');
    const request = vi.fn();
    vi.stubGlobal('fetch', request);
    expect((await smsService.send({to:'3175550100',message:'Hello'})).success).toBe(false);
    expect(request).not.toHaveBeenCalled();
  });
});
