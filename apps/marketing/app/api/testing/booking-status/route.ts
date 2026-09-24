// PUBLIC ROUTE: checks provider-neutral paid testing booking fulfillment.
import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { TESTING_CENTER } from '@/lib/testing/testing-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'payment');
  if (rateLimited) return rateLimited;
  const invoiceId = request.nextUrl.searchParams.get('invoice_id')?.trim() || '';
  const email = request.nextUrl.searchParams.get('email')?.trim().toLowerCase() || '';
  if (!invoiceId && !email) return NextResponse.json({ found: false, error: 'Invoice reference or email is required.' }, { status: 400 });
  const admin = await getAdminClient();
  if (!admin) return NextResponse.json({ found: false, error: 'Verification is temporarily unavailable.' }, { status: 503 });

  let query = admin.from('exam_bookings').select('exam_type,exam_name,confirmation_code,payment_status,slot_id,email,provider_invoice_id').eq('payment_status','paid');
  query = invoiceId ? query.eq('provider_invoice_id', invoiceId) : query.eq('email', email).order('created_at',{ascending:false}).limit(10);
  const { data: bookings, error } = await query;
  if (error) return NextResponse.json({ found:false }, { status:500 });
  if (!bookings?.length) return NextResponse.json({ found:false }, { status:202 });

  const slotIds=bookings.map((b:any)=>b.slot_id).filter(Boolean);
  const {data:slots}=slotIds.length?await admin.from('testing_slots').select('id,start_time,end_time,location').in('id',slotIds):{data:[]};
  const map=new Map((slots??[]).map((s:any)=>[s.id,s]));
  const results=bookings.map((b:any)=>{
    const slot=b.slot_id?map.get(b.slot_id):null;
    let googleCalendarUrl=null;
    if(slot?.start_time&&slot?.end_time){
      const fmt=(v:string)=>new Date(v).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
      googleCalendarUrl=`https://calendar.google.com/calendar/render?${new URLSearchParams({action:'TEMPLATE',text:`${b.exam_name} — Elevate Testing Center`,dates:`${fmt(slot.start_time)}/${fmt(slot.end_time)}`,details:`Paid testing appointment. Confirmation code: ${b.confirmation_code}.`,location:slot.location||TESTING_CENTER.address}).toString()}`;
    }
    return {examType:b.exam_type,examName:b.exam_name,confirmationCode:b.confirmation_code,googleCalendarUrl};
  });
  return NextResponse.json({found:true,examName:results[0].examName,confirmationCode:results[0].confirmationCode,googleCalendarUrl:results[0].googleCalendarUrl,bookings:results});
}
