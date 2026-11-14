import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {NextRequest} from 'next/server';

const h=vi.hoisted(()=>({denied:false,rows:[] as any[],tasks:[] as any[],filters:[] as any[],enqueue:vi.fn(),goal:'Fix Studio resizing',status:'queued'}));
vi.mock('@/lib/devstudio/api-auth',()=>({apiRequireDevStudio:async()=>h.denied?{error:new Response(null,{status:401})}:{id:'owner'}}));
vi.mock('@/lib/api/withRateLimit',()=>({applyRateLimit:async()=>null}));
vi.mock('@/lib/ai/runtime/code-repair',()=>({enqueueParisRepair:h.enqueue}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:async()=>({from:()=>{
 const q:any={select:()=>q,eq:(...args:any[])=>{h.filters.push(args);return q;},order:()=>q,
  is:(...args:any[])=>{h.filters.push(args);return q;},
  in:async(...args:any[])=>{h.filters.push(args);return {data:h.tasks,error:null};},
  limit:async()=>({data:h.rows,error:null}),single:async()=>({data:{actor_id:'owner',goal:h.goal,status:h.status},error:null})};return q;
}})}));
import {GET,POST} from '@/apps/admin/app/api/admin/dev-studio/engineering/route';
import OpenHandsRepairPanel from '@/components/studio/OpenHandsRepairPanel';
import {repairDashboardReceipt} from '@/lib/devstudio/repair-dashboard';

const taskId='22222222-2222-4222-8222-222222222222';
const repairRow=()=>({id:'repair-1',status:'validating',source_job_id:null,workflow_run_id:123,release_sha:null,
 candidate:{kind:'openhands-checkpoint',checkpoint:{branch:'studio/repair',taskId,goal:'private diagnostic'}},
 verification:{pullRequest:{number:2540,url:'https://untrusted.example'}},error_code:'private provider body',updated_at:'now'});

beforeEach(()=>{h.denied=false;h.rows=[];h.tasks=[];h.filters=[];h.goal='Fix Studio resizing';h.status='queued';h.enqueue.mockReset();h.enqueue.mockResolvedValue({id:'repair-1'});});
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
const post=(task=h.goal)=>new NextRequest('https://admin.example/api/admin/dev-studio/engineering',{method:'POST',
 headers:{'Idempotency-Key':'11111111-1111-4111-8111-111111111111','Content-Type':'application/json'},body:JSON.stringify({task})});

it('denies anonymous repair submission and status reads before touching the ledger',async()=>{
 h.denied=true;expect((await POST(post())).status).toBe(401);expect((await GET(new NextRequest('https://admin.example/api/admin/dev-studio/engineering'))).status).toBe(401);
 expect(h.filters).toEqual([]);expect(h.enqueue).not.toHaveBeenCalled();
});
it('returns only owner-scoped safe release evidence, without goals, source or raw errors',async()=>{
 h.rows=[repairRow()];
 h.tasks=[{id:taskId,user_id:'owner',tenant_id:null,tool_name:'openhands.execute',approval_status:'pending',requires_approval:true,
  tool_output:{conversation_id:'conversation-1',raw:'private provider body'}}];
 const result=await (await GET(new NextRequest('https://admin.example/api/admin/dev-studio/engineering'))).json();
 expect(h.filters).toEqual(expect.arrayContaining([['actor_id','owner'],['user_id','owner'],['tool_name','openhands.execute'],['tenant_id',null],['id',[taskId]]]));
 expect(result.repairs[0]).toMatchObject({taskId,status:'validating',verifiedLive:false,approvalStatus:'pending',conversationId:'conversation-1',
  pullRequest:{number:2540,url:'https://github.com/elevate-for-humanity/Elevate-lms/pull/2540'}});
 expect(JSON.stringify(result)).not.toMatch(/private|untrusted/);
});
it('repeated Admin requests use the same owner-bound idempotency fingerprint and retain the actual saved status',async()=>{
 expect((await POST(post())).status).toBe(202);h.status='validating';
 const result=await (await POST(post())).json();
 expect(h.enqueue.mock.calls[0][0]).toEqual(h.enqueue.mock.calls[1][0]);
 expect(h.enqueue.mock.calls[0][0].fingerprint).toBe('studio-openhands:owner:11111111-1111-4111-8111-111111111111');
 expect(result).toMatchObject({status:'validating',executed:false,engine:'openhands'});
});
it('does not relabel an earlier internal repair as an OpenHands execution',async()=>{
 h.rows=[{id:'legacy-repair',status:'blocked',candidate:{provider:'elevate',branch:{name:'studio/legacy'}},verification:{},release_sha:null}];
 const result=await(await GET(new NextRequest('https://admin.example/api/admin/dev-studio/engineering'))).json();
 expect(result.repairs[0]).toMatchObject({engine:'internal',verifiedLive:false,taskId:null});
});
it('cannot reuse an accepted request key for another goal',async()=>{
 expect((await POST(post('Different task'))).status).toBe(409);
});
it('Admin panel queues a repair and displays pending validation without claiming production success',async()=>{
 const calls:any[]=[];
 vi.stubGlobal('fetch',vi.fn(async(_url,init)=>{
  calls.push(init);
  return Response.json(init?.method==='POST'?{repairId:'repair-1',status:'queued',executed:false}:
   {repairs:[repairDashboardReceipt(repairRow(),null,'owner')]});
 }));
 render(<OpenHandsRepairPanel/>);
 fireEvent.change(screen.getByLabelText('What needs repair?'),{target:{value:h.goal}});
 fireEvent.click(screen.getByRole('button',{name:'Send repair to OpenHands'}));
 await screen.findByRole('status');
 await waitFor(()=>expect(screen.getByText(/production not yet verified/)).toBeTruthy());
 const request=calls.find(init=>init?.method==='POST');expect(request.headers['Idempotency-Key']).toMatch(/^[a-f0-9-]{36}$/);
 expect(JSON.parse(request.body)).toEqual({task:h.goal});expect(screen.queryByText(/production verified$/)).toBeNull();
});
