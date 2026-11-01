import {beforeEach,describe,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({execute:vi.fn(),infer:vi.fn(),observe:vi.fn(),insert:vi.fn()}));
vi.mock('@/lib/ai/tools/executor',()=>({executeRegisteredAITool:mocks.execute}));
vi.mock('@/lib/ai/execute-ai-task',()=>({executeAiTask:mocks.infer}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:async()=>({from:()=>({insert:mocks.insert})})}));
import {classifyParisFailure,recordParisObservation,safeParisFailureSummary} from '@/lib/ai/runtime/supervision';
import {executeAICommand} from '@/lib/ai/runtime/command-executor';
import {canAgentUseTool,getAITool,listAIToolsForAgent} from '@/lib/ai/tools/registry';
import {planAIToolFromCommand} from '@/lib/ai/tools/planner';
const context={agent:'ELLIE' as const,actorId:'actor',actorRoles:['admin'],adminOrigin:'https://admin.example.com',correlationId:'corr'};
beforeEach(()=>{vi.clearAllMocks();mocks.insert.mockReturnValue({abortSignal:async()=>({error:null})});});
describe('combined PARIS execution',()=>{
 it('combines capability tool access while preserving protected tool definitions',()=>{
  for(const id of ['PARIS','ELLIE','LIZZY','ZORA'] as const)
   for(const tool of listAIToolsForAgent(id)) expect(canAgentUseTool(tool,'PARIS')).toBe(true);
  expect(getAITool('courses.generate')).toMatchObject({approvalRequired:false,allowedRoles:['admin','super_admin']});
  expect(getAITool('courses.publish')).toMatchObject({approvalRequired:true});
  expect(getAITool('paris.supervision')?.allowedRoles).not.toContain('student');
  expect(canAgentUseTool(getAITool('studio.runtime.files')!,'ROUTER')).toBe(false);
 });
 it('routes legacy capability commands through one identity without claiming queued work completed',async()=>{
  mocks.execute.mockResolvedValue({ok:true,status:'accepted',tool:'courses.generate',risk:'high',payload:{jobId:'job'}});
  const result=await executeAICommand('build a course',context);
  expect(mocks.execute).toHaveBeenCalledWith('courses.generate',expect.anything(),expect.objectContaining({agent:'PARIS',actorRoles:['admin']}));
  expect(result).toMatchObject({status:'running',executed:true});
  expect(result.message).toContain('PARIS dispatched');
 });
 it('does not turn approval into success',async()=>{
  mocks.execute.mockResolvedValue({ok:false,status:'approval_required',tool:'courses.generate',requiredConfirmation:'CONFIRM'});
  expect(await executeAICommand('build a course',context)).toMatchObject({ok:false,executed:false,status:'approval_required'});
  expect(mocks.infer).not.toHaveBeenCalled();
 });
 it('records unknown failures and propagates them without replaying mutations',async()=>{
  mocks.execute.mockRejectedValue(new Error('unexpected fault'));
  await expect(executeAICommand('build a course',context)).rejects.toThrow('unexpected fault');
  expect(mocks.execute).toHaveBeenCalledTimes(1);
  expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({status:'failed',recovery:'attention_required'}));
 });
 it('makes supervision available as a read-only command',()=>{
  expect(planAIToolFromCommand('check all the AIs health')).toEqual({name:'paris.supervision',input:{}});
 });
});
describe('failure supervision',()=>{
 it('creates a safe failure summary without persisting a raw exception or credential',()=>{
  const raw='HTTP 401 invalid api key sk-live-do-not-log';
  const summary=safeParisFailureSummary(new Error(raw));
  expect(summary.category).toBe('credentials');
  expect(summary.message).not.toContain(raw);
  expect(summary.message).not.toContain('sk-live-do-not-log');
 });
 it('binds Paris audit tenant scope to the authenticated membership, not request context',async()=>{
  const {readFileSync}=await import('node:fs');
  const source=readFileSync('apps/admin/app/api/paris/execute/route.ts','utf8');
  expect(source).toContain('const tenantId = await resolveTenantIdForUser(auth.id)');
  expect(source).toContain('const context = { ...requestedContext, tenantId }');
  expect(source).not.toContain('typeof context.tenantId');
 });
 it.each([
  ['credential missing','credentials','attention_required'],['insufficient credits','billing','attention_required'],
  ['HTTP 503','transient','existing_retry_policy'],['frozen media quality failed','quality','attention_required'],
  ['LICENSE_APPROVAL_REQUIRED','source','attention_required'],['owner approval required','approval','attention_required'],
  ['unrecognized fault','unknown','attention_required'],
 ])('classifies %s', (message,category,recovery)=>{
  expect(classifyParisFailure(message)).toMatchObject({category,recovery});
 });
 it('persists only safe metadata, without raw prompts, errors or provider credentials',async()=>{
  await recordParisObservation({kind:'command',operation:'test',status:'failed',durationMs:2,error:'secret credential sk-private'});
  const row=mocks.insert.mock.calls[0][0];
  expect(row).toMatchObject({identity:'PARIS',failure_category:'credentials'});
  expect(JSON.stringify(row)).not.toContain('sk-private');
 });
});

it('routes the remaining non-Store instructor and analytics inference through the shared gateway',async()=>{
 const {readFileSync}=await import('node:fs');
 for(const file of ['apps/lms/app/api/ai-instructor/hvac/route.ts','apps/admin/app/api/analytics/analytics/dropout-risk/route.ts']) {
  const source=readFileSync(file,'utf8');
  expect(source).toContain('aiChat({');
  expect(source).toContain('PARIS_SYSTEM_IDENTITY');
  expect(source).not.toContain('generativelanguage.googleapis.com');
  expect(source).not.toContain('chat.completions.create');
 }
});
