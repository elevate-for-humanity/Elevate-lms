// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
const state=vi.hoisted(()=>({calls:[] as any[],cohorts:[{id:'owned',name:'Owned cohort'}] as any[],enrollments:[] as any[]}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:async()=>({from:(table:string)=>{
 const call:any={table,filters:[]};state.calls.push(call);
 const q:any={select:(value:string)=>{call.select=value;return q;},eq:(key:string,value:any)=>{call.filters.push([key,value]);return q;},in:(key:string,value:any)=>{call.filters.push([key,value]);return q;},is:()=>q,order:()=>q,
 then:(resolve:any)=>Promise.resolve({data:table==='cohorts'?state.cohorts:state.enrollments,error:null}).then(resolve)};return q;
}})}));
import { getOrgCohorts,getOrgLearners } from '@/lib/lms/engine/org-scope';
beforeEach(()=>{state.calls=[];state.cohorts=[{id:'owned',name:'Owned cohort'}];state.enrollments=[];});
it('counts distinct canonical learners without querying the nonexistent cohort enrollment table',async()=>{
 state.enrollments=[{cohort_id:'owned',user_id:'one'},{cohort_id:'owned',user_id:'one'},{cohort_id:'owned',user_id:'two'}];
 expect((await getOrgCohorts('organization'))[0].enrolledCount).toBe(2);
 expect(state.calls.map(x=>x.table)).toEqual(['cohorts','program_enrollments']);
 expect(state.calls[1].filters).toContainEqual(['cohort_id',['owned']]);
});
it('resolves organization-owned cohorts before reading learner information',async()=>{
 state.enrollments=[{cohort_id:'owned',user_id:'one',full_name:'Learner',email:'fixture@example.invalid',status:'active',enrolled_at:'2026-10-01'}];
 expect((await getOrgLearners('organization','owned'))[0]).toMatchObject({userId:'one',cohortName:'Owned cohort',enrollmentStatus:'active'});
 expect(state.calls[0].filters).toContainEqual(['organization_id','organization']);
 expect(state.calls[0].filters).toContainEqual(['id','owned']);
 expect(state.calls[1].filters).toContainEqual(['cohort_id',['owned']]);
});
it('does not read any learners for a cohort outside the authorized organization',async()=>{
 state.cohorts=[];
 expect(await getOrgLearners('organization','foreign')).toEqual([]);
 expect(state.calls.map(x=>x.table)).toEqual(['cohorts']);
});
