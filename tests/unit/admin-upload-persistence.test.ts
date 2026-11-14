// @vitest-environment node
import {beforeEach, expect, it, vi} from 'vitest';
const state=vi.hoisted(()=>({auth:vi.fn(),db:vi.fn(),upload:vi.fn(),remove:vi.fn(),insert:vi.fn(),owner:vi.fn()}));
vi.mock('@/lib/admin/guards',()=>({apiRequireAdmin:state.auth}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:state.db}));
vi.mock('@/lib/api/withRateLimit',()=>({applyRateLimit:async()=>null}));
import {POST} from '@/apps/admin/app/api/upload/route';
beforeEach(()=>{
 vi.clearAllMocks();state.auth.mockResolvedValue({id:'admin'});state.owner.mockResolvedValue({data:{id:'owner'},error:null});
 state.upload.mockResolvedValue({error:null});state.remove.mockResolvedValue({error:null});state.insert.mockReturnValue({select:()=>({single:async()=>({data:{id:'saved-document'},error:null})})});
 state.db.mockResolvedValue({storage:{from:()=>({upload:state.upload,remove:state.remove})},from:(table:string)=>table==='profiles'?{select:()=>({eq:()=>({maybeSingle:state.owner})})}:{insert:state.insert}});
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('{}')));
});
function request(owner?:string){const form=new FormData();form.append('file',new File(['%PDF document'],'evidence.pdf',{type:'application/pdf'}));form.append('category','admin-documents');if(owner)form.append('user_id',owner);return {formData:async()=>form,nextUrl:new URL('https://admin.elevateforhumanity.org/api/upload'),headers:new Headers()} as any;}
it('records the selected owner and returns an authorized review route after persistence',async()=>{
 const response=await POST(request('11111111-1111-4111-8111-111111111111'));
 expect(response.status).toBe(200);expect(await response.json()).toMatchObject({document_id:'saved-document',url:'/documents/review/saved-document'});
 expect(state.insert).toHaveBeenCalledWith(expect.objectContaining({user_id:'11111111-1111-4111-8111-111111111111',status:'pending',file_url:null,metadata:expect.objectContaining({storage_bucket:'documents'})}));
});
it('does not claim success if the dashboard record fails, and rolls back only its new storage object',async()=>{
 state.insert.mockReturnValue({select:()=>({single:async()=>({data:null,error:{message:'offline'}})})});
 const response=await POST(request());expect(response.status).toBe(503);
 const uploadedPath=state.upload.mock.calls[0][0];expect(state.remove).toHaveBeenCalledWith([uploadedPath]);
});
it('rejects a missing owner before uploading any file',async()=>{
 state.owner.mockResolvedValue({data:null,error:null});const response=await POST(request('11111111-1111-4111-8111-111111111111'));
 expect(response.status).toBe(404);expect(state.upload).not.toHaveBeenCalled();
});
