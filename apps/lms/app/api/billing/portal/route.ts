import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { applyRateLimit } from '@/lib/api/withRateLimit';

async function _POST(req:NextRequest){
 const limited=await applyRateLimit(req,'payment'); if(limited) return limited;
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser();
 if(!user) return NextResponse.json({error:'Authentication required'},{status:401});
 return NextResponse.json({url:'/lms/settings/billing',provider:'elevate'});
}
export const POST=withApiAudit('/api/billing/portal',_POST);
