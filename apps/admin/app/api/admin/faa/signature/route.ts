import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime='nodejs';
export const dynamic='force-dynamic';

/** Private signature-image enrollment, not consent for unattended document signing. */
export async function POST(req: NextRequest) {
  const session=await createClient();
  const {data:{user}}=await session.auth.getUser();
  if(!user)return NextResponse.json({error:'Sign-in required'},{status:401});
  const db=await requireAdminClient();
  const {data:profile,error:roleError}=await db.from('profiles').select('role,full_name').eq('id',user.id).maybeSingle();
  if(roleError||!profile||!['admin','super_admin'].includes(profile.role))
    return NextResponse.json({error:'Administrator authorization required'},{status:403});
  let body:unknown;try{body=await req.json();}catch{return NextResponse.json({error:'Invalid request'},{status:400});}
  const input=body as {image?:unknown;consent?:unknown};
  if(input.consent!==true||typeof input.image!=='string'||!/^data:image\/png;base64,[a-z0-9+/=]+$/i.test(input.image)||input.image.length>450000)
    return NextResponse.json({error:'A valid PNG signature and explicit enrollment consent are required'},{status:422});
  const bytes=Buffer.from(input.image.split(',')[1]||'','base64');
  if(bytes.length<100||bytes.length>300000||bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')
    return NextResponse.json({error:'Invalid PNG image'},{status:422});
  const path=`faa-signatures/${user.id}/provider.png`;
  const {error}=await db.storage.from('documents').upload(path,bytes,{contentType:'image/png',upsert:true,cacheControl:'no-cache'});
  if(error)return NextResponse.json({error:'Could not save private signature'},{status:503});
  const {error:auditError}=await db.from('admin_audit_events').insert({
    action:'faa.signature_enrolled',actor_user_id:user.id,actor_role:profile.role,
    target_type:'profiles',target_id:user.id,
    metadata:{purpose:'FAA provider signature only',signature_storage:'private documents',enrolled_at:new Date().toISOString()}
  });
  if(auditError)return NextResponse.json({error:'Signature saved but audit record failed; signing remains blocked pending review'},{status:503});
  return NextResponse.json({ok:true,signatureReady:true,notice:'Signature saved privately. Every FAA still requires your approval to sign.'});
}
