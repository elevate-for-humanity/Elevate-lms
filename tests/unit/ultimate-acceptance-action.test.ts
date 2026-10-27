import {beforeEach,it,expect,vi} from 'vitest';
import {NextRequest} from 'next/server';
const state=vi.hoisted(()=>({db:null as any,legacy:{id:'legacy',profile:{},status:'running'},acceptance:null as any,inserted:vi.fn(),queued:vi.fn(),filter:vi.fn(),courseUpdates:vi.fn()}));
vi.mock('@/lib/ultimate-course-builder/worker/dispatch-evidence',()=>({recordCourseDispatch:vi.fn().mockResolvedValue(true)}));
vi.mock('@/lib/admin/guards',()=>({apiRequireAdmin:vi.fn().mockResolvedValue({id:'admin',error:null})}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:()=>state.db}));
vi.mock('@/lib/ultimate-course-builder/core/course-profile',()=>({buildUltimateProfile:vi.fn().mockResolvedValue({id:'profile',competencies:[],sourceDocuments:[],title:'Barber'})}));
vi.mock('@/lib/ultimate-course-builder/worker/job-queue',()=>({UltimateJobQueue:class{enqueue=state.queued}}));
vi.mock('@/lib/gcp/dispatch-production-workflow',()=>({dispatchGoogleDeployment:vi.fn().mockResolvedValue({actionsUrl:'https://github.com/elevate-for-humanity/Elevate-lms/actions'})}));
import {POST} from '../../apps/admin/app/api/admin/ultimate-course-builder/route';
beforeEach(()=>{
  state.acceptance=null;state.inserted.mockReset();state.filter.mockReset();state.courseUpdates.mockReset();state.queued.mockReset().mockResolvedValue({id:'job'});
  state.db={from(table:string){let acceptanceOnly=false;const chain:any={
    select:()=>chain,eq:()=>chain,in:()=>chain,order:()=>chain,limit:()=>chain,
    contains:(_column:string,value:unknown)=>{acceptanceOnly=true;state.filter(value);return chain;},
    update:state.courseUpdates,
    maybeSingle:async()=>({data:table==='courses'?{id:'course',title:'Barber',slug:'barber',status:'draft'}:acceptanceOnly?state.acceptance:state.legacy,error:null}),
    insert:(value:unknown)=>{state.inserted(value);return chain;},
    single:async()=>({data:{id:'new-build',course_id:'course'},error:null}),
  };return chain;}};
});
const request=(body:any)=>new NextRequest('https://admin.elevateforhumanity.org/api/admin/ultimate-course-builder',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'queue-course',courseId:'course',instructionalAuthoring:{provider:'google',model:'gemini-validation-model',location:'us'},...body})});
it('ordinary queueing refuses to replace an active build with different authoring inputs',async()=>{
  expect((await POST(request({}))).status).toBe(409);
  expect(state.inserted).not.toHaveBeenCalled();expect(state.queued).not.toHaveBeenCalled();
});
it('explicit acceptance creates a same-course build and preserves prior production records',async()=>{
  const before=JSON.stringify(state.legacy);
  expect((await POST(request({acceptanceBuild:true}))).status).toBe(202);
  expect(state.inserted).toHaveBeenCalledWith(expect.objectContaining({course_id:'course',profile:expect.objectContaining({instructionalAuthoring:expect.objectContaining({provider:'google',location:'us'})})}));
  expect(state.queued).toHaveBeenCalledWith('new-build',expect.any(Object));
  expect(JSON.stringify(state.legacy)).toBe(before);expect(state.courseUpdates).not.toHaveBeenCalled();
});
it('repeated acceptance requests reuse the matching active acceptance build',async()=>{
  state.acceptance={id:'existing-acceptance',profile:{instructionalAuthoring:{provider:'google',model:'gemini-validation-model',location:'us',version:'source-grounded-teaching-1'}}};
  expect((await POST(request({acceptanceBuild:true}))).status).toBe(202);
  expect(state.inserted).not.toHaveBeenCalled();expect(state.queued).toHaveBeenCalledWith('existing-acceptance',expect.any(Object));
  expect(state.filter).toHaveBeenCalledWith({instructionalAuthoring:state.acceptance.profile.instructionalAuthoring});
});
it('acceptance without explicit authoring configuration cannot create a build',async()=>{
  expect((await POST(request({acceptanceBuild:true,instructionalAuthoring:undefined}))).status).toBe(400);
  expect(state.inserted).not.toHaveBeenCalled();expect(state.queued).not.toHaveBeenCalled();
});
