import {beforeEach,expect,it,vi} from 'vitest';
const h=vi.hoisted(()=>({row:null as any,updates:[] as any[],validation:'success',branchSha:'b'.repeat(40)}));
vi.mock('server-only',()=>({}));
vi.mock('@/lib/devstudio/github-token',()=>({getGitHubHeaders:async()=>({Authorization:'Bearer test-only'})}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:async()=>({from:()=>{
 let values:any;
 const q:any={select:()=>q,eq:()=>q,in:()=>q,update:(v:any)=>{values=v;return q;},single:async()=>({data:h.row,error:null}),maybeSingle:async()=>({data:h.row,error:null}),then:(resolve:any)=>{if(values)h.updates.push(values);return Promise.resolve(resolve({data:h.row,error:null}));}};return q;
}})}));
import {publishParisRepair,prepareParisRepair} from '@/lib/ai/runtime/code-repair';
beforeEach(()=>{
 h.row={id:'repair',status:'validating',workflow_run_id:7,candidate:{base_sha:'a'.repeat(40),branch:{name:'studio/task',sha:'b'.repeat(40)}}};h.updates=[];h.validation='success';h.branchSha='b'.repeat(40);
 vi.stubGlobal('fetch',vi.fn(async(url:string,init:any={})=>{
  if(url.includes('/artifacts?'))return new Response(JSON.stringify({artifacts:[{name:'paris-validated-repair-'+'b'.repeat(40),expired:false}]}));
  if(url.includes('/jobs?'))return new Response(JSON.stringify({jobs:[{name:'validate',status:'completed',conclusion:h.validation}]}));
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
it('publishes only the validated SHA without force and dispatches actual Google workflows',async()=>{
 const result=await publishParisRepair('repair',7);expect(result.verifiedLive).toBe(false);
 const writes=vi.mocked(fetch).mock.calls.filter(([,o])=>o?.method==='PATCH');
 expect(writes).toHaveLength(1);expect(JSON.parse(String(writes[0][1]?.body))).toEqual({sha:'b'.repeat(40),force:false});
 expect(h.updates).toContainEqual(expect.objectContaining({status:'deploying',release_sha:'b'.repeat(40)}));
 expect(vi.mocked(fetch).mock.calls.filter(([u])=>String(u).endsWith('/dispatches')).map(([u])=>String(u))).toEqual([expect.stringContaining('deploy-admin.yml')]);
});
it('a stale repair state or another workflow run cannot publish',async()=>{
 await expect(publishParisRepair('repair',8)).rejects.toThrow('STATE_MISMATCH');
 h.row.status='blocked';await expect(publishParisRepair('repair',7)).rejects.toThrow('STATE_MISMATCH');
 expect(vi.mocked(fetch)).not.toHaveBeenCalled();
});
it('binds the requested Admin deployment to the validated immutable release',async()=>{
 await publishParisRepair('repair',7);
 const dispatch=vi.mocked(fetch).mock.calls.find(([url])=>String(url).endsWith('/dispatches'));
 expect(JSON.parse(String(dispatch?.[1]?.body))).toEqual({ref:'main',inputs:{requested_sha:'b'.repeat(40)}});
 expect(h.updates).toContainEqual(expect.objectContaining({verification:expect.objectContaining({requestedDeploymentAt:expect.objectContaining({'deploy-admin.yml':expect.any(String)})})}));
});
it('preserves the published release and surfaces a rejected deployment dispatch as blocked',async()=>{
 const original=vi.mocked(fetch).getMockImplementation()!;
 vi.mocked(fetch).mockImplementation(async(input:any,init:any)=>String(input).endsWith('/dispatches')?new Response(null,{status:403}):original(input,init));
 await expect(publishParisRepair('repair',7)).rejects.toThrow('PARIS_GITHUB_HTTP_403');
 expect(h.updates).toContainEqual(expect.objectContaining({release_sha:'b'.repeat(40)}));
 expect(h.updates.at(-1)).toMatchObject({status:'blocked',error_code:'REPAIR_DEPLOYMENT_DISPATCH_FAILED'});
});
