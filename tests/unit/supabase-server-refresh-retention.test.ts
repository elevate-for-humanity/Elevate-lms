// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createClient } from '@/lib/supabase/server';
const state=vi.hoisted(()=>({cookieStore:null as any}));
vi.mock('next/headers',()=>({cookies:async()=>state.cookieStore,headers:async()=>new Headers({host:'admin.elevateforhumanity.org'})}));
vi.mock('@/lib/logger',()=>({logger:{error:vi.fn()}}));
import { isAuthRetryableFetchError } from '@supabase/supabase-js';
const origin='https://fixture.supabase.co',name='sb-fixture-auth-token';
const user={id:'fixture-user',aud:'authenticated',role:'authenticated',email:'fixture@example.invalid',created_at:'2026-01-01T00:00:00Z'};
function jwt(exp:number){const encode=(v:unknown)=>Buffer.from(JSON.stringify(v)).toString('base64url');return encode({alg:'HS256',typ:'JWT'})+'.'+encode({sub:user.id,aud:'authenticated',role:'authenticated',exp})+'.fixture';}
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();vi.unstubAllEnvs();});
describe('actual server SSR refresh',()=>{
 it.each([{adapter:true,status:429,retained:true},{adapter:true,status:400,retained:false}])('adapter=$adapter HTTP$status retains=$retained',async({adapter,status,retained})=>{
  vi.useFakeTimers();vi.setSystemTime(new Date('2026-10-24T00:00:00Z'));
  const expires_at=Math.floor(Date.now()/1000)+3600;
  const serialized='base64-'+Buffer.from(JSON.stringify({access_token:jwt(expires_at),refresh_token:'fixture-original',expires_at,token_type:'bearer',user})).toString('base64url');
  const jar=new Map([[name,serialized],['unrelated','preserve']]);
  const writes:Array<{name:string;value:string;options?:{maxAge?:number}}>=[];
  let upstreamStatus=status;
  const upstream=vi.fn(async(input:RequestInfo|URL,init?:RequestInit)=>{
   const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url);
   expect(url.origin).toBe(origin);
   if(url.pathname==='/auth/v1/user')return Response.json(user);
   expect(url.pathname).toBe('/auth/v1/token');expect(url.searchParams.get('grant_type')).toBe('refresh_token');expect(init?.method).toBe('POST');
   if(upstreamStatus===429)return Response.json({code:'over_request_rate_limit',msg:'Rate limited'},{status:429,headers:{'retry-after':'60'}});
   if(upstreamStatus===400)return Response.json({code:'refresh_token_not_found',msg:'Invalid Refresh Token: Refresh Token Not Found'},{status:400});
   return Response.json({access_token:jwt(Math.floor(Date.now()/1000)+3600),refresh_token:'fixture-next',token_type:'bearer',expires_in:3600,user});
  });
  vi.stubGlobal('fetch',upstream);vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL',origin);vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY','fixture-public-key');
  state.cookieStore={getAll:()=>[...jar].map(([name,value])=>({name,value})),
   set:(cookieName:string,value:string,options:any)=>{writes.push({name:cookieName,value,options});if(options?.maxAge===0||value==='')jar.delete(cookieName);else jar.set(cookieName,value);}};
  const client=await createClient();
  await client.auth.initialize();vi.setSystemTime(new Date('2026-10-24T02:00:00Z'));
  const pending=client.auth.getSession();await vi.advanceTimersByTimeAsync(35_000);const result=await pending;
  expect(result.error).toBeTruthy();expect(isAuthRetryableFetchError(result.error)).toBe(retained);expect(upstream).toHaveBeenCalledTimes(1);expect(jar.get('unrelated')).toBe('preserve');
  const authWrites=writes.filter(w=>w.name===name);
  if(!retained){expect(jar.has(name)).toBe(false);expect(authWrites.some(w=>w.options?.maxAge===0)).toBe(true);return;}
  expect(jar.get(name)).toBe(serialized);expect(authWrites).toHaveLength(0);
  upstreamStatus=200;await vi.advanceTimersByTimeAsync(61_000);
  const recovered=await client.auth.getSession();expect(recovered.error).toBeNull();expect(recovered.data.session?.refresh_token).toBe('fixture-next');
  const persisted=JSON.parse(Buffer.from(jar.get(name)!.slice(7),'base64url').toString());expect(persisted.refresh_token).toBe('fixture-next');expect(upstream).toHaveBeenCalledTimes(2);
  const verified=await client.auth.getUser();expect(verified.error).toBeNull();expect(verified.data.user?.id).toBe(user.id);expect(upstream).toHaveBeenCalledTimes(3);
 });
});
