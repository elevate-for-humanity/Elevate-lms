import { NextRequest } from 'next/server';
import { buildCapabilityHealth } from '@/lib/devstudio/capability-health';
import { capabilityHealthResponse } from '@/lib/devstudio/health-response';
import { getGoogleServices, getGoogleService } from '@/lib/google/runtime';
export const runtime='nodejs'; export const dynamic='force-dynamic';
export async function GET(request:NextRequest){return capabilityHealthResponse(request,async()=>{
 const checks=await Promise.all(getGoogleServices().map(async s=>{try{const h=await getGoogleService(s);return {name:'google-'+s.key,passed:h.healthy,required:true,message:h.healthy?s.label+' healthy':s.label+' unhealthy'};}catch{return {name:'google-'+s.key,passed:false,required:true,message:s.label+' unreachable'};}}));
 return buildCapabilityHealth('containers',checks);
});}