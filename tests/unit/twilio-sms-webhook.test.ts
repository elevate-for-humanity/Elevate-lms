import { createHmac } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ db:vi.fn(), store:vi.fn(async (_db: unknown, _event: unknown) => {}) }));
vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv:vi.fn(async () => {}) }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient:mocks.db }));
vi.mock('@/lib/phone/sms-inbound', () => ({ storeSmsEvent:mocks.store }));
import { twilioSmsWebhook } from '@/lib/phone/twilio-sms-webhook';
import { TWILIO_SMS_WEBHOOK } from '@/lib/phone/twilio';
const account='AC'+'a'.repeat(32), sid='SM'+'b'.repeat(32), token='test-token';
function request(extra: Record<string,string>={}, status=false) {
  const params=new URLSearchParams({ AccountSid:account,MessageSid:sid,From:'+13175550100',To:'+14632401404',Body:'Hello',...extra });
  const url=TWILIO_SMS_WEBHOOK+(status?'/status':'');
  const signature=createHmac('sha1',token).update(url+[...params.keys()].sort().map(key=>key+params.get(key)).join('')).digest('base64');
  return new Request(url,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','X-Twilio-Signature':signature},body:params.toString()});
}
beforeEach(()=> { vi.clearAllMocks(); vi.stubEnv('TWILIO_ACCOUNT_SID',account);vi.stubEnv('TWILIO_AUTH_TOKEN',token); });
afterEach(()=>vi.unstubAllEnvs());
describe('signed SMS delivery to the existing inbox',()=>{
  it('rejects unsigned and other-account callbacks before reading the database',async()=>{
    expect((await twilioSmsWebhook(new Request(TWILIO_SMS_WEBHOOK,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'Body=Hello'}))).status).toBe(403);
    expect((await twilioSmsWebhook(request({AccountSid:'AC'+'d'.repeat(32)}))).status).toBe(403);
    expect(mocks.db).not.toHaveBeenCalled();
  });
  it('maps an authenticated incoming picture to the configured number and stable receipt ID',async()=>{
    const chain:any={select:()=>chain,eq:vi.fn(()=>chain),maybeSingle:async()=>({data:{id:'number'}})};
    mocks.db.mockResolvedValue({from:()=>chain});
    const media='ME'+'c'.repeat(32);
    expect((await twilioSmsWebhook(request({NumMedia:'1',MediaUrl0:`https://api.twilio.com/2010-04-01/Accounts/${account}/Messages/${sid}/Media/${media}`,MediaContentType0:'image/jpeg'}))).status).toBe(200);
    const event=mocks.store.mock.calls[0][1] as any;
    expect(event.data.id).toBe(`twilio:${sid}`);
    expect(event.data.payload.media).toEqual([{kind:'twilio',sid:media,contentType:'image/jpeg'}]);
    expect(chain.eq).toHaveBeenCalledWith('provider','twilio');
  });
  it('requests retry when a delivery receipt arrives before its acceptance record',async()=>{
    const chain:any={select:()=>chain,eq:()=>chain,maybeSingle:async()=>({data:null}),limit:async()=>({data:[]})};
    mocks.db.mockResolvedValue({from:()=>chain});
    expect((await twilioSmsWebhook(request({MessageStatus:'delivered'},true),true)).status).toBe(503);
  });
  it('does not downgrade a delivered message when a late sent callback arrives',async()=>{
    const message={id:'message',status:'delivered'};
    let patch:any;
    const chain:any={select:()=>chain,eq:()=>chain,maybeSingle:async()=>({data:message}),limit:async()=>({data:[]}),
      update:(value:any)=>{patch=value;return chain;},in:async(_key:string,statuses:string[])=>{if(statuses.includes(message.status))Object.assign(message,patch);return{};}};
    mocks.db.mockResolvedValue({from:()=>chain});
    expect((await twilioSmsWebhook(request({MessageStatus:'sent'},true),true)).status).toBe(204);
    expect(message.status).toBe('delivered');
  });
});
