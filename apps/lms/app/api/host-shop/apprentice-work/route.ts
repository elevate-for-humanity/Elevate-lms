// pre-auth-registry: exempt - requireRole plus the active Host Shop board proves placement ownership before mutations.
import {NextResponse} from 'next/server';
import {requireRole} from '@/lib/auth/require-role';
import {HOST_SHOP_ROLES} from '@/lib/rbac/role-matrix';
import {getHostShopBoard} from '@/lib/partner/board';
import {requireAdminClient} from '@/lib/supabase/admin';

export async function POST(req:Request) {
  const {user,effectiveRoles}=await requireRole(HOST_SHOP_ROLES);
  const board=await getHostShopBoard(user.id);
  const body=await req.json().catch(()=>null);
  const placementId=String(body?.placementId||'');
  const kind=String(body?.kind||'');
  const placement=board.apprentices.find((item:any)=>item.id===placementId);
  if(!placement || !board.shops.some((shop:any)=>shop.id===placement.shop_id)) return NextResponse.json({error:'Choose an assigned apprentice.'},{status:403});
  const isAdmin=effectiveRoles.some((role:string)=>['admin','super_admin','org_admin'].includes(role));
  if(!isAdmin && placement.program_slug==='barber-apprenticeship' && placement.supervisor_user_id!==user.id)
    return NextResponse.json({error:'Assigned supervisor required.'},{status:403});
  const db=await requireAdminClient();
  if(kind==='schedule') {
    const start=String(body?.startsAt||''),end=String(body?.endsAt||'');
    const first=Date.parse(start),last=Date.parse(end);
    if(!Number.isFinite(first)||!Number.isFinite(last)||last<=first||last-first>86400000||last<Date.now()-86400000)
      return NextResponse.json({error:'Choose a valid start and end time, no more than 24 hours apart.'},{status:400});
    const {error}=await db.from('host_shop_apprentice_shift_plans').insert({
      partner_id:board.partner.id,shop_id:placement.shop_id,placement_id:placement.id,
      student_id:placement.student_id,starts_at:new Date(first).toISOString(),
      ends_at:new Date(last).toISOString(),work_type:'salon_practice',created_by:user.id
    });
    return error?NextResponse.json({error:'Could not save schedule. Confirm that the schedule migration is installed.'},{status:500}):NextResponse.json({ok:true},{status:201});
  }
  if(kind==='hours') {
    const date=String(body?.date||''),hours=Number(body?.hours),notes=String(body?.notes||'').trim();
    if(body?.attested!==true||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T00:00:00Z'))||
      date>new Date().toISOString().slice(0,10)||!Number.isFinite(hours)||hours<0.25||hours>24||
      Math.round(hours*4)!==hours*4||notes.length<10||notes.length>2000)
      return NextResponse.json({error:'Check the attestation, date, hours and work description.'},{status:400});
    const {error}=await db.from('hour_entries').insert({
      user_id:placement.student_id,host_shop_id:placement.shop_id,program_slug:placement.program_slug,
      source_type:'host_shop',work_date:date,hours_claimed:hours,accepted_hours:0,
      entered_by_email:user.email||'',status:'pending',approval_status:'pending',notes,
      category:'salon_practical_training',submitted_by_partner:true
    });
    return error?NextResponse.json({error:'Unable to submit hours for review.'},{status:500}):NextResponse.json({ok:true},{status:201});
  }
  return NextResponse.json({error:'Unsupported submission.'},{status:400});
}
