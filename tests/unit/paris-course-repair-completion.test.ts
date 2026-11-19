import {beforeEach,expect,it,vi} from 'vitest';
const h=vi.hoisted(()=>({courseStatus:'running',workerStatus:'running',verifiedRuntime:false,workflowToken:true,healthSha:'a'.repeat(40),mainSha:'a'.repeat(40),successorObservedAt:null as string|null,updates:[] as any[]}));
vi.mock('server-only',()=>({}));
vi.mock('@/lib/devstudio/workflow-github-context',()=>({currentWorkflowGitHubToken:()=>h.workflowToken?'verified-workflow-fixture':undefined}));
vi.mock('@/lib/devstudio/github-token',()=>({getGitHubHeaders:async()=>({Authorization:'Bearer test-only'})}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:async()=>({from:(table:string)=>{
 let values:any,selection='',filters:any[]=[];
 const result=()=>{
  if(values){h.updates.push(values);return {data:null,error:null};}
  if(table==='paris_autopilot_policy')return {data:{enabled:true,actor_id:'owner'},error:null};
  if(table==='profiles')return {data:{role:'admin'},error:null};
  if(table==='paris_code_repairs')return {data:filters.some(([key,v])=>key==='status'&&Array.isArray(v)&&v.includes('verifying'))?[{id:'repair',status:'verifying',release_sha:'a'.repeat(40),source_job_id:'source',verification:{resumedJobId:'resumed',exactRuntimeSha:h.verifiedRuntime,...(h.successorObservedAt?{releaseReconciliation:{currentMainSha:h.mainSha,observationStartedAt:h.successorObservedAt}}:{})}}]:[],error:null};
  if(table==='ultimate_course_builds')return {data:{id:'build',status:h.courseStatus,profile:{}},error:null};
  if(table==='ultimate_build_jobs')return {data:filters.some(([key])=>key==='id')?(filters.some(([key,v])=>key==='id'&&v==='source')?{id:'source',build_id:'build',status:'failed',monitor:{enabled:true},payload:{}}:{id:'resumed',build_id:'build',status:h.workerStatus,payload:{codeRepairId:'repair',codeRepairSha:'a'.repeat(40)}}):[],error:null};
  return {data:[],error:null};
 };
 const q:any={select:(value:string)=>{selection=value;return q;},eq:(...v:any[])=>{filters.push(v);return q;},in:(...v:any[])=>{filters.push(v);return q;},gte:()=>q,lte:()=>q,range:()=>q,order:()=>q,limit:()=>q,update:(v:any)=>{values=v;return q;},single:async()=>result(),maybeSingle:async()=>result(),then:(resolve:any)=>Promise.resolve(resolve(result()))};return q;
}})}));
import {tickParisCodeRepairs} from '@/lib/ai/runtime/code-repair';
beforeEach(()=>{
 h.workflowToken=true;h.courseStatus='running';h.workerStatus='running';h.verifiedRuntime=false;h.healthSha='a'.repeat(40);h.mainSha='a'.repeat(40);h.successorObservedAt=null;h.updates=[];
 vi.stubGlobal('fetch',vi.fn(async(url:string)=>new Response(JSON.stringify(url.includes('/git/ref/heads/main')?{object:{sha:h.mainSha}}:url.includes('/compare/')?{status:'ahead'}:url.includes('/actions/runs/42/jobs?per_page=100')?{jobs:[{name:'CI Required Gate',status:'completed',conclusion:'success'}]}:url.includes('/actions/runs?')?{workflow_runs:[{id:42,name:'CI',path:'.github/workflows/ci.yml',head_branch:'main',head_repository:{full_name:'elevate-for-humanity/Elevate-lms'},head_sha:'a'.repeat(40),event:'workflow_dispatch',status:'completed',conclusion:'success'},...['Deploy Admin','Deploy LMS automatically on Google','Deploy Google Marketing on trigger','Deploy Google Course Builder on source changes'].map(name=>({name,head_sha:'a'.repeat(40),event:'workflow_dispatch',status:'completed',conclusion:'success'}))]}:{commit:h.healthSha}))));
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

it('a later unrelated deployment does not falsely certify the older repair release',async()=>{
 h.verifiedRuntime=true;h.healthSha='b'.repeat(40);h.courseStatus='published';h.workerStatus='completed';
 await tickParisCodeRepairs({workflowOwnedDispatch:true});expect(h.updates).toContainEqual(expect.objectContaining({status:'verifying',verification:expect.objectContaining({exactRuntimeSha:false})}));
});

it('superseded exact-main CI reconciles newer main without deploying or certifying the old SHA',async()=>{
 h.mainSha='b'.repeat(40);
 await tickParisCodeRepairs({workflowOwnedDispatch:true});
 expect(h.updates).toContainEqual(expect.objectContaining({
  status:'verifying',
  verification:expect.objectContaining({
   releaseReconciliation:expect.objectContaining({
    state:'newer-main-needs-independent-validation',
    immutableReleaseSha:'a'.repeat(40),
    currentMainSha:'b'.repeat(40),
    independentlyValidated:false
   })
  })
 }));
 expect(h.updates.some(v=>v.status==='verified'||v.status==='deploying')).toBe(false);
});
it('runtime polls wait for the signed workflow without attempting mutations or dispatch',async()=>{h.workflowToken=false;const result=await tickParisCodeRepairs();expect(result).toMatchObject({awaitingWorkflow:true,dispatched:0});expect(h.updates).toEqual([]);expect(fetch).not.toHaveBeenCalled();});
it('a boolean flag alone cannot grant a workflow credential',async()=>{h.workflowToken=false;expect(await tickParisCodeRepairs({workflowOwnedDispatch:true})).toMatchObject({awaitingWorkflow:true});expect(h.updates).toEqual([]);});

function mockSuccessorRuns(runs:any[]){
 const prior=globalThis.fetch;
 const successor='b'.repeat(40);
 vi.stubGlobal('fetch',vi.fn(async(url:string)=>url.includes('/actions/runs?head_sha='+successor)
  ?new Response(JSON.stringify({workflow_runs:runs}))
  :prior(url)));
}
it('a failed newer-main CI blocks the older repair and releases global dispatch ownership',async()=>{
 h.mainSha='b'.repeat(40);
 mockSuccessorRuns([
  {id:90,name:'CI',head_sha:h.mainSha,status:'completed',conclusion:'failure',event:'workflow_dispatch'},
  {id:91,name:'Integrity Gate',head_sha:h.mainSha,status:'completed',conclusion:'success'}
 ]);
 await tickParisCodeRepairs({workflowOwnedDispatch:true});
 expect(h.updates).toContainEqual(expect.objectContaining({
  status:'blocked',error_code:'REPAIR_NEWER_MAIN_VALIDATION_FAILED',
  verification:expect.objectContaining({releaseReconciliation:expect.objectContaining({
   state:'newer-main-validation-failed',immutableReleaseSha:'a'.repeat(40),currentMainSha:h.mainSha
  })})
 }));
 expect(h.updates.some(v=>v.status==='verified')).toBe(false);
});
it('a failed successor deployment cannot keep an older repair verifying',async()=>{
 h.mainSha='b'.repeat(40);
 mockSuccessorRuns([
  {id:90,name:'CI',head_sha:h.mainSha,status:'completed',conclusion:'success'},
  {id:91,name:'Integrity Gate',head_sha:h.mainSha,status:'completed',conclusion:'success'},
  {id:92,name:'Deploy Admin',head_sha:h.mainSha,status:'completed',conclusion:'failure',event:'workflow_dispatch'}
 ]);
 await tickParisCodeRepairs({workflowOwnedDispatch:true});
 expect(h.updates).toContainEqual(expect.objectContaining({
  status:'blocked',error_code:'REPAIR_NEWER_MAIN_VALIDATION_FAILED',
  verification:expect.objectContaining({releaseReconciliation:expect.objectContaining({
   state:'newer-main-validation-failed',deploymentState:'failed'
  })})
 }));
});
it('unobserved successor validation has a fixed observation window, not a refreshed timeout',async()=>{
 h.mainSha='b'.repeat(40);
 h.successorObservedAt=new Date(Date.now()-70*60000).toISOString();
 mockSuccessorRuns([]);
 await tickParisCodeRepairs({workflowOwnedDispatch:true});
 expect(h.updates).toContainEqual(expect.objectContaining({
  status:'blocked',error_code:'REPAIR_NEWER_MAIN_VALIDATION_NOT_OBSERVED',
  verification:expect.objectContaining({releaseReconciliation:expect.objectContaining({
   state:'newer-main-validation-not-observed',observationStartedAt:h.successorObservedAt
  })})
 }));
});
