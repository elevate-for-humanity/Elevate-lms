import { NextRequest } from 'next/server';
import { buildCapabilityHealth } from '@/lib/devstudio/capability-health';
import { capabilityHealthResponse } from '@/lib/devstudio/health-response';
import { getGoogleServices,getGoogleService } from '@/lib/google/runtime';
export const runtime='nodejs'; export const dynamic='force-dynamic';
export async function GET(request:NextRequest){return capabilityHealthResponse(request,async()=>{
 const services=getGoogleServices(); const results=await Promise.all(services.map(async s=>{try{return (await getGoogleService(s)).healthy}catch{return false}}));
 return buildCapabilityHealth('deployments',[
 {name:'github-integration',passed:Boolean(process.env.GITHUB_TOKEN||process.env.GH_TOKEN||process.env.GITHUB_PERSONAL_ACCESS_TOKEN),required:true,message:'GitHub deployment credentials checked.'},
 {name:'google-services',passed:results.every(Boolean),required:true,message:results.filter(Boolean).length+'/'+services.length+' Google production services healthy.'}
 ]);
});}