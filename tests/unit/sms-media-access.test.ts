import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(()=>({actor:vi.fn()}));
vi.mock('@/lib/phone/actor-response',()=>({phoneActorResponse:mocks.actor}));
vi.mock('@/lib/secrets',()=>({hydrateProcessEnv:vi.fn(async()=>{})}));
import { smsMediaGet } from '@/lib/phone/sms-media-api';
const id='11111111-1111-4111-8111-111111111111';
beforeEach(()=>vi.clearAllMocks());
afterEach(()=>vi.unstubAllGlobals());
describe('private picture access',()=>{
  it('requires authentication before media retrieval',async()=>{
    mocks.actor.mockResolvedValue({response:new Response(null,{status:401})});
    expect((await smsMediaGet(id,'0')).status).toBe(401);
  });
  it('scopes reads to the caller system and owner before downloading',async()=>{
    const eq=vi.fn(()=>chain);
    const chain:any={select:()=>chain,eq,maybeSingle:async()=>({data:null})};
    const download=vi.fn();
    mocks.actor.mockResolvedValue({actor:{system:{id:'system'},user:{id:'owner'},roles:['staff'],db:{from:()=>chain,storage:{from:()=>({download})}}}});
    expect((await smsMediaGet(id,'0')).status).toBe(404);
    expect(eq).toHaveBeenCalledWith('phone_system_id','system');
    expect(eq).toHaveBeenCalledWith('owner_profile_id','owner');
    expect(download).not.toHaveBeenCalled();
  });
  it('rejects a storage path pointing outside the authorized message',async()=>{
    const chain:any={select:()=>chain,eq:()=>chain,maybeSingle:async()=>({data:{id,owner_profile_id:'owner',media:[{kind:'storage',path:'another-customer/picture',contentType:'image/jpeg'}]}})};
    const download=vi.fn();
    mocks.actor.mockResolvedValue({actor:{system:{id:'system'},user:{id:'owner'},roles:['staff'],db:{from:()=>chain,storage:{from:()=>({download})}}}});
    expect((await smsMediaGet(id,'0')).status).toBe(404);
    expect(download).not.toHaveBeenCalled();
  });
});
