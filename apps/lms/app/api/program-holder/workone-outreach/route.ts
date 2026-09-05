// pre-auth-registry: exempt - requireProgramHolder verifies the authenticated user before outreach.
import { NextResponse } from 'next/server';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
export async function POST(){
 const ctx=await requireProgramHolder();
 if(ctx.mode!=='holder') return NextResponse.json({error:'Program Holder session required.'},{status:403});
 const {data,error}=await ctx.db.functions.invoke('program-holder-workone-outreach',{body:{}});
 if(error) return NextResponse.json({error:'WorkOne outreach could not be sent.'},{status:502});
 return NextResponse.json(data);
}
