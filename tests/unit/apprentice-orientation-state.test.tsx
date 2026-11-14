import { describe, it, expect, vi } from 'vitest';
const mock=vi.hoisted(()=>({ writes:[] as any[], filters:[] as any[], saved:true }));
vi.mock('@/components/orientation/VisualDashboardOrientation',()=>({default:()=>null}));
vi.mock('next/navigation',()=>({redirect:(url:string)=>{throw Error(url);}}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:'learner'}}})}})}));
vi.mock('@/lib/admin/portal-preview',()=>({resolvePortalPreviewSubject:async()=>({userId:'learner',previewing:false})}));
vi.mock('@/lib/portal/resolve-apprentice-program',()=>({resolveApprenticeProgramSlug:async()=> 'barber-apprenticeship'}));
vi.mock('@/lib/supabase/admin',()=>{
 const db={from:()=>{const q:any={select:()=>q,update:(v:any)=>{mock.writes.push(v);return q;},
  eq:(k:string,v:any)=>{mock.filters.push([k,v]);return q;},or:(v:string)=>{mock.filters.push(['or',v]);return q;},
  in:(k:string,v:any)=>{mock.filters.push([k,v]);return q;},order:()=>q,limit:()=>q,
  maybeSingle:async()=>({data:{orientation_completed_at:null}}),
  then:(resolve:any)=>resolve({data:mock.saved?[{id:'enrollment'}]:[],error:null})};return q;}};
 return {requireAdminClient:async()=>db,getAdminClient:async()=>db};
});
import Page from '@/apps/lms/app/apprentice/orientation/page';
function findForm(node:any):any {
 if(!node||typeof node!=='object')return null;
 if(node.type==='form')return node;
 for(const child of [node.props?.children].flat(Infinity)){const f=findForm(child);if(f)return f;}
 return null;
}
describe('orientation is an acknowledgement, not an authorization override',()=>{
 it('records completion only for eligible owned enrollments without granting or resetting access',async()=>{
  mock.writes=[];mock.filters=[];mock.saved=true;
  const form=findForm(await Page({searchParams:Promise.resolve({})}));
  const data=new FormData();data.set('programSlug','barber-apprenticeship');
  await expect(form.props.action(data)).rejects.toThrow('/apprentice?orientation=complete');
  expect(mock.writes).toHaveLength(1);
  expect(Object.keys(mock.writes[0]).sort()).toEqual(['orientation_completed_at','updated_at']);
  expect(mock.filters).toContainEqual(['or','user_id.eq.learner,student_id.eq.learner']);
  expect(mock.filters).toContainEqual(['status',['active','enrolled','in_progress','confirmed']]);
 });
 it('does not report success if no eligible enrollment was updated',async()=>{
  mock.saved=false;
  const form=findForm(await Page({searchParams:Promise.resolve({})}));
  await expect(form.props.action(new FormData())).rejects.toThrow('error=save');
 });
});
