import {beforeEach,expect,it,vi} from 'vitest';
import {NextRequest} from 'next/server';
const h=vi.hoisted(()=>({enqueue:vi.fn(),stage:vi.fn(),denied:false}));
vi.mock('@/lib/devstudio/api-auth',()=>({apiRequireDevStudio:async()=>h.denied?{error:new Response(null,{status:403})}:{id:'owner'}}));
vi.mock('@/lib/api/withRateLimit',()=>({applyRateLimit:async()=>null}));
vi.mock('@/lib/ai/runtime/code-repair',()=>({enqueueParisRepair:h.enqueue}));
vi.mock('@/lib/devstudio/paris-code-engineer',()=>({stageParisCodeRepair:h.stage}));
import {POST} from '@/apps/admin/app/api/admin/dev-studio/engineering/route';
beforeEach(()=>{h.denied=false;h.enqueue.mockReset();h.stage.mockReset();h.enqueue.mockResolvedValue({id:'repair'});});
const request=()=>new NextRequest('https://admin.example/api/admin/dev-studio/engineering',{method:'POST',body:JSON.stringify({task:'Repair the dashboard layout'})});
it('Studio persists a real repair before acknowledging acceptance and does not require a permanent GitHub credential',async()=>{
 const response=await POST(request());expect(response.status).toBe(202);expect(await response.json()).toMatchObject({repairId:'repair',status:'queued',executed:false});
 expect(h.enqueue).toHaveBeenCalledWith({actorId:'owner',goal:'Repair the dashboard layout'});expect(h.stage).not.toHaveBeenCalled();
});
it('unauthorized or unpersisted work cannot be acknowledged as accepted',async()=>{
 h.denied=true;expect((await POST(request())).status).toBe(403);expect(h.enqueue).not.toHaveBeenCalled();
 h.denied=false;h.enqueue.mockResolvedValue({id:null});expect((await POST(request())).status).toBe(503);
});
