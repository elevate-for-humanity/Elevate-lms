import {beforeEach,expect,it,vi} from 'vitest';
const h=vi.hoisted(()=>({repair:null as any,updates:[] as any[],heartbeats:[] as any[],observations:0,mode:'pending',lose:false,enabled:true,role:'super_admin',source:null as any,latest:null as any,build:null as any}));
vi.mock('@/lib/ai/runtime/repair-events',()=>({readRecentRepairEvents:async()=>[]}));
vi.mock('@/lib/ai/runtime/repair-reconciliation',()=>({reconcileRecoveredRepairs:async()=>{}}));
vi.mock('@/lib/devstudio/workflow-github-context',()=>({currentWorkflowGitHubToken:()=> 'temporary-test-only'}));
vi.mock('@/lib/devstudio/github-token',()=>({getGitHubHeaders:async()=>({Authorization:'Bearer test-only'})}));
vi.mock('@/lib/devstudio/paris-openhands-adapter',()=>({observeParisOpenHandsRepair:async()=>{
 h.observations++;return h.mode==='ready'?{state:'ready',candidate:{provider:'openhands',branch:{name:'studio/assigned',sha:'b'.repeat(40)},base_sha:'a'.repeat(40)}}:{state:'pending',taskId:'same-task'};
}}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:async()=>({from:(table:string)=>{
 let values:any;const eqs:any[]=[];let statuses:any;
 const result=()=>{
  if(values&&table==='paris_autopilot_policy'){h.heartbeats.push(values);return {data:null,error:null};}
  if(values){h.updates.push({values,eqs});return {data:h.lose?null:{id:h.repair.id},error:null};}
  if(table==='paris_autopilot_policy')return {data:{enabled:h.enabled,actor_id:'owner'},error:null};
  if(table==='profiles')return {data:{role:h.role},error:null};
  if(table==='ultimate_build_jobs')return {data:eqs.some(([key])=>key==='id')?h.source:h.latest,error:null};
  if(table==='ultimate_course_builds')return {data:h.build,error:null};
  if(table==='paris_code_repairs')return {data:statuses?[]:[h.repair],error:null};
  throw Error('Unexpected table '+table);
 };
 const q:any={select:()=>q,eq:(key:string,value:any)=>{eqs.push([key,value]);return q;},
  in:(_:string,value:any)=>{statuses=value;return q;},order:()=>q,limit:()=>q,update:(v:any)=>{values=v;return q;},
  maybeSingle:async()=>result(),single:async()=>result(),then:(resolve:any,reject:any)=>Promise.resolve(result()).then(resolve,reject)};
 return q;
}})}));
import {tickParisCodeRepairs} from '@/lib/ai/runtime/code-repair';
beforeEach(()=>{
 h.updates=[];h.heartbeats=[];h.observations=0;h.mode='pending';h.lose=false;h.enabled=true;h.role='super_admin';
 h.repair={id:'11111111-1111-4111-8111-111111111111',actor_id:'owner',status:'blocked',
  error_code:'PARIS_OPENHANDS_WAIT_DEADLINE',attempt_count:1,attempt_history:[],workflow_run_id:12,
  updated_at:'2026-11-10T11:00:00Z',candidate:{kind:'openhands-checkpoint',checkpoint:{taskId:'same-task',runId:12,
   startedAt:Date.now()-60*60_000,dispatchRequested:true}},verification:null};
 vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify({id:12,path:'.github/workflows/paris-code-repair.yml',
  event:'workflow_dispatch',head_branch:'main',status:'completed',conclusion:'failure'}),{status:200})));
});
it('actual signed monitor records pending provider evidence without dispatching another execution',async()=>{
 expect(await tickParisCodeRepairs({workflowOwnedDispatch:true})).toMatchObject({dispatched:0,awaitingProvider:true});
 expect(h.observations).toBe(1);expect(h.updates).toHaveLength(1);
 expect(h.heartbeats).toEqual([{last_tick_at:expect.any(String)}]);
 expect(h.updates[0].values.verification.openhandsObservation.state).toBe('pending');
 expect(h.updates[0].values.attempt_count).toBeUndefined();
 expect(vi.mocked(fetch).mock.calls.every(([,init])=>!init?.method||init.method==='GET')).toBe(true);
});
it.each(['failure','timed_out'])('signed monitor observes the same task after a verified %s prepare',async conclusion=>{
 h.repair.error_code=`REPAIR_WORKFLOW_${conclusion}`;
 vi.stubGlobal('fetch',vi.fn(async input=>new Response(JSON.stringify(String(input).includes('/jobs?')?{
  total_count:3,jobs:[{name:'prepare',status:'completed',conclusion},
   {name:'validate',status:'completed',conclusion:'skipped'},
   {name:'publish',status:'completed',conclusion:'skipped'}],
 }:{id:12,path:'.github/workflows/paris-code-repair.yml',event:'workflow_dispatch',
  head_branch:'main',status:'completed',conclusion}),{status:200})));
 expect(await tickParisCodeRepairs({workflowOwnedDispatch:true})).toMatchObject({dispatched:0,awaitingProvider:true});
 expect(h.observations).toBe(1);
 expect(h.updates[0].values.verification.openhandsObservation.taskId).toBe('same-task');
 expect(h.updates[0].values.attempt_count).toBeUndefined();
 expect(vi.mocked(fetch).mock.calls.every(([,init])=>!init?.method||init.method==='GET')).toBe(true);
});
it('signed monitor preserves failed validation after a generic workflow failure',async()=>{
 h.repair.error_code='REPAIR_WORKFLOW_failure';
 vi.stubGlobal('fetch',vi.fn(async input=>new Response(JSON.stringify(String(input).includes('/jobs?')?{
  total_count:3,jobs:[{name:'prepare',status:'completed',conclusion:'success'},
   {name:'validate',status:'completed',conclusion:'failure'},
   {name:'publish',status:'completed',conclusion:'skipped'}],
 }:{id:12,path:'.github/workflows/paris-code-repair.yml',event:'workflow_dispatch',
  head_branch:'main',status:'completed',conclusion:'failure'}),{status:200})));
 expect(await tickParisCodeRepairs({workflowOwnedDispatch:true})).toMatchObject({dispatched:0,reason:'ACCEPTED_OPENHANDS_OBSERVATION_RECORDED'});
 expect(h.observations).toBe(0);
 expect(h.updates[0].values.verification.openhandsObservation.reason).toBe('FAILED_PREPARE_EVIDENCE_REQUIRED');
 expect(h.updates[0].values.status).toBeUndefined();
});
it('refuses to report a provider observation when the guarded database write loses its CAS',async()=>{
 h.lose=true;
 await expect(tickParisCodeRepairs({workflowOwnedDispatch:true})).rejects.toThrow('PARIS_OPENHANDS_OBSERVATION_LOST_CAS');
 expect(h.observations).toBe(1);
 expect(h.updates).toHaveLength(1);
 expect(h.updates[0].eqs).toEqual(expect.arrayContaining([
  ['id',h.repair.id],['status','blocked'],['actor_id','owner'],['workflow_run_id',12],
  ['attempt_count',1],['updated_at',h.repair.updated_at],
 ]));
});
it('actual monitor claims completed output with owner/run/state/attempt/version fencing before requesting validation',async()=>{
 h.mode='ready';expect(await tickParisCodeRepairs({workflowOwnedDispatch:true})).toMatchObject({dispatchRequired:true,repairId:h.repair.id});
 const write=h.updates[0];expect(write.eqs).toEqual(expect.arrayContaining([
  ['id',h.repair.id],['status','blocked'],['actor_id','owner'],['workflow_run_id',12],['attempt_count',1],['updated_at',h.repair.updated_at],
 ]));expect(write.values.status).toBe('dispatched');expect(write.values.attempt_count).toBeUndefined();
 expect(write.values.attempt_history[0].checkpoint).toEqual(h.repair.candidate.checkpoint);
});
it('an unsigned background poll cannot supervise or advance an accepted execution',async()=>{
 expect(await tickParisCodeRepairs()).toMatchObject({awaitingWorkflow:true});expect(h.observations).toBe(0);expect(h.updates).toHaveLength(0);
});
it('disabled policy or revoked owner authority cannot resume execution',async()=>{
 h.enabled=false;expect(await tickParisCodeRepairs({workflowOwnedDispatch:true})).toMatchObject({enabled:false});
 h.enabled=true;h.role='student';await expect(tickParisCodeRepairs({workflowOwnedDispatch:true})).rejects.toThrow('OWNER_AUTHORITY_REQUIRED');
 expect(h.observations).toBe(0);
});

it('source-linked continuation checks the latest job, monitor and unpaused build before admitting the candidate',async()=>{
 h.mode='ready';h.repair.source_job_id='source';
 h.source={id:'source',build_id:'build',job_type:'quality',status:'failed',last_error:'LEARNER_RUNTHROUGH_CHECK_FAILED',monitor:{enabled:true},lease_owner:null};
 h.latest={id:'source',build_id:'build',status:'failed'};h.build={id:'build',status:'running',profile:{ownerPaused:false}};
 expect(await tickParisCodeRepairs({workflowOwnedDispatch:true})).toMatchObject({dispatchRequired:true});
 expect(h.observations).toBe(1);
});
it('a paused source build is retained without provider refresh or workflow dispatch',async()=>{
 h.repair.source_job_id='source';
 h.source={id:'source',build_id:'build',job_type:'quality',status:'failed',last_error:'LEARNER_RUNTHROUGH_CHECK_FAILED',monitor:{enabled:true}};
 h.latest={id:'source',build_id:'build',status:'failed'};h.build={id:'build',status:'running',profile:{ownerPaused:true}};
 expect(await tickParisCodeRepairs({workflowOwnedDispatch:true})).toMatchObject({dispatched:0,reason:'ACCEPTED_OPENHANDS_OBSERVATION_RECORDED'});
 expect(h.observations).toBe(0);expect(h.updates[0].values.verification.openhandsObservation.state).toBe('source_ineligible');
});

it('a superseding failed source job cannot admit the older repair',async()=>{
 h.repair.source_job_id='source';
 h.source={id:'source',build_id:'build',job_type:'quality',status:'failed',last_error:'quality failed',monitor:{enabled:true}};
 h.latest={id:'newer-source',build_id:'build',status:'failed'};
 h.build={id:'build',status:'running',profile:{ownerPaused:false},findings:[{code:'QUALITY',message:'quality failure'}]};
 expect(await tickParisCodeRepairs({workflowOwnedDispatch:true})).toMatchObject({dispatched:0,reason:'ACCEPTED_OPENHANDS_OBSERVATION_RECORDED'});
 expect(h.observations).toBe(0);
});
