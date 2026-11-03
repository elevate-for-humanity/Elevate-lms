import {beforeEach,expect,it,vi} from 'vitest';
const h=vi.hoisted(()=>({row:null as any,updates:[] as any[],validation:'success',branchSha:'b'.repeat(40),infrastructure:false}));
vi.mock('server-only',()=>({}));
vi.mock('@/lib/devstudio/github-token',()=>({getGitHubHeaders:async()=>({Authorization:'Bearer test-only'})}));
vi.mock('@/lib/devstudio/github-app-token',()=>({getGitHubAppToken:async()=> 'app-only-fixture'}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:async()=>({from:()=>{
 let values:any;
 const q:any={select:()=>q,eq:()=>q,in:()=>q,update:(v:any)=>{values=v;return q;},single:async()=>({data:h.row,error:null}),maybeSingle:async()=>({data:h.row,error:null}),then:(resolve:any)=>{if(values)h.updates.push(values);return Promise.resolve(resolve({data:h.row,error:null}));}};return q;
}})}));
import {publishParisRepair,prepareParisRepair} from '@/lib/ai/runtime/code-repair';
beforeEach(()=>{
 h.row={id:'repair',status:'validating',workflow_run_id:7,candidate:{base_sha:'a'.repeat(40),branch:{name:'studio/task',sha:'b'.repeat(40)}}};h.updates=[];h.validation='success';h.branchSha='b'.repeat(40);h.infrastructure=false;
 vi.stubGlobal('fetch',vi.fn(async(url:string,init:any={})=>{
  if(url.includes('/artifacts?'))return new Response(JSON.stringify({artifacts:[{name:'paris-validated-repair-'+'b'.repeat(40),expired:false}]}));
  if(url.includes('/jobs?'))return new Response(JSON.stringify({jobs:[{name:'validate',status:'completed',conclusion:h.validation}]}));
  if(url.includes('/compare/'))return Response.json({files:[{filename:h.infrastructure?'.github/workflows/deploy-google-store-runtime.yml':'components/Example.tsx'}]});
  if(url.includes('/pulls?'))return Response.json([]);
  if(url.endsWith('/pulls'))return Response.json({number:12,node_id:'PR_12',state:'open',html_url:'https://github.com/example/pull/12'});
  if(url.endsWith('/graphql'))return Response.json({data:{enablePullRequestAutoMerge:{pullRequest:{number:12}}}});
  if(url.includes('/git/ref/heads/studio'))return new Response(JSON.stringify({object:{sha:h.branchSha}}));
  if(url.includes('/git/ref/heads/main'))return new Response(JSON.stringify({object:{sha:'a'.repeat(40)}}));
  if(url.includes('/git/refs/heads/main'))return new Response(JSON.stringify({object:{sha:JSON.parse(init.body).sha}}));
  if(url.endsWith('/dispatches'))return new Response(null,{status:204});
  if(url.endsWith('/actions/runs/7'))return new Response(JSON.stringify({path:'.github/workflows/other.yml',event:'workflow_dispatch',head_branch:'main'}));
  throw Error('Unexpected HTTP '+url);
 }));
});
it('never publishes a failed independent validation',async()=>{
 h.validation='failure';await expect(publishParisRepair('repair',7)).rejects.toThrow('INDEPENDENT_REPAIR_VALIDATION_REQUIRED');
 expect(h.updates).toHaveLength(0);expect(vi.mocked(fetch).mock.calls.some(([,o])=>o?.method==='PATCH')).toBe(false);
});
it('rejects a branch changed after tests and rejects an unrelated workflow authority',async()=>{
 h.branchSha='c'.repeat(40);await expect(publishParisRepair('repair',7)).rejects.toThrow('CHANGED_AFTER_VALIDATION');
 await expect(prepareParisRepair('repair',7)).rejects.toThrow('WORKFLOW_AUTHORITY_REQUIRED');
 expect(h.updates).toHaveLength(0);
});
it('submits only the validated SHA through a protected PR and keeps deployment pending',async()=>{
 const result=await publishParisRepair('repair',7);expect(result.verifiedLive).toBe(false);
 const writes=vi.mocked(fetch).mock.calls.filter(([,o])=>o?.method==='PATCH');
 expect(writes).toHaveLength(0);
 expect(result).toMatchObject({status:'awaiting-protected-merge',pullRequest:{headSha:'b'.repeat(40)}});
 expect(h.updates).toContainEqual(expect.objectContaining({verification:expect.objectContaining({protectedMerge:true,infrastructureRepair:false})}));
 expect(vi.mocked(fetch).mock.calls.filter(([u])=>String(u).endsWith('/dispatches'))).toEqual([]);
});
it('publishes workflow corrections through App-authenticated protected auto-merge before deployment',async()=>{
 h.infrastructure=true;
 expect(await publishParisRepair('repair',7)).toMatchObject({status:'awaiting-protected-merge',verifiedLive:false,pullRequest:{number:12}});
 expect(h.updates).toContainEqual(expect.objectContaining({verification:expect.objectContaining({infrastructureRepair:true,pullRequest:expect.objectContaining({headSha:'b'.repeat(40)})})}));
 const calls=vi.mocked(fetch).mock.calls;
 expect(calls.some(([,init])=>init?.method==='PATCH')).toBe(false);
 expect(calls.some(([url])=>String(url).endsWith('/dispatches'))).toBe(false);
 expect(calls.find(([url])=>String(url).endsWith('/pulls'))?.[1]?.headers).toMatchObject({Authorization:'Bearer app-only-fixture'});
 expect(JSON.parse(String(calls.find(([url])=>String(url).endsWith('/graphql'))?.[1]?.body)).query).toContain('enablePullRequestAutoMerge');
});
it('a stale repair state or another workflow run cannot publish',async()=>{
 await expect(publishParisRepair('repair',8)).rejects.toThrow('STATE_MISMATCH');
 h.row.status='blocked';await expect(publishParisRepair('repair',7)).rejects.toThrow('STATE_MISMATCH');
 expect(vi.mocked(fetch)).not.toHaveBeenCalled();
});
it('binds the protected PR to the independently validated immutable source',async()=>{
 await publishParisRepair('repair',7);
 const publication=vi.mocked(fetch).mock.calls.find(([url])=>String(url).endsWith('/pulls'));
 expect(JSON.parse(String(publication?.[1]?.body))).toMatchObject({base:'main',head:'studio/task'});
 expect(h.updates).toContainEqual(expect.objectContaining({verification:expect.objectContaining({pullRequest:expect.objectContaining({number:12,headSha:'b'.repeat(40)})})}));
});
it('a rejected protected merge cannot be reported as a published or deployed repair',async()=>{
 const original=vi.mocked(fetch).getMockImplementation()!;
 vi.mocked(fetch).mockImplementation(async(input:any,init:any)=>String(input).endsWith('/graphql')?new Response(null,{status:403}):original(input,init));
 await expect(publishParisRepair('repair',7)).rejects.toThrow('PARIS_INFRASTRUCTURE_GITHUB_HTTP_403');
 expect(h.updates.some(value=>value.release_sha||value.status==='verified')).toBe(false);
});
