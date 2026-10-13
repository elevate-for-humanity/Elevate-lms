import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {randomBytes} from 'node:crypto';
const mock=vi.hoisted(()=>({admin:vi.fn(),notice:vi.fn(),hydrate:vi.fn()}));
vi.mock('@/lib/secrets',()=>({hydrateProcessEnv:mock.hydrate}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:mock.admin}));
vi.mock('@/lib/phone/message-notifications',()=>({notifyAssignee:mock.notice}));
import {POST} from '@/apps/admin/app/api/internal/phone/voicemail/route';
const id='11111111-1111-4111-a111-111111111111';
let secret:string;
const audio=Buffer.alloc(44);audio.write('RIFF');audio.write('WAVE',8);
const body={id,extension:'101',caller:'+13175550100',durationSeconds:2,createdAt:'2026-10-12T12:00:00Z',audioBase64:audio.toString('base64')};
function request(authorization=true){return new Request('https://example.invalid/api/internal/phone/voicemail',{method:'POST',headers:authorization?{Authorization:'Bearer '+secret}:{},body:JSON.stringify(body)});}
function database(extension:any={id:'extension',profile_id:'recipient',department:'Training'},failedTable=''){
 const writes:any[]=[];const upload=vi.fn().mockResolvedValue({error:null});
 const db={storage:{getBucket:vi.fn().mockResolvedValue({data:{public:false},error:null}),from:()=>({upload})},
 from:(table:string)=>{const q:any={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:table==='phone_systems'?{id,status:'active',voicemail_enabled:true,admin_extension:'0'}:table==='communication_workspaces'?{id:'workspace'}:table==='communication_extensions'?extension:null,error:null}),
 upsert:(value:any)=>{writes.push({table,value});return q;},then:(resolve:any)=>Promise.resolve({error:table===failedTable?{code:'failed'}:null}).then(resolve)};return q;}};
 mock.admin.mockResolvedValue(db);return {writes,upload};
}
beforeEach(()=>{
 vi.clearAllMocks();secret=randomBytes(32).toString('base64url');
 vi.stubEnv('PBX_PROVISIONING_TOKEN',secret);vi.stubEnv('PBX_PHONE_SYSTEM_ID',id);vi.stubEnv('ELEVATE_RUNTIME_CONFIG_PROVIDER','google-secret-manager');
 vi.stubGlobal('fetch',vi.fn(async(url:string)=>Response.json(url.includes('169.254')?{access_token:'fixture-token'}:{results:[{alternatives:[{transcript:'Please return my call.'}]}]})));
});
describe('owned voicemail boundary',()=>{
 it('rejects unauthenticated ingestion before database or audio access',async()=>{
  expect((await POST(request(false))).status).toBe(401);expect(mock.admin).not.toHaveBeenCalled();expect(fetch).not.toHaveBeenCalled();
 });
 it('requires an assigned enabled recipient before storing or emailing audio',async()=>{
  const {upload}=database(null);expect((await POST(request())).status).toBe(404);expect(upload).not.toHaveBeenCalled();expect(mock.notice).not.toHaveBeenCalled();
 });
 it('persists private audio and the transcript before notifying its recipient',async()=>{
  const {writes,upload}=database();expect((await POST(request())).status).toBe(200);
  expect(upload).toHaveBeenCalledWith(id+'.wav',expect.any(Buffer),expect.objectContaining({contentType:'audio/wav'}));
  expect(writes.find(x=>x.table==='voicemails').value).toMatchObject({assigned_profile_id:'recipient',transcription:'Please return my call.',recording_url:'supabase://phone-voicemails/'+id+'.wav'});
  expect(mock.notice).toHaveBeenCalledWith(expect.anything(),expect.objectContaining({profileId:'recipient',source:'voicemail',transcript:'Please return my call.'}),expect.anything());
 });
 it('does not send a notice after a lost voicemail write',async()=>{
  database(undefined,'voicemails');expect((await POST(request())).status).toBe(503);expect(mock.notice).not.toHaveBeenCalled();
 });
});

afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
