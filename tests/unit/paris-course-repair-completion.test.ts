import {beforeEach,expect,it,vi} from 'vitest';
const h=vi.hoisted(()=>({courseStatus:'running',workerStatus:'running',verifiedRuntime:false,workflowToken:true,healthSha:'sha',updates:[] as any[]}));
vi.mock('server-only',()=>({}));
vi.mock('@/lib/devstudio/workflow-github-context',()=>({currentWorkflowGitHubToken:()=>h.workflowToken?'verified-workflow-fixture':undefined}));
vi.mock('@/lib/devstudio/github-token',()=>({getGitHubHeaders:async()=>({Authorization:'Bearer test-only'})}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:async()=>({from:(table:string)=>{
 let values:any,selection='',filters:any[]=[];
 const result=()=>{
  if(values){h.updates.push(values);return {data:null,error:null};}
  if(table==='paris_autopilot_policy')return {data:{enabled:true,actor_id:'owner'},error:null};
  if(table==='profiles')return {data:{role:'admin'},error:null};
  if(table==='paris_code_repairs')return {data:filters.some(([key,v])=>key==='status'&&Array.isArray(v)&&v.includes('verifying'))?[{id:'repair',status:'verifying',release_sha:'sha',source_job_id:'source',verification:{resumedJobId:'resumed',exactRuntimeSha:h.verifiedRuntime}}]:[],error:null};
  if(table==='ultimate_course_builds')return {data:{id:'build',status:h.courseStatus,profile:{}},error:null};
  if(table==='ultimate_build_jobs')return {data:filters.some(([key,v])=>key==='id'&&v==='source')?{id:'source',build_id:'build',status:'failed',monitor:{enabled:true},payload:{}}:{id:'resumed',build_id:'build',status:h.workerStatus,payload:{codeRepairId:'repair',codeRepairSha:'sha'}},error:null};
  return {data:[],error:null};
 };
 const q:any={select:(value:string)=>{selection=value;return q;},eq:(...v:any[])=>{filters.push(v);return q;},in:(...v:any[])=>{filters.push(v);return q;},gte:()=>q,order:()=>q,limit:()=>q,update:(v:any)=>{values=v;return q;},single:async()=>result(),maybeSingle:async()=>result(),then:(resolve:any)=>Promise.resolve(resolve(result()))};return q;
}})}));
import {tickParisCodeRepairs} from '@/lib/ai/runtime/code-repair';
beforeEach(()=>{
 h.workflowToken=true;h.courseStatus='running';h.workerStatus='running';h.verifiedRuntime=false;h.healthSha='sha';h.updates=[];
 vi.stubGlobal('fetch',vi.fn(async(url:string)=>new Response(JSON.stringify(url.includes('/actions/runs?')?{workflow_runs:['Deploy Admin','Deploy LMS automatically on Google','Deploy Google Marketing on trigger','Deploy Google Course Builder on source changes'].map(name=>({name,head_sha:'sha',event:'workflow_dispatch',status:'completed',conclusion:'success'}))}:{commit:h.healthSha}))));
});
it('deployed healthy applications leave an unfinished course repair verifying',async()=>{
 await tickParisCodeRepairs({workflowOwnedDispatch:true});expect(h.updates).toContainEqual(expect.objectContaining({status:'verifying',verification:expect.objectContaining({courseExecution:expect.objectContaining({state:'pending'})})}));
 expect(h.updates.some(v=>v.status==='verified')).toBe(false);
});
it('completed correlated worker plus canonical course publication verifies the repair',async()=>{
 h.courseStatus='published';h.workerStatus='completed';await tickParisCodeRepairs({workflowOwnedDispatch:true});
 expect(h.updates).toContainEqual(expect.objectContaining({status:'verified',verification:expect.objectContaining({courseExecution:expect.objectContaining({state:'passed'})})}));
});
it('a failed replacement worker reports failure instead of successful repair',async()=>{
 h.workerStatus='failed';await tickParisCodeRepairs({workflowOwnedDispatch:true});
 expect(h.updates).toContainEqual(expect.objectContaining({status:'blocked',error_code:'COURSE_REPAIR_EXECUTION_FAILED'}));
});

it('a later unrelated deployment does not erase the verified immutable release receipt',async()=>{
 h.verifiedRuntime=true;h.healthSha='newer-release';h.courseStatus='published';h.workerStatus='completed';
 await tickParisCodeRepairs({workflowOwnedDispatch:true});expect(h.updates).toContainEqual(expect.objectContaining({status:'verified',verification:expect.objectContaining({exactRuntimeSha:true})}));
});

it('runtime polls wait for the signed workflow without attempting mutations or dispatch',async()=>{h.workflowToken=false;const result=await tickParisCodeRepairs();expect(result).toMatchObject({awaitingWorkflow:true,dispatched:0});expect(h.updates).toEqual([]);expect(fetch).not.toHaveBeenCalled();});
it('a boolean flag alone cannot grant a workflow credential',async()=>{h.workflowToken=false;expect(await tickParisCodeRepairs({workflowOwnedDispatch:true})).toMatchObject({awaitingWorkflow:true});expect(h.updates).toEqual([]);});
