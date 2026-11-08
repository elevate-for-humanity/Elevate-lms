import {beforeEach,expect,it,vi} from 'vitest';

const mocks=vi.hoisted(()=>({
  getAgent:vi.fn(),
  logActivity:vi.fn(),
  execute:vi.fn(),
}));
vi.mock('@/lib/paris/workforce/agent-manager',()=>({
  getAgent:mocks.getAgent,logActivity:mocks.logActivity,
  createAgent:vi.fn(),listAgents:vi.fn(),updateAgent:vi.fn(),deleteAgent:vi.fn(),cloneAgent:vi.fn(),
}));
vi.mock('@/lib/paris/workforce/approval-workflow',()=>({
  requestApproval:vi.fn(),approveWorkflow:vi.fn(),rejectWorkflow:vi.fn(),
  getPendingApprovals:vi.fn(),getApprovalHistory:vi.fn(),
}));
vi.mock('@/lib/ai/runtime/command-executor',()=>({executeAICommand:mocks.execute}));
import {executeAgentTask} from '@/lib/paris/workforce/index';

beforeEach(()=>{
  vi.clearAllMocks();
  mocks.getAgent.mockResolvedValue({
    id:'agent',ownerId:'owner',name:'Worker',status:'active',role:'recruiter',
    config:{approvalRequired:false,approvalTypes:[]},
  });
  mocks.logActivity.mockResolvedValue({id:'activity'});
});
const task={type:'deployment',action:'inspect',details:{}};
it.each([
  ['running',true,true,false,'pending'],
  ['completed',true,true,true,'completed'],
  ['failed',false,false,false,'failed'],
  ['advisory',true,false,false,'pending'],
  ['approval_required',false,false,false,'pending'],
] as const)('reports canonical %s outcome without fabricated task completion',async (status,ok,executed,success,activityStatus)=>{
  mocks.execute.mockResolvedValue({status,ok,executed,message:status,tool:'code.inspect',payload:{trace:'actual'},traceId:'trace'});
  const output=await executeAgentTask('agent',task,{actorId:'owner',actorRoles:['admin']});
  expect(output.success).toBe(success);
  expect(mocks.logActivity).toHaveBeenCalledWith('agent',expect.objectContaining({status:activityStatus}));
  if (status==='running'||status==='completed'||status==='advisory') {
    expect(output.result).toMatchObject({status,executed});
  }
});
