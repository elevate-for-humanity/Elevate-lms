// @vitest-environment node
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
const h=vi.hoisted(()=>({actions:[] as any[],ancestry:'ahead',branch:'main',failed:true,logReads:0}));
vi.mock('server-only',()=>({}));
vi.mock('@/lib/logger',()=>({logger:{error:vi.fn(),warn:vi.fn(),info:vi.fn()}}));
vi.mock('@/lib/secrets',()=>({hydrateProcessEnv:async()=>{}}));
vi.mock('@/lib/devstudio/github-token',()=>({getGitHubHeaders:async()=>({Authorization:'Bearer fixture'}),githubApiErrorMessage:()=> 'fixture error'}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:async()=>({})}));
vi.mock('@/lib/ai/paid-inference-gateway',()=>({paidArtifactFingerprint:()=> 'fixture',reservePaidInference:vi.fn(),executePaidInference:async({dispatch}:any)=>({decision:'approved',value:await dispatch()})}));
vi.mock('@/lib/ai/ai-service',()=>({aiChat:async()=>({provider:'openai',content:JSON.stringify(h.actions.shift())})}));
import {stageParisCodeRepair} from '@/lib/devstudio/paris-code-engineer';
beforeEach(()=>{
 h.ancestry='ahead';h.branch='main';h.failed=true;h.logReads=0;
 h.actions=[{type:'workflow_log',runId:123,jobId:456},{type:'complete',summary:'Inspect current source next.'}];
 vi.stubEnv('AI_PROVIDER','openai');
 vi.stubGlobal('fetch',vi.fn(async(input:string,init:RequestInit={})=>{
  const p=new URL(input).pathname;
  if(p.includes('/git/ref/heads/'))return Response.json({object:{sha:'a'.repeat(40)}});
  if(p.endsWith('/git/refs')&&init.method==='POST')return Response.json({ref:'refs/heads/studio/fixture'},{status:201});
  if(p.endsWith('/actions/runs/123'))return Response.json({head_branch:h.branch,head_sha:'b'.repeat(40),status:'completed',conclusion:h.failed?'failure':'success'});
  if(p.includes('/compare/'))return Response.json({status:h.ancestry});
  if(p.endsWith('/actions/runs/123/jobs'))return Response.json({total_count:1,jobs:[{id:456,run_id:123,name:'Build',conclusion:'failure'}]});
  if(p.endsWith('/actions/jobs/456/logs')){h.logReads++;return new Response('##[error]missing module: fixture-module');}
  throw Error('Unexpected test request '+p);
 }));
});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
it('reads a failed ancestor log as historical evidence without creating a patch or authorizing publication',async()=>{
 const response=await stageParisCodeRepair('Inspect run 123','repair','owner');
 const body=await response.json();
 expect(h.logReads).toBe(1);expect(response.status).toBe(422);
 expect(JSON.stringify(body.observations)).toContain('HISTORICAL_WORKFLOW_LOG');
 expect(JSON.stringify(body.observations)).toContain('verify current source');
 expect(body.changed_files).toEqual([]);
});
it.each([{ancestry:'diverged'},{branch:'unrelated'},{failed:false}])('rejects unrelated or successful historical evidence: %j',async(change)=>{
 Object.assign(h,change);await stageParisCodeRepair('Inspect run 123','repair','owner');expect(h.logReads).toBe(0);
});
