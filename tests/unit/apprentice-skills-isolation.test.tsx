import { expect, it, vi } from 'vitest';
const mock=vi.hoisted(()=>({filters:[] as any[], fail:false}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:'actor'}}})}})}));
vi.mock('@/lib/admin/portal-preview',()=>({resolvePortalPreviewSubject:async()=>({userId:'selected-learner',previewing:true})}));
vi.mock('@/lib/apprenticeship/registered-program-contract',()=>({getRegisteredProgramStandard:()=>({}),resolveRegisteredProgramContract:async()=>({standard:{competencyCount:1,competencies:[{id:'c1'}]},rtiProviders:[]})}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:async()=>({from:(table:string)=>{
 const q:any={select:()=>q,or:(value:string)=>{mock.filters.push([table,'or',value]);return q;},
 eq:(key:string,value:any)=>{mock.filters.push([table,key,value]);return q;},in:()=>q,order:()=>q,
 then:(resolve:any)=>resolve({error:mock.fail?new Error('offline'):null,data:table==='program_enrollments'?[{id:'enrollment',program_slug:'barber-apprenticeship'}]:[{competency_id:'c1',completed:true}]})};return q;
}})}));
import { GET } from '@/apps/lms/app/api/apprentice/appendix-a-progress/route';
it('canonical skills reads only the selected learner enrollment and its competency records',async()=>{
 mock.filters=[];mock.fail=false;const response=await GET();expect(response.status).toBe(200);
 expect(mock.filters).toContainEqual(['program_enrollments','or','user_id.eq.selected-learner,student_id.eq.selected-learner']);
 expect(mock.filters).toContainEqual(['apprentice_competency_records','enrollment_id','enrollment']);
});
it('reports lookup failure without returning a false empty checklist',async()=>{
 mock.fail=true;expect((await GET()).status).toBe(500);mock.fail=false;
});
