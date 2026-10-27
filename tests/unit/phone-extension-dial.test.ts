import {beforeEach,describe,expect,it,vi} from 'vitest';
const mock=vi.hoisted(()=>({actor:vi.fn()}));
vi.mock('@/lib/phone/actor-response',()=>({phoneActorResponse:mock.actor}));
import {POST} from '@/apps/lms/app/api/communications/phone/dial/route';
const request=()=>new Request('https://example.invalid/api/communications/phone/dial',{method:'POST',body:JSON.stringify({extension:'101'})});
function setup(extension:any,devices:any=[]){
 const filters:any[]=[];
 const db={from:(table:string)=>{const q:any={select:()=>q,eq:(key:string,value:unknown)=>{filters.push({table,key,value});return q;},
  gte:()=>q,order:()=>q,limit:()=>q,maybeSingle:async()=>({data:extension,error:null}),
  then:(resolve:any)=>Promise.resolve({data:devices,error:null}).then(resolve)};
 return q;}};
 mock.actor.mockResolvedValue({actor:{db,extension:{workspace_id:'own-workspace'},previewing:false},response:null});return filters;
}
beforeEach(()=>vi.clearAllMocks());
describe('scoped extension dialing',()=>{
 it('resolves only an enabled connected phone in the caller workspace',async()=>{
  const filters=setup({id:'destination',webrtc_provider:'asterisk',ring_mode:'ring'},[{sip_username:'verified_phone'}]);
  const response=await POST(request());expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({destination:'sip:verified_phone@phone.elevateforhumanity.org'});
  expect(filters).toContainEqual({table:'communication_extensions',key:'workspace_id',value:'own-workspace'});
  expect(filters).toContainEqual({table:'phone_webrtc_devices',key:'extension_id',value:'destination'});
 });
 it('rejects a destination outside the workspace instead of guessing',async()=>{setup(null);expect((await POST(request())).status).toBe(404);});
 it('does not invent a SIP identity for an offline phone',async()=>{setup({id:'destination',webrtc_provider:'asterisk',ring_mode:'ring'});expect((await POST(request())).status).toBe(409);});
 it('rejects injected destinations',async()=>{setup({id:'destination',webrtc_provider:'asterisk',ring_mode:'ring'},[{sip_username:'other@untrusted.invalid'}]);expect((await POST(request())).status).toBe(409);});
 it('keeps administrator previews read-only',async()=>{mock.actor.mockResolvedValue({actor:{previewing:true},response:null});expect((await POST(request())).status).toBe(403);});
});
