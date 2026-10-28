import {beforeEach,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({client:vi.fn(),preview:vi.fn(),redirect:vi.fn()}));
vi.mock('@/lib/supabase/server',()=>({createClient:mocks.client}));
vi.mock('@/lib/admin/course-preview',()=>({resolveCoursePreview:mocks.preview}));
vi.mock('@/lib/apprenticeship/registered-program-contract',()=>({getRegisteredProgramStandard:()=>null}));
vi.mock('next/navigation',()=>({notFound:()=>{throw Error('NOT_FOUND');},redirect:mocks.redirect}));
import CourseLandingPage from '@/apps/lms/app/lms/courses/[courseId]/page';
beforeEach(()=>{vi.clearAllMocks();mocks.redirect.mockImplementation(()=>{throw Error('LOGIN_REDIRECT');});});
it('a signed admin preview can return to the course without learner login or learner pacing RPCs',async()=>{
 const rpc=vi.fn();
 const db={rpc,auth:{getUser:async()=>({data:{user:null}})},from(table:string){
  const q:any={select:()=>q,eq:()=>q,match:()=>q,order:()=>q,limit:()=>q,
   maybeSingle:async()=>({data:table==='courses'?{id:'course',title:'Course',slug:'course'}:null,error:null}),
   then:(resolve:any)=>resolve({data:[],error:null})};return q;
 }};
 mocks.client.mockResolvedValue(db);mocks.preview.mockResolvedValue({active:true,db});
 expect(await CourseLandingPage({params:Promise.resolve({courseId:'course'})})).toBeTruthy();
 expect(mocks.redirect).not.toHaveBeenCalled();expect(rpc).not.toHaveBeenCalled();
});
it('a visitor without an active signed preview still requires learner login',async()=>{
 mocks.client.mockResolvedValue({auth:{getUser:async()=>({data:{user:null}})}});
 mocks.preview.mockResolvedValue({active:false,db:null});
 await expect(CourseLandingPage({params:Promise.resolve({courseId:'course'})})).rejects.toThrow('LOGIN_REDIRECT');
});
