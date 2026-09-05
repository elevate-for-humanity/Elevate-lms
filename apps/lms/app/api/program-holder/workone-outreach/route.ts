// pre-auth-registry: exempt - requireProgramHolder verifies the authenticated user before outreach.
import { NextResponse } from 'next/server';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import { hydrateProcessEnv } from '@/lib/secrets';
export async function POST(){
 const ctx=await requireProgramHolder();
 if(ctx.mode!=='holder') return NextResponse.json({error:'Program Holder session required.'},{status:403});
 await hydrateProcessEnv();
 const key=process.env.SENDGRID_API_KEY;
 if(!key) return NextResponse.json({error:'SendGrid is not configured.'},{status:503});
 const {data:rows,error}=await ctx.db.from('program_holder_students').select('id,applicant_name,applicant_email,call_notes').eq('program_holder_id',ctx.holderId).in('status',['applied','pending']).order('created_at');
 if(error) return NextResponse.json({error:'Applicant queue could not be loaded.'},{status:500});
 let sent=0, failed=0;
 for(const row of rows||[]){
  if(!row.applicant_email){failed++;continue}
  const first=String(row.applicant_name||'there').trim().split(/\s+/)[0];
  const html=`<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto"><h1 style="color:#b91c1c">Action required: Contact WorkOne</h1><p>Hi ${first},</p><p>To continue your HVAC training enrollment with Elevate for Humanity and INDY ON DEMAND SERVICES LLC, please complete the WorkOne online appointment/application process.</p><p><a href="https://airtable.com/shrmuBgK9tXKmAS4r/tblUEPp3TAbK1YfQP?blocks=hide" style="display:inline-block;background:#1d4ed8;color:white;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Complete the WorkOne appointment form</a></p><p>Official Indiana WorkOne information: <a href="https://www.in.gov/dwd/job-seekers/">Indiana DWD Job Seeker Services</a>.</p><p>After scheduling, reply to this email or call Elevate for Humanity at 317-314-3757 so your enrollment record can be updated.</p><p>Thank you,<br>Elevate for Humanity</p></div>`;
  const response=await fetch('https://api.sendgrid.com/v3/mail/send',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({personalizations:[{to:[{email:row.applicant_email}]}],from:{email:'info@elevateforhumanity.org',name:'Elevate for Humanity'},reply_to:{email:'elevate4humanityedu@gmail.com'},subject:'Action required: Complete your WorkOne appointment for HVAC training',content:[{type:'text/html',value:html}]})});
  if(response.ok){sent++;await ctx.db.from('program_holder_students').update({call_notes:[row.call_notes,`WorkOne appointment email sent ${new Date().toISOString()}`].filter(Boolean).join('\n')}).eq('id',row.id).eq('program_holder_id',ctx.holderId)}else failed++;
 }
 return NextResponse.json({total:(rows||[]).length,sent,failed});
}
