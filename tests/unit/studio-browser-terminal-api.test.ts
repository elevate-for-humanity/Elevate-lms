import {beforeEach,expect,it,vi} from 'vitest';
import {NextRequest,NextResponse} from 'next/server';
vi.mock('@/lib/devstudio/api-auth',()=>({apiRequireDevStudio:vi.fn(async()=>({id:'verified-admin',error:null}))}));
vi.mock('@/lib/api/withRateLimit',()=>({applyRateLimit:vi.fn(async()=>null)}));
vi.mock('@/lib/secrets',()=>({getSecrets:vi.fn(async()=>({STUDIO_BROWSER_URL:'https://studio.test',STUDIO_BROWSER_SECRET:'test-only-secret'}))}));
vi.mock('@/lib/devstudio/github-token',()=>({getGitHubToken:vi.fn(async()=>'short-lived-fixture-token')}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:vi.fn()}));
vi.mock('@/lib/studio/master-runtime',()=>({recordMasterStudioArtifact:vi.fn()}));
import {apiRequireDevStudio} from '@/lib/devstudio/api-auth';
import {GET,POST} from '@/apps/admin/app/api/admin/dev-studio/runtime/route';
beforeEach(()=>{vi.clearAllMocks();vi.mocked(apiRequireDevStudio).mockResolvedValue({id:'verified-admin',error:null} as any);vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,status:200,json:async()=>({ok:true})})));});
it('derives terminal ownership from verified authentication on output requests',async()=>{
 await GET(new NextRequest('https://admin.test/api?operation=terminal-output&sessionId=opaque',{headers:{'x-studio-operator-id':'forged'}}));
 expect(fetch).toHaveBeenCalledWith('https://studio.test/workspace/terminal/opaque/output?after=0',expect.objectContaining({headers:expect.objectContaining({'x-studio-operator-id':'verified-admin'})}));
});
it('resumes only the requested terminal with server-derived ownership and no replay payload',async()=>{
 await POST(new NextRequest('https://admin.test/api',{method:'POST',body:JSON.stringify({operation:'terminal-resume',sessionId:'opaque',owner:'forged',command:'do not replay'})}));
 expect(fetch).toHaveBeenCalledWith('https://studio.test/workspace/terminal/opaque/resume',expect.objectContaining({method:'POST',body:'{}',headers:expect.objectContaining({'x-studio-operator-id':'verified-admin'})}));
});
it('does not contact the runtime when authorization fails',async()=>{
 vi.mocked(apiRequireDevStudio).mockResolvedValue({error:NextResponse.json({error:'Forbidden'},{status:403})} as any);
 const response=await GET(new NextRequest('https://admin.test/api?operation=terminal-output&sessionId=opaque'));
 expect(response.status).toBe(403);expect(fetch).not.toHaveBeenCalled();
});
it('keeps generated file downloads binary and owner-scoped without exposing runtime credentials',async()=>{
 const bytes=new Uint8Array([0,255,80,75]);
 vi.stubGlobal('fetch',vi.fn(async()=>new Response(bytes,{headers:{'content-type':'application/pdf','content-disposition':'attachment; filename="report.pdf"'}})));
 const result=await GET(new NextRequest('https://admin.test/api?operation=artifact&name=report.pdf&owner=forged'));
 expect(new Uint8Array(await result.arrayBuffer())).toEqual(bytes);
 expect(result.headers.get('cache-control')).toBe('private, no-store');
 expect(fetch).toHaveBeenCalledWith('https://studio.test/workspace/artifacts?name=report.pdf',expect.objectContaining({headers:expect.objectContaining({'x-studio-operator-id':'verified-admin'})}));
});
it('requires main push confirmation before retrieving a short-lived GitHub credential',async()=>{
 const response=await POST(new NextRequest('https://admin.test/api',{method:'POST',body:JSON.stringify({operation:'repository-push',branch:'main',expectedSha:'a'.repeat(40)})}));
 expect(response.status).toBe(409);expect(fetch).not.toHaveBeenCalled();
});
it('forwards a server-issued GitHub credential only to the private runtime for a verified push',async()=>{
 const response=await POST(new NextRequest('https://admin.test/api',{method:'POST',body:JSON.stringify({operation:'repository-push',branch:'review-branch',expectedSha:'a'.repeat(40),githubToken:'browser-token'})}));
 expect(response.status).toBe(200);
 const args=vi.mocked(fetch).mock.calls[0];
 expect(JSON.parse(args[1]!.body as string)).toEqual({branch:'review-branch',expectedSha:'a'.repeat(40),githubToken:'short-lived-fixture-token'});
 expect(await response.text()).not.toContain('short-lived-fixture-token');
});
