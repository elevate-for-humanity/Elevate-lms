import {pathToFileURL} from 'node:url';
const fail=code=>{throw Error('TENANT_ISOLATION_'+code);};
const privileged=new Set(['admin','super_admin','staff','platform_owner','platform_admin']);
// Read-only proof from real sessions. Service-role clients bypass RLS.
export async function verifyTenantIsolation({env=process.env,request=fetch}={}) {
 const {NEXT_PUBLIC_SUPABASE_URL:origin,NEXT_PUBLIC_SUPABASE_ANON_KEY:key}=env;
 const tokens=[env.TEST_TENANT_A_JWT,env.TEST_TENANT_B_JWT];
 if(!origin||!key||tokens.some(t=>!t))fail('AUTHORIZED_TEST_SESSIONS_REQUIRED');
 let base;try{base=new URL(origin);}catch{fail('ORIGIN_INVALID');}
 if(base.origin!=='https://cuxzzpsyufcewtmicszk.supabase.co'||base.pathname!=='/')fail('ORIGIN_INVALID');
 async function read(path,token) {
  let r;try{r=await request(new URL(path,base),{method:'GET',redirect:'error',headers:{apikey:key,Authorization:'Bearer '+token},signal:AbortSignal.timeout(15000)});}catch{fail('READ_UNAVAILABLE');}
  if(!r.ok)fail('READ_REJECTED');
  try{return await r.json();}catch{fail('RESPONSE_INVALID');}
 }
 const actors=[];
 for(const token of tokens) {
  const user=await read('/auth/v1/user',token);
  if(!/^[a-f0-9-]{36}$/i.test(user?.id??''))fail('IDENTITY_INVALID');
  const rows=await read('/rest/v1/profiles?select=id,tenant_id,role&id=eq.'+encodeURIComponent(user.id),token);
  if(!Array.isArray(rows)||rows.length!==1||rows[0].id!==user.id||!rows[0].tenant_id)fail('OWN_PROFILE_UNAVAILABLE');
  if(privileged.has(rows[0].role)||typeof rows[0].role!=='string')fail('NONPRIVILEGED_SESSIONS_REQUIRED');
  actors.push(rows[0]);
 }
 if(actors[0].id===actors[1].id||actors[0].tenant_id===actors[1].tenant_id)fail('DISTINCT_TENANTS_REQUIRED');
 for(let i=0;i<2;i++) {
  const own=actors[i],other=actors[1-i];
  const cross=await read('/rest/v1/profiles?select=id,tenant_id&id=eq.'+encodeURIComponent(other.id),tokens[i]);
  if(!Array.isArray(cross)||cross.length)fail('CROSS_TENANT_PROFILE_VISIBLE');
  const scoped=await read('/rest/v1/profiles?select=id,tenant_id&tenant_id=eq.'+encodeURIComponent(other.tenant_id),tokens[i]);
  if(!Array.isArray(scoped)||scoped.length)fail('CLIENT_TENANT_FILTER_BYPASSED_RLS');
  const visible=await read('/rest/v1/profiles?select=id,tenant_id&limit=100',tokens[i]);
  if(!Array.isArray(visible)||!visible.some(row=>row.id===own.id)||visible.some(row=>row.tenant_id!==own.tenant_id))fail('UNFILTERED_SCOPE_INVALID');
 }
 return {passed:true,mode:'authenticated-read-only',actors:2,distinctTenants:2,scope:'profiles',portalAcceptance:false,mutations:0};
}
export function reportTenantIsolationFailure(error) {
 console.error(JSON.stringify({passed:false,error:error?.message?.startsWith('TENANT_ISOLATION_')?error.message:'TENANT_ISOLATION_CHECK_FAILED'}));process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)verifyTenantIsolation().then(result=>console.log(JSON.stringify(result))).catch(reportTenantIsolationFailure);
