// pre-auth-registry: exempt - requireProgramHolder verifies the authenticated user before outreach.
import { NextResponse } from 'next/server';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import { hydrateProcessEnv } from '@/lib/secrets';
import { sendEmail } from '@/lib/email/sendgrid';
import { programHolderWorkOneEmail } from '@/lib/email/templates/program-holder-workone';
import { WORKONE_INDY_BOOKING_URL } from '@/lib/workone/booking';
export async function POST(){
 const ctx=await requireProgramHolder();
 if(ctx.mode!=='holder') return NextResponse.json({error:'Program Holder session required.'},{status:403});
 await hydrateProcessEnv();
 const key=process.env.SENDGRID_API_KEY;
 if(!key) return NextResponse.json({error:'SendGrid is not configured.'},{status:503});
 const {data:rows,error}=await ctx.db.from('program_holder_students').select('id,program_id,applicant_name,applicant_email,call_notes').eq('program_holder_id',ctx.holderId).in('status',['applied','pending']).order('created_at');
 if(error) return NextResponse.json({error:'Applicant queue could not be loaded.'},{status:500});
 const {data:programs,error:programError}=ctx.programIds.length
  ? await ctx.db.from('programs').select('id,title').in('id',ctx.programIds)
  : {data:[],error:null};
 if(programError) return NextResponse.json({error:'Assigned programs could not be loaded.'},{status:500});
 const titles=new Map<string,string>((programs||[]).map((program:{id:string;title:string})=>[program.id,program.title]));
 let sent=0, failed=0, noteFailures=0;
 for(const row of rows||[]){
  const programTitle=titles.get(row.program_id);
  if(!row.applicant_email || !programTitle?.trim()){failed++;continue}
  const content=programHolderWorkOneEmail({applicantName:String(row.applicant_name||''),programTitle,bookingUrl:WORKONE_INDY_BOOKING_URL});
  const response=await sendEmail({to:row.applicant_email,...content,replyTo:'admissions@elevateforhumanity.org'});
  if(response.success){
   sent++;
   const {error:noteError}=await ctx.db.from('program_holder_students').update({call_notes:[row.call_notes,`WorkOne status email accepted ${new Date().toISOString()}`].filter(Boolean).join('\n')}).eq('id',row.id).eq('program_holder_id',ctx.holderId);
   if(noteError) noteFailures++;
  }else failed++;
 }
 return NextResponse.json({total:(rows||[]).length,sent,failed,noteFailures});
}
