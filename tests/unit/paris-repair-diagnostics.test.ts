import {afterEach,expect,it,vi} from 'vitest';
import {NextRequest} from 'next/server';
const tick=vi.hoisted(()=>vi.fn());
const authorized=vi.hoisted(()=>vi.fn(async()=>true));
vi.mock('@/lib/paris-workflow-identity',()=>({authorizeParisWorkflow:authorized}));
vi.mock('@/lib/ai/runtime/code-repair',()=>({tickParisCodeRepairs:tick,prepareParisRepair:vi.fn(),publishParisRepair:vi.fn(),reportParisRepairFailure:vi.fn()}));
import {POST} from '@/apps/admin/app/api/cron/paris-code-repair/route';
afterEach(()=>{vi.unstubAllEnvs();vi.restoreAllMocks();tick.mockReset();authorized.mockReset();authorized.mockResolvedValue(true);});
it('returns an actionable safe credential code to the trusted monitor',async()=>{
 vi.spyOn(console,'error').mockImplementation(()=>{});tick.mockRejectedValue(Error('PARIS_GITHUB_HTTP_401'));
 const response=await POST(new NextRequest('https://admin.example/api/cron/paris-code-repair',{method:'POST',headers:{authorization:'Bearer test-only'},body:JSON.stringify({phase:'tick'})}));expect(response.status).toBe(502);expect(await response.json()).toMatchObject({errorCode:'PARIS_GITHUB_HTTP_401'});
});
it('never returns arbitrary internal error content in the monitor response',async()=>{
 vi.spyOn(console,'error').mockImplementation(()=>{});tick.mockRejectedValue(Error('PARIS_PRIVATE_SECRET_VALUE'));
 const response=await POST(new NextRequest('https://admin.example/api/cron/paris-code-repair',{method:'POST',headers:{authorization:'Bearer test-only'},body:JSON.stringify({phase:'tick'})}));expect(await response.text()).not.toContain('PARIS_PRIVATE_SECRET_VALUE');
});

it('rejects missing or invalid signed identity without executing a repair',async()=>{
 authorized.mockResolvedValue(false);tick.mockReset();
 const response=await POST(new NextRequest('https://admin.example/api/cron/paris-code-repair',{method:'POST',body:JSON.stringify({phase:'tick'})}));
 expect(response.status).toBe(401);expect(tick).not.toHaveBeenCalled();
});

it('requires temporary authorization for repair writes after checking signed identity',async()=>{
 const response=await POST(new NextRequest('https://admin.example/api/cron/paris-code-repair',{method:'POST',headers:{authorization:'Bearer test-only'},body:JSON.stringify({phase:'prepare',repairId:'00000000-0000-4000-8000-000000000001',runId:7})}));
 expect(response.status).toBe(400);expect(await response.json()).toMatchObject({errorCode:'PARIS_WORKFLOW_GITHUB_TOKEN_REQUIRED'});
});

it('uses the temporary job identity only inside an authenticated prepare request',async()=>{
 const {prepareParisRepair}=await import('@/lib/ai/runtime/code-repair');
 const {currentWorkflowGitHubToken}=await import('@/lib/devstudio/workflow-github-context');
 vi.mocked(prepareParisRepair).mockImplementationOnce(async()=>{
  expect(currentWorkflowGitHubToken()).toBe('temporary-workflow-token-123456');
  return {sha:'a'.repeat(40),baseSha:'b'.repeat(40),branch:'studio/repair'};
 });
 const response=await POST(new NextRequest('https://admin.example/api/cron/paris-code-repair',{method:'POST',headers:{authorization:'Bearer test-only','x-paris-github-token':'temporary-workflow-token-123456'},body:JSON.stringify({phase:'prepare',repairId:'00000000-0000-4000-8000-000000000001',runId:7})}));
 expect(response.status).toBe(200);expect(await response.text()).not.toContain('temporary-workflow-token');expect(currentWorkflowGitHubToken()).toBeUndefined();
});
