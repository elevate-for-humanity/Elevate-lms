// @vitest-environment node
import { generateKeyPairSync, sign } from 'node:crypto';
import { afterEach, expect, it, vi } from 'vitest';
const m = vi.hoisted(()=>({rpc:vi.fn()}));
vi.mock('@/lib/secrets',()=>({hydrateProcessEnv:async()=>{}}));
vi.mock('@/lib/supabase/admin',()=>({getAdminClient:async()=>({rpc:m.rpc})}));
import { POST } from '@/apps/lms/app/api/webhooks/sendgrid-events/route';
const keys=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
const publicKey=keys.publicKey.export({type:'spki',format:'pem'}).toString();
const event={elevate_email_log_id:'00000000-0000-4000-8000-000000000001',sg_event_id:'event-one',sg_message_id:'message-one',event:'delivered',timestamp:Math.floor(Date.now()/1000)};
function request(events:unknown){
 const raw=JSON.stringify(events),timestamp=String(Math.floor(Date.now()/1000));
 const signature=sign('sha256',Buffer.from(timestamp+raw),keys.privateKey).toString('base64');
 return new Request('https://app.elevateforhumanity.org/api/webhooks/sendgrid-events',{method:'POST',body:raw,headers:{'x-twilio-email-event-webhook-timestamp':timestamp,'x-twilio-email-event-webhook-signature':signature}});
}
afterEach(()=>{vi.unstubAllEnvs();vi.clearAllMocks();});
it('verifies the signature and acknowledges only a durable transaction',async()=>{
 vi.stubEnv('SENDGRID_EVENT_WEBHOOK_PUBLIC_KEY',publicKey);m.rpc.mockResolvedValue({data:true,error:null});
 const response=await POST(request([event]));expect(response.status).toBe(200);expect(await response.json()).toMatchObject({recorded:1});
 expect(m.rpc).toHaveBeenCalledWith('record_sendgrid_delivery_event',expect.objectContaining({p_event:'delivered',p_event_id:'event-one'}));
});
it.each([{data:false,error:null},{data:null,error:{message:'private'}}])('returns retryable failure when delivery evidence cannot be saved',async result=>{
 vi.stubEnv('SENDGRID_EVENT_WEBHOOK_PUBLIC_KEY',publicKey);m.rpc.mockResolvedValue(result);
 expect((await POST(request([event]))).status).toBe(503);
});
it('rejects oversized batches rather than silently dropping events',async()=>{
 vi.stubEnv('SENDGRID_EVENT_WEBHOOK_PUBLIC_KEY',publicKey);
 expect((await POST(request(Array(1001).fill(event)))).status).toBe(400);expect(m.rpc).not.toHaveBeenCalled();
});
it('invalid signatures cannot mutate delivery records',async()=>{
 vi.stubEnv('SENDGRID_EVENT_WEBHOOK_PUBLIC_KEY',publicKey);
 expect((await POST(new Request('https://example.test',{method:'POST',body:'[]'}))).status).toBe(401);expect(m.rpc).not.toHaveBeenCalled();
});

it('accepts the DER verification-key representation without exposing key material',async()=>{
 vi.stubEnv('SENDGRID_EVENT_WEBHOOK_PUBLIC_KEY',keys.publicKey.export({type:'spki',format:'der'}).toString('base64'));
 m.rpc.mockResolvedValue({data:true,error:null});
 expect((await POST(request([event]))).status).toBe(200);
});
