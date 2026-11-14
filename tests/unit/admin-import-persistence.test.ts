// @vitest-environment node
import {beforeEach,expect,it,vi} from 'vitest';
const state=vi.hoisted(()=>({saved:null as any,error:null as any}));
vi.mock('@/lib/admin/guards',()=>({apiRequireAdmin:async()=>({id:'admin'})}));
vi.mock('@/lib/api/withRateLimit',()=>({applyRateLimit:async()=>null}));
vi.mock('@/lib/admin/audit-log',()=>({logAdminAudit:async()=>{},AdminAction:{BULK_IMPORT_EXECUTED:'import'},BULK_ENTITY_ID:'bulk'}));
vi.mock('@/lib/audit/withApiAudit',()=>({withApiAudit:(_path:string,handler:any)=>handler}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({from:(table:string)=>{
 let writing=false;
 const q:any={select:()=>q,eq:()=>q,update:()=>{writing=true;return q;},insert:()=>{writing=true;return q;},maybeSingle:async()=>writing?{data:state.saved,error:state.error}:{data:table==='profiles'?{id:'student',tenant_id:'tenant'}:table==='courses'?{id:'course'}:{id:'existing'},error:null}};
 return q;
}})}));
import {POST} from '@/apps/admin/app/api/admin/import/route';
beforeEach(()=>{state.saved=null;state.error=null;});
function request(type:string){
 const form=new FormData();form.append('type',type);
 form.append('file',new File(['email,student_email,course_code,company_name\nstudent@example.com,student@example.com,course,Saved Company'],'rows.csv'));
 return {formData:async()=>form,headers:new Headers(),url:'https://admin.elevateforhumanity.org/api/admin/import'} as any;
}
it.each(['students','enrollments','employers'])('does not count an unpersisted %s update as imported',async(type)=>{
 const response=await POST(request(type));expect(await response.json()).toMatchObject({success:false,imported:0,failed:1});
});
it('does not count a database write error as imported',async()=>{
 state.error={message:'database unavailable'};
 expect(await (await POST(request('employers'))).json()).toMatchObject({success:false,imported:0,failed:1});
});
it('counts a confirmed saved employer',async()=>{
 state.saved={id:'saved'};
 expect(await (await POST(request('employers'))).json()).toMatchObject({success:true,imported:1,failed:0});
});
