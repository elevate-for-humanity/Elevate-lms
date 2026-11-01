import {afterEach,describe,it,expect,vi} from 'vitest';
vi.mock('server-only',()=>({}));
vi.mock('@/lib/ai/ai-service',()=>({getActiveProviderName:()=> 'cloudflare'}));
vi.mock('@/lib/ai/providers/owned-model-health.mjs',()=>({probeOwnedModel:vi.fn()}));
vi.mock('@/lib/secrets',()=>({hydrateProcessEnv:async()=>{},getSecrets:async()=>({CLOUDFLARE_ACCOUNT_ID:'a'.repeat(32),CLOUDFLARE_AI_API_TOKEN:'fixture-private',CLOUDFLARE_AI_MODEL:'@cf/test/model'})}));
import {probeCloudflareWorkersAI} from '@/lib/ai/provider-runtime';
afterEach(()=>vi.unstubAllGlobals());
describe('Workers AI exact model connection proof',()=>{
 it.each([{success:false,result:[{name:'@cf/test/model'}]},{success:true,result:[]},{success:true,result:[{name:'@cf/other/model'}]}])('rejects HTTP success without the configured model: %j',async body=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify(body))));
  expect(await probeCloudflareWorkersAI()).toMatchObject({configured:true,reachable:false});
 });
 it('accepts an authenticated catalogue response for the exact model',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({success:true,result:[{name:'@cf/test/model'}]}))));
  expect(await probeCloudflareWorkersAI()).toMatchObject({configured:true,reachable:true});
 });
});
