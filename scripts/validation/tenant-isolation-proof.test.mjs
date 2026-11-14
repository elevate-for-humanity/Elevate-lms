import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyTenantIsolation} from './tenant-isolation-proof.mjs';
const ids=['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222'];
const env={NEXT_PUBLIC_SUPABASE_URL:'https://cuxzzpsyufcewtmicszk.supabase.co',NEXT_PUBLIC_SUPABASE_ANON_KEY:'anon',TEST_TENANT_A_JWT:'actor-a',TEST_TENANT_B_JWT:'actor-b'};
function fixture({leak=false,role='student',sameTenant=false,reject=false}={}) {
 const calls=[];
 const request=async(url,options)=>{
  calls.push(String(url));assert.equal(options.method,'GET');
  if(reject)return new Response(null,{status:401});
  const i=options.headers.Authorization.endsWith('actor-a')?0:1;
  const own={id:ids[i],tenant_id:sameTenant?'tenant-a':'tenant-'+i,role};
  if(url.pathname==='/auth/v1/user')return Response.json({id:ids[i]});
  if(url.searchParams.get('id')==='eq.'+ids[i]||url.searchParams.has('limit'))return Response.json([own]);
  return Response.json(leak?[{id:ids[1-i],tenant_id:'other'}]:[]);
 };return {request,calls};
}
test('missing sessions cannot fall back to a service-role key',async()=>{
 let called=false;await assert.rejects(verifyTenantIsolation({env:{SUPABASE_SERVICE_ROLE_KEY:'private'},request:async()=>{called=true;}}),/AUTHORIZED_TEST_SESSIONS_REQUIRED/);assert.equal(called,false);
});
test('authenticated bidirectional isolation uses only GET and states its limited scope',async()=>{
 const f=fixture();const result=await verifyTenantIsolation({env,...f});assert.equal(result.passed,true);assert.equal(result.mutations,0);assert.equal(result.portalAcceptance,false);assert.equal(f.calls.length,10);
});
test('cross-tenant visibility, privileged accounts, identical tenants and rejected sessions cannot pass',async()=>{
 for(const options of [{leak:true},{role:'admin'},{sameTenant:true},{reject:true}])await assert.rejects(verifyTenantIsolation({env,...fixture(options)}),/TENANT_ISOLATION_/);
});
