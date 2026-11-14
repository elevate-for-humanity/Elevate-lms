// @vitest-environment node
import {afterEach, expect, it, vi} from 'vitest';
import {checkSupabaseHealth} from '@/lib/health/service-health';
afterEach(()=>vi.unstubAllEnvs());
it.each([['elevate-store-migration','products'],['elevate-marketing-migration','programs']])('checks the %s owned catalog rather than another application table',async(service,table)=>{
 vi.stubEnv('K_SERVICE',service);
 vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://test.supabase.co');
 vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY','test-anon');
 const paths:string[]=[];
 const request=vi.fn(async(url:string)=>{
  paths.push(new URL(url).pathname);
  if(url.includes('/rest/')&&!url.includes('/rest/v1/'+table+'?'))return new Response('{}',{status:404});
  return new Response(url.includes('/rest/')?'[]':'{}',{status:200});
 });
 expect((await checkSupabaseHealth(1000,request as typeof fetch)).ok).toBe(true);
 expect(paths).toEqual(['/auth/v1/settings','/rest/v1/'+table]);
});
