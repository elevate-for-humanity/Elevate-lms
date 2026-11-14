import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic='force-dynamic';
export async function GET(request:NextRequest){
  const limited=await applyRateLimit(request,'public'); if(limited) return limited;
  const slug=request.nextUrl.searchParams.get('slug')?.trim()||'';
  if(!/^[a-z0-9-]{2,100}$/.test(slug)) return NextResponse.json({error:'Invalid program.'},{status:400});
  const db=await requireAdminClient();
  const {data,error}=await db.from('programs').select('id,slug,title,status,total_cost').eq('slug',slug).eq('status','active').maybeSingle();
  if(error||!data) return NextResponse.json({error:'Program not found.'},{status:404});
  return NextResponse.json(data);
}
