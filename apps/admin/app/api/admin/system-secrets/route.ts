import { NextRequest, NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { createClient } from '@/lib/supabase/server';
import { checkPrivilegedMfa } from '@/lib/auth/privileged-mfa';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime='nodejs';
export const dynamic='force-dynamic';

const PROJECT='elegant-racer-299721';
const REGION='us-central1';
const COMPONENTS: Record<string,string> = {
  admin:'elevate-admin-migration', lms:'elevate-lms-migration',
  marketing:'elevate-marketing-migration',store:'elevate-store-migration',
};
const INTERNAL_KEYS=['CRON_SECRET','NEXTAUTH_SECRET','STUDIO_BROWSER_SECRET'];
const noStore={'Cache-Control':'no-store, max-age=0'};
function result(body:unknown,status=200){return NextResponse.json(body,{status,headers:noStore});}

async function cloudGet(path:string,token:string){
  const response=await fetch(path,{headers:{Authorization:`Bearer ${token}`},cache:'no-store',signal:AbortSignal.timeout(8000)});
  if(!response.ok) throw new Error(`Google API HTTP ${response.status}`);
  return response.json();
}
export async function GET(req:NextRequest){
  const limited=await applyRateLimit(req,'api');if(limited)return limited;
  const auth=await apiAuthGuard(req);if(auth.error)return auth.error;
  if(!auth.effectiveRoles.includes('super_admin'))return result({error:'Forbidden'},403);
  const db=await createClient();
  const mfa=await checkPrivilegedMfa(db,auth.effectiveRoles);
  if(!mfa.satisfied)return result({error:'MFA_REQUIRED',mfaUrl:'/mfa'},403);

  const component=req.nextUrl.searchParams.get('component')??'admin';
  if(!Object.hasOwn(COMPONENTS,component))return result({error:'Unsupported component'},422);
  try{
    // Managed Google identity; no user-supplied access token or service-account JSON.
    const meta=await fetch('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',{
      headers:{'Metadata-Flavor':'Google'},cache:'no-store',signal:AbortSignal.timeout(5000)
    });
    if(!meta.ok)throw new Error('Runtime identity unavailable');
    const credentials=await meta.json();
    if(typeof credentials.access_token!=='string')throw new Error('Runtime identity unavailable');
    const token=credentials.access_token as string;
    const service=await cloudGet(`https://run.googleapis.com/v2/projects/${PROJECT}/locations/${REGION}/services/${COMPONENTS[component]}`,token);
    const env=(service.template?.containers??[]).flatMap((container:any)=>container.env??[]);
    const secretRefs=env.filter((v:any)=>v.valueSource?.secretKeyRef).map((v:any)=>({
      key:v.name,secret:v.valueSource.secretKeyRef.secret,version:v.valueSource.secretKeyRef.version
    }));
    const secretStatuses=await Promise.all(INTERNAL_KEYS.map(async key=>{
      const name=`elevate-${component}-${key.toLowerCase().replaceAll('_','-')}`;
      if(component!=='admin'&&key==='STUDIO_BROWSER_SECRET')return {key,provisioning:'not-applicable'};
      try{
        const secret=await cloudGet(`https://secretmanager.googleapis.com/v1/projects/${PROJECT}/secrets/${name}`,token);
        const versions=await cloudGet(`https://secretmanager.googleapis.com/v1/projects/${PROJECT}/secrets/${name}/versions?pageSize=30`,token);
        const enabled=(versions.versions??[]).filter((v:any)=>v.state==='ENABLED');
        return {key,provisioning:'present',versions:enabled.length,latestVersion:enabled[0]?.name?.split('/').at(-1)??null,
          bound:secretRefs.some((ref:any)=>ref.key===key&&ref.secret.split('/').at(-1)===name),
          ownershipValid:secret.labels?.elevate_component===component&&secret.labels?.elevate_key===key.toLowerCase()};
      }catch{ return {key,provisioning:'unverified',bound:secretRefs.some((ref:any)=>ref.key===key&&ref.secret.split('/').at(-1)===name)}; }
    }));
    return result({ok:true,project:PROJECT,region:REGION,component,service:COMPONENTS[component],
      revision:service.latestReadyRevision??null,traffic:service.traffic??[],secretRefs,
      secretStatuses,verifiedAt:new Date().toISOString(),
      note:'Read-only verification. Secret payloads never returned. Unverified does not imply absent.'});
  }catch{return result({ok:false,error:'Cloud verification unavailable; do not infer missing secrets or change traffic.'},503);}
}
