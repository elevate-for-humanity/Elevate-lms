/**
 * Read-only Cloud Audit Logs history for Secret Manager operations.
 * No credential payloads, request bodies, or audit principal emails are returned.
 */
import {NextRequest,NextResponse} from 'next/server';
import {apiAuthGuard} from '@/lib/admin/guards';
import {checkPrivilegedMfa} from '@/lib/auth/privileged-mfa';
import {createClient} from '@/lib/supabase/server';
import {applyRateLimit} from '@/lib/api/withRateLimit';
export const runtime='nodejs';export const dynamic='force-dynamic';
const PROJECT='elegant-racer-299721';
export async function GET(request:NextRequest){
 const limited=await applyRateLimit(request,'api');if(limited)return limited;
 const user=await apiAuthGuard(request);if(user.error)return user.error;
 if(!user.effectiveRoles.includes('super_admin'))return NextResponse.json({error:'Forbidden'},{status:403});
 const mfa=await checkPrivilegedMfa(await createClient(),user.effectiveRoles);
 if(!mfa.satisfied)return NextResponse.json({error:'MFA_REQUIRED',mfaUrl:'/mfa'},{status:403});
 try{
  const metadata=await fetch('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',{headers:{'Metadata-Flavor':'Google'},cache:'no-store',signal:AbortSignal.timeout(5000)});
  if(!metadata.ok)throw new Error('identity');
  const auth=await metadata.json();if(!auth.access_token)throw new Error('identity');
  const response=await fetch('https://logging.googleapis.com/v2/entries:list',{
   method:'POST',headers:{Authorization:`Bearer ${auth.access_token}`,'Content-Type':'application/json'},
   cache:'no-store',signal:AbortSignal.timeout(10000),
   body:JSON.stringify({resourceNames:[`projects/${PROJECT}`],pageSize:30,orderBy:'timestamp desc',
    filter:'protoPayload.serviceName="secretmanager.googleapis.com" AND (logName:"cloudaudit.googleapis.com")'})
  });
  if(!response.ok)throw new Error('Cloud Logging unavailable');
  const data=await response.json();
  const history=(data.entries??[]).map((e:any)=>({
   timestamp:e.timestamp??null,
   action:String(e.protoPayload?.methodName??'unknown').split('.').at(-1),
   status:e.protoPayload?.status?.code??0,
   resource:String(e.protoPayload?.resourceName??'').split('/').slice(-2).join('/'),
   auditSource:'Google Cloud Audit Logs'
  }));
  return NextResponse.json({ok:true,history,verifiedAt:new Date().toISOString()},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({ok:false,error:'Audit history unavailable; no conclusion about audit configuration'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
