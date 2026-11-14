import {afterEach,expect,it,vi} from 'vitest';
import {NextRequest} from 'next/server';
const tick=vi.hoisted(()=>vi.fn());
const authorized=vi.hoisted(()=>vi.fn(async()=>true));
const deployDiagnostic=vi.hoisted(()=>vi.fn(async()=>false));
const openhands=vi.hoisted(()=>vi.fn());
vi.mock('@/lib/devstudio/paris-openhands-readiness',()=>({probeOpenHandsReadiness:openhands}));
vi.mock('@/lib/paris-workflow-identity',()=>({authorizeParisWorkflow:authorized,authorizeParisDeploymentAppDiagnostic:deployDiagnostic}));
vi.mock('@/lib/ai/runtime/code-repair',()=>({tickParisCodeRepairs:tick,prepareParisRepair:vi.fn(),publishParisRepair:vi.fn(),reportParisRepairFailure:vi.fn()}));
import {POST} from '@/apps/admin/app/api/cron/paris-code-repair/route';
afterEach(()=>{vi.unstubAllEnvs();vi.restoreAllMocks();tick.mockReset();openhands.mockReset();authorized.mockReset();authorized.mockResolvedValue(true);deployDiagnostic.mockReset();deployDiagnostic.mockResolvedValue(false);});
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

it('deploy-admin OIDC cannot call PARIS tick, prepare or publish operations',async()=>{
 authorized.mockResolvedValue(false);
 deployDiagnostic.mockResolvedValue(true);
 const response=await POST(new NextRequest('https://admin.example/api/cron/paris-code-repair',{
  method:'POST',headers:{authorization:'Bearer deploy-only'},body:JSON.stringify({phase:'tick'}),
 }));
 expect(response.status).toBe(401);
 expect(tick).not.toHaveBeenCalled();
});

it('returns a distinct read-only OpenHands receipt without ticking or starting a repair',async()=>{
 openhands.mockResolvedValueOnce({verified:false,status:'not_configured',apiKeyResolved:false,repositoryMatches:true,agentStarted:false});
 const response=await POST(new NextRequest('https://admin.example/api/cron/paris-code-repair',{
  method:'POST',headers:{authorization:'Bearer signed-workflow','x-paris-github-token':'ignored-override'},body:JSON.stringify({phase:'openhands-auth-diagnostic'}),
 }));
 expect(response.status).toBe(200);expect(response.headers.get('Cache-Control')).toBe('no-store');
 expect(await response.json()).toMatchObject({verified:false,apiKeyResolved:false,repositoryMatches:true,agentStarted:false});
 expect(openhands).toHaveBeenCalledOnce();expect(tick).not.toHaveBeenCalled();
});

it.each(['anonymous','deployment-only'])('rejects %s OpenHands diagnostics before reading configuration',async identity=>{
 authorized.mockResolvedValue(false);deployDiagnostic.mockResolvedValue(identity==='deployment-only');
 const response=await POST(new NextRequest('https://admin.example/api/cron/paris-code-repair',{
  method:'POST',body:JSON.stringify({phase:'openhands-auth-diagnostic'}),
 }));
 expect(response.status).toBe(401);expect(openhands).not.toHaveBeenCalled();expect(tick).not.toHaveBeenCalled();
});
