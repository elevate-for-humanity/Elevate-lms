import {beforeEach,expect,it,vi} from 'vitest';
const h=vi.hoisted(()=>({verified:false,claimWon:true,candidate:null as any,updates:[] as any[],probe:vi.fn(),openhands:vi.fn()}));
vi.mock('server-only',()=>({}));
vi.mock('@/lib/devstudio/workflow-github-context',()=>({currentWorkflowGitHubToken:()=> 'signed-workflow-fixture'}));
vi.mock('@/lib/devstudio/github-token',()=>({getGitHubHeaders:async()=>({Authorization:'Bearer fixture'})}));
vi.mock('@/lib/ai/providers/owned-model-health.mjs',()=>({probeOwnedModel:h.probe}));
vi.mock('@/lib/devstudio/paris-openhands-readiness',()=>({probeOpenHandsReadiness:h.openhands}));
vi.mock('@/lib/ai/runtime/repair-events',()=>({readRecentRepairEvents:async()=>[]}));
vi.mock('@/lib/ai/runtime/repair-reconciliation',()=>({reconcileRecoveredRepairs:async()=>({retired:0})}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:async()=>({from:(table:string)=>{
 let values:any;const filters:any[]=[];
 const result=()=>{
  if(values&&table==='paris_autopilot_policy')return {data:null,error:null};
  if(values){h.updates.push({table,values,filters});return {data:h.claimWon?{id:'pending'}:null,error:null};}
  if(table==='paris_autopilot_policy')return {data:{enabled:true,actor_id:'owner'},error:null};
  if(table==='profiles')return {data:{role:'admin'},error:null};
  if(table==='paris_code_repairs'&&filters.some(([k,v])=>k==='status'&&v==='queued'))
   return {data:[{id:'pending',attempt_count:0,source_job_id:null,attempt_history:[],candidate:h.candidate}],error:null};
  return {data:[],error:null,count:0};
 };
 const q:any={select:()=>q,eq:(...v:any[])=>{filters.push(v);return q;},in:()=>q,gte:()=>q,lte:()=>q,
  order:()=>q,limit:()=>q,range:()=>q,update:(v:any)=>{values=v;return q;},
  single:async()=>result(),maybeSingle:async()=>result(),then:(resolve:any)=>Promise.resolve(resolve(result()))};return q;
}})}));
import {tickParisCodeRepairs} from '@/lib/ai/runtime/code-repair';
beforeEach(()=>{
 h.verified=false;h.claimWon=true;h.candidate={kind:'planner-checkpoint'};h.updates=[];h.probe.mockReset();h.openhands.mockReset();
 h.probe.mockImplementation(async()=>({configured:true,verified:h.verified,status:h.verified?'reachable':'request_failed'}));
 h.openhands.mockResolvedValue({verified:true,status:'read_authorization_verified'});
 vi.stubEnv('AI_PROVIDER','elevate');
 vi.stubGlobal('fetch',vi.fn(async(input:any)=>String(input).includes('/git/ref/heads/main')
  ?Response.json({object:{sha:'a'.repeat(40)}}):Response.json({workflow_runs:[]})));
});
it('keeps an unavailable-model repair queued without spending an attempt or dispatching',async()=>{
 expect(await tickParisCodeRepairs({workflowOwnedDispatch:true})).toMatchObject({dispatched:0,awaitingProvider:true,reason:'OWNED_MODEL_READINESS_UNVERIFIED'});
 expect(h.probe).toHaveBeenCalledOnce();expect(h.updates).toEqual([]);
 expect(vi.mocked(fetch).mock.calls.some(([,options])=>(options as any)?.method==='POST')).toBe(false);
});
it('a recovered provider admits exactly one fenced claim with the original attempt count',async()=>{
 h.verified=true;
 expect(await tickParisCodeRepairs({workflowOwnedDispatch:true})).toMatchObject({dispatchRequired:true,repairId:'pending'});
 expect(h.updates).toHaveLength(1);expect(h.updates[0].values).toMatchObject({status:'dispatched',attempt_count:1});
 expect(h.updates[0].filters).toEqual(expect.arrayContaining([['id','pending'],['status','queued'],['attempt_count',0]]));
});
it('a readiness exception or a lost queue claim never acknowledges dispatch',async()=>{
 h.probe.mockRejectedValueOnce(new Error('fixture transport failure'));
 expect(await tickParisCodeRepairs({workflowOwnedDispatch:true})).toMatchObject({awaitingProvider:true,dispatched:0});
 expect(h.updates).toEqual([]);
 h.verified=true;h.claimWon=false;
 expect(await tickParisCodeRepairs({workflowOwnedDispatch:true})).toEqual({enabled:true,dispatched:0});
});
it('new OpenHands work admits one fenced claim while the local model is unavailable',async()=>{
 h.candidate=null;
 expect(await tickParisCodeRepairs({workflowOwnedDispatch:true})).toMatchObject({dispatchRequired:true,repairId:'pending'});
 expect(h.probe).not.toHaveBeenCalled();expect(h.openhands).toHaveBeenCalledOnce();
 expect(h.updates).toHaveLength(1);
 expect(h.updates[0]).toMatchObject({values:{status:'dispatched',attempt_count:1}});
 expect(h.updates[0].filters).toEqual(expect.arrayContaining([['id','pending'],['status','queued'],['attempt_count',0]]));
 expect(vi.mocked(fetch).mock.calls.some(([,options])=>(options as any)?.method==='POST')).toBe(false);
});
it('missing or mismatched OpenHands configuration cannot consume an attempt',async()=>{
 h.candidate=null;
 for(const config of [{apiKeyResolved:false,repositoryMatches:true},
  {apiKeyResolved:true,repositoryMatches:false}]){
  h.openhands.mockResolvedValue({...config,verified:false,status:'not_configured'});
  expect(await tickParisCodeRepairs({workflowOwnedDispatch:true})).toMatchObject({dispatched:0,awaitingProvider:true,reason:'OPENHANDS_CONFIGURATION_REQUIRED'});
 }
 expect(h.updates).toEqual([]);expect(h.probe).not.toHaveBeenCalled();
});
it.each(['authorization_failed','provider_request_failed','configuration_unavailable','origin_not_verified','invalid_provider_response'])('OpenHands %s preserves the queued repair and its attempt',async status=>{
 h.candidate=null;h.openhands.mockResolvedValueOnce({verified:false,status});
 expect(await tickParisCodeRepairs({workflowOwnedDispatch:true})).toMatchObject({dispatched:0,awaitingProvider:true,reason:'OPENHANDS_READINESS_UNVERIFIED',providerStatus:status});
 expect(h.updates).toEqual([]);expect(h.probe).not.toHaveBeenCalled();
});
it('a lost OpenHands admission claim is never reported as a dispatch',async()=>{
 h.candidate=null;h.claimWon=false;
 expect(await tickParisCodeRepairs({workflowOwnedDispatch:true})).toEqual({enabled:true,dispatched:0});
 expect(h.probe).not.toHaveBeenCalled();
});
