import {beforeEach,expect,it,vi} from 'vitest';
import {repairDashboardReceipt} from '@/lib/devstudio/repair-dashboard';

const h=vi.hoisted(()=>({auth:{id:'owner',error:null as any},reads:[] as any[],taskError:null as any}));
const repairId='11111111-1111-4111-8111-111111111111';
const taskId='22222222-2222-4222-8222-222222222222';
const originalJob='33333333-3333-4333-8333-333333333333';
const repair=()=>({id:repairId,status:'blocked',source_job_id:originalJob,error_code:'PARIS_OPENHANDS_APPROVAL_REQUIRED',
 candidate:{kind:'openhands-checkpoint',checkpoint:{taskId,branch:'studio/original'}},verification:null,release_sha:null,workflow_run_id:12});
const task=()=>({id:taskId,user_id:'owner',tenant_id:null,tool_name:'openhands.execute',requires_approval:true,approval_status:'pending',
 tool_output:{conversation_id:'original-conversation',raw:{api_key:'SECRET'}},approval_reason:'PRIVATE PROMPT'});
vi.mock('@/lib/devstudio/api-auth',()=>({apiRequireDevStudio:async()=>h.auth}));
vi.mock('@/lib/api/withRateLimit',()=>({applyRateLimit:async()=>null}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:async()=>({from:(table:string)=>{
 const read={table,filters:[] as any[]};h.reads.push(read);
 const q:any={select:()=>q,eq:(...args:any[])=>{read.filters.push(['eq',...args]);return q;},
 is:(...args:any[])=>{read.filters.push(['is',...args]);return q;},in:(...args:any[])=>{read.filters.push(['in',...args]);return q;},
 order:()=>q,limit:()=>q,then:(resolve:any)=>resolve({data:table==='ai_tasks'?[task()]:[repair()],error:table==='ai_tasks'?h.taskError:null})};return q;
}})}));
import {GET} from '@/apps/admin/app/api/admin/dev-studio/engineering/route';
import {NextRequest,NextResponse} from 'next/server';
beforeEach(()=>{h.auth={id:'owner',error:null};h.reads=[];h.taskError=null;});

it('returns original identifiers and pending approval without provider payloads',()=>{
 const result=repairDashboardReceipt(repair(),task(),'owner');
 expect(result).toMatchObject({repairId,sourceJobId:originalJob,taskId,conversationId:'original-conversation',approvalStatus:'pending',approvalRequired:true,verifiedLive:false});
 expect(JSON.stringify(result)).not.toMatch(/SECRET|PRIVATE PROMPT|api_key/);
});
it.each([
 {user_id:'other'},{tenant_id:'other-tenant'},{tool_name:'other.tool'},{id:repairId},
])('rejects unowned or mismatched task evidence %j',change=>{
 expect(repairDashboardReceipt(repair(),{...task(),...change},'owner')).toMatchObject({conversationId:null,approvalStatus:'unverified',approvalRequired:null});
});
it('a status and SHA alone cannot advertise verified production',()=>{
 expect(repairDashboardReceipt({...repair(),status:'verified',release_sha:'a'.repeat(40)},task(),'owner').verifiedLive).toBe(false);
});
it('requires original course acceptance as well as test/deployment/runtime evidence',()=>{
 const row={...repair(),status:'verified',release_sha:'a'.repeat(40),verification:{tests:'passed',deployments:'passed',exactRuntimeSha:true,runtimeVerifiedAt:'2026-11-14T01:00:00Z'}};
 expect(repairDashboardReceipt(row,task(),'owner').verifiedLive).toBe(false);
 expect(repairDashboardReceipt({...row,verification:{...row.verification,courseExecution:{state:'passed'}}},task(),'owner').verifiedLive).toBe(true);
});
it('does not turn arbitrary diagnostics or malformed links into browser evidence',()=>{
 const row={...repair(),error_code:'error token=SECRET',workflow_run_id:-1,candidate:{changed_files:['lib/safe.ts','lib/../../secret','https://evil.test/key','lib/private?token=SECRET']},verification:{pullRequest:{number:-1,url:'https://evil.test'}}};
 expect(repairDashboardReceipt(row,null,'owner')).toMatchObject({blockerCode:null,workflowUrl:null,pullRequest:null,changedFiles:['lib/safe.ts']});
});
it('shows permitted root Dockerfiles alongside regression tests without widening root path access',()=>{
 const changed_files=['Dockerfile.admin','Dockerfile.lms','Dockerfile.marketing','tests/admin-container.test.ts',
  'Dockerfile','Dockerfile.admin.bak','Dockerfile.other','Dockerfile.admin/../secret',
  '../Dockerfile.admin','/Dockerfile.admin','Dockerfile.admin?token=SECRET','package.json','.env'];
 expect(repairDashboardReceipt({...repair(),candidate:{changed_files}},null,'owner').changedFiles).toEqual([
  'Dockerfile.admin','Dockerfile.lms','Dockerfile.marketing','tests/admin-container.test.ts',
 ]);
});
it('actual route scopes both repair and canonical task reads to the authenticated owner',async()=>{
 const response=await GET(new NextRequest('https://admin.test/api/admin/dev-studio/engineering'));
 expect(response.status).toBe(200);
 expect(response.headers.get('cache-control')).toBe('no-store');
 expect(h.reads[0].filters).toContainEqual(['eq','actor_id','owner']);
 expect(h.reads[1].filters).toEqual(expect.arrayContaining([['eq','user_id','owner'],['eq','tool_name','openhands.execute'],['is','tenant_id',null],['in','id',[taskId]]]));
 expect((await response.json()).repairs[0].approvalStatus).toBe('pending');
});
it('failed evidence reads return unavailable instead of inventing approval',async()=>{
 h.taskError={message:'private database error'};
 const response=await GET(new NextRequest('https://admin.test/api/admin/dev-studio/engineering'));
 expect(response.status).toBe(503);expect(JSON.stringify(await response.json())).not.toContain('private database error');
});
it('unauthorized requests cannot read repair or conversation records',async()=>{
 h.auth.error=NextResponse.json({error:'Unauthorized'},{status:401});
 expect((await GET(new NextRequest('https://admin.test/api/admin/dev-studio/engineering'))).status).toBe(401);
 expect(h.reads).toHaveLength(0);
});
