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
