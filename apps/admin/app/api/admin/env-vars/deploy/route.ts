import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { getGoogleServices, getGoogleService } from '@/lib/google/runtime';

export async function POST(req:NextRequest){
 const rateLimited=await applyRateLimit(req,'strict'); if(rateLimited)return rateLimited;
 const auth=await apiRequireAdmin(req); if(auth.error)return auth.error;
 const results=await Promise.all(getGoogleServices().map(async service=>{
   try {const health=await getGoogleService(service);return {service:service.id,status:health.healthy?'healthy':'unhealthy',commit:health.commit};}
   catch(err){return {service:service.id,status:'unreachable',error:(err instanceof Error?err.message:String(err)).slice(0,120)};}
 }));
 const allOk=results.every(r=>r.status==='healthy');
 return NextResponse.json({googleManaged:true,triggered:false,message:'Production deployment is GitHub/Google authoritative. Runtime health was verified; no Northflank build was invoked.',results,userId:auth.id},{status:allOk?200:503});
}
