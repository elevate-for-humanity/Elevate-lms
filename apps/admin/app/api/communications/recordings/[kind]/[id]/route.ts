import {NextResponse} from 'next/server';
import {requireRole} from '@/lib/auth/require-role';
import {requireAdminClient} from '@/lib/supabase/admin';
import {PHONE_MANAGER_ROLES} from '@/lib/phone/access';
import {loadPhoneRecording} from '@/lib/phone/recordings';
import {resolvePhoneInboxScope} from '../../../../../phone/inbox/data';
export const dynamic='force-dynamic';
export async function GET(_request:Request,{params}:{params:Promise<{kind:string;id:string}>}) {
 const {kind,id}=await params;
 if(!['call','callback','voicemail'].includes(kind)||! /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))return NextResponse.json({error:'Recording not found.'},{status:404});
 const auth=await requireRole(PHONE_MANAGER_ROLES);const db=await requireAdminClient();const scope=await resolvePhoneInboxScope(db,auth);
 if(!scope.systemId)return NextResponse.json({error:'Recording not found.'},{status:404});
 const table=kind==='call'?'phone_calls':kind==='callback'?'phone_callback_tasks':'voicemails';
 let query=db.from(table).select(kind==='callback'?'recording_url,call_id,call:phone_calls!inner(phone_system_id)':kind==='call'?'recording_url':'recording_url,call_id').eq('id',id);
 query=kind==='callback'?query.eq('call.phone_system_id',scope.systemId):query.eq('phone_system_id',scope.systemId);
 if(scope.profileId)query=query.eq('assigned_profile_id',scope.profileId);
 const {data,error}=await query.maybeSingle();
 if(error)return NextResponse.json({error:'Recording lookup is unavailable.'},{status:503});
 if(!data?.recording_url)return NextResponse.json({error:'Recording not found.'},{status:404});
 try{return await loadPhoneRecording(data.recording_url,{db,callId:kind==='call'?id:data.call_id});}catch{return NextResponse.json({error:'Recording audio is unavailable.'},{status:502,headers:{'Cache-Control':'private, no-store'}});}
}
