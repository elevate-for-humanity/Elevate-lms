import { NextRequest,NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { getGoogleServices,getGoogleService,googleProjectId } from '@/lib/google/runtime';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function GET(request:NextRequest){const rl=await applyRateLimit(request,'api');if(rl)return rl;const auth=await apiRequireDevStudio(request);if(auth.error)return auth.error;
 const services=await Promise.all(getGoogleServices().map(async s=>{try{const h=await getGoogleService(s);return {name:s.id,status:h.status,runningCount:h.healthy?1:0,desiredCount:1,pendingCount:0,deployBranch:'main',lastDeployedAt:null,healthy:h.healthy,providerStatus:'google-cloud',healthStatus:h.healthy?200:503,commit:h.commit};}catch{return {name:s.id,status:'unreachable',runningCount:0,desiredCount:1,pendingCount:0,deployBranch:'main',lastDeployedAt:null,healthy:false,providerStatus:'google-cloud',healthStatus:null};}}));
 return NextResponse.json({cluster:'google:'+googleProjectId(),provider:'google-cloud',services,fetchedAt:new Date().toISOString()});}