import {beforeEach,expect,it,vi} from 'vitest';
vi.mock('server-only',()=>({}));
const state=vi.hoisted(()=>({holder:{status:'approved_pending_mou',approved_at:null,mou_terminated:false,suspended_at:null,terminated_at:null} as any,extension:{enabled:true,communication_workspaces:{phone_system_id:'system'}} as any}));
const db={from:(table:string)=>{const result=()=>({data:table==='profiles'?{id:'owner',role:'program_holder',is_active:true}:table==='user_roles'?[]:table==='program_holders'?state.holder:table==='communication_extensions'?state.extension:{id:'system',status:'active'}});const chain:any={select:()=>chain,eq:()=>chain,maybeSingle:async()=>result(),then:(resolve:any)=>Promise.resolve(result()).then(resolve)};return chain;}};
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:async()=>db}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:'owner'}}})}})}));
vi.mock('@/lib/admin/portal-preview',()=>({resolvePortalPreviewSubject:async()=>({previewing:false})}));
import {requireCommunicationActor} from '@/lib/communications/actor';
beforeEach(()=>{state.holder={status:'approved_pending_mou',approved_at:null,mou_terminated:false,suspended_at:null,terminated_at:null};state.extension={enabled:true,communication_workspaces:{phone_system_id:'system'}};});
it('treats an enabled assigned extension as phone-specific authorization while MOU is pending',async()=>{expect((await requireCommunicationActor({assignedPhone:true})).user.id).toBe('owner');});
it('retains approval requirements for email and other communication features',async()=>{await expect(requireCommunicationActor()).rejects.toThrow('COMMUNICATIONS_FORBIDDEN');});
it('does not grant phone access without an enabled assignment',async()=>{state.extension=null;await expect(requireCommunicationActor({assignedPhone:true})).rejects.toThrow('COMMUNICATIONS_FORBIDDEN');});
it.each([{status:'terminated'},{status:'suspended'},{mou_terminated:true},{suspended_at:'2026-01-01'},{terminated_at:'2026-01-01'}])('does not override withdrawn access: %j',async patch=>{Object.assign(state.holder,patch);await expect(requireCommunicationActor({assignedPhone:true})).rejects.toThrow('COMMUNICATIONS_FORBIDDEN');});

it('keeps an explicitly enabled work phone independent of an inactive training program',async()=>{state.holder.status='inactive';expect((await requireCommunicationActor({assignedPhone:true})).user.id).toBe('owner');await expect(requireCommunicationActor()).rejects.toThrow('COMMUNICATIONS_FORBIDDEN');});
