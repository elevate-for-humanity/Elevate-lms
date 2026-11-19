import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { PDFDocument } from 'pdf-lib';
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
  const {data:profile,error:roleError}=await db.from('profiles').select('role,full_name,is_active,suspended,status').eq('id',user.id).maybeSingle();
  if(roleError||!profile||(!['admin','super_admin'].includes(profile.role)||profile.is_active===false||profile.suspended===true||['suspended','disabled','inactive','banned'].includes(String(profile.status||'').toLowerCase())))
    return NextResponse.json({error:'Administrator authorization required'},{status:403});
  let body:unknown;try{body=await req.json();}catch{return NextResponse.json({error:'Invalid request'},{status:400});}
  const input=body as {image?:unknown;consent?:unknown;signerName?:unknown};
  const signerName=typeof input.signerName==='string'?input.signerName.trim():'';
  if(signerName.length<4||signerName.length>100||!/^[\p{L} .'-]+$/u.test(signerName))
    return NextResponse.json({error:'Enter your legal signer name before saving your signature'},{status:422});
  if(input.consent!==true||typeof input.image!=='string'||!/^data:image\/png;base64,[a-z0-9+/=]+$/i.test(input.image)||input.image.length>450000)
    return NextResponse.json({error:'A valid PNG signature and explicit enrollment consent are required'},{status:422});
  const bytes=Buffer.from(input.image.split(',')[1]||'','base64');
  if(bytes.length<100||bytes.length>300000||bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')
    return NextResponse.json({error:'Invalid PNG image'},{status:422});
  // Immutable image versions prevent a failed upload from replacing an
  // already approved signature. Update the active pointer only after audit.
  // PNG IHDR dimensions must be bounded before pdf-lib decodes the signature.
  const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
  if(width<1||height<1||width>4096||height>4096||width*height>4000000)
    return NextResponse.json({error:'Signature PNG dimensions are not supported'},{status:422});
  // Decode with the same PNG implementation used by FAA generation.
  try {
    const validationPdf = await PDFDocument.create();
    await validationPdf.embedPng(bytes);
  } catch {
    return NextResponse.json({error:'Choose a valid, non-animated PNG signature'},{status:422});
  }
  const imageId=randomUUID();
  const path=`faa-signatures/${user.id}/images/${imageId}.png`;
  const {error}=await db.storage.from('documents').upload(path,bytes,{contentType:'image/png',upsert:false,cacheControl:'no-cache'});
  if(error)return NextResponse.json({error:'Could not store private signature'},{status:503});
  const {error:auditError}=await db.from('admin_audit_events').insert({
    action:'faa.signature_enrolled',actor_user_id:user.id,actor_role:profile.role,
    target_type:'profiles',target_id:user.id,
    metadata:{purpose:'FAA provider signature only',signer_name:signerName,
      image_id:imageId,path,signature_storage:'private documents',enrolled_at:new Date().toISOString()}
  });
  if(auditError) {
    await db.storage.from('documents').remove([path]);
    return NextResponse.json({error:'Signature audit record failed; no new signature was activated'},{status:503});
  }
  const metaPath=`faa-signatures/${user.id}/provider.json`;
  const {error:metadataError}=await db.storage.from('documents').upload(
    metaPath,JSON.stringify({signer_name:signerName,actor_id:user.id,signature_path:path,
      image_id:imageId,enrolled_at:new Date().toISOString()}),
    {contentType:'application/json',upsert:true,cacheControl:'no-cache'});
  if(metadataError)return NextResponse.json({error:'Signature image saved, but active signature binding was not updated'},{status:503});
  return NextResponse.json({ok:true,signatureReady:true,signerName,notice:'Signature saved privately. Every FAA still requires your approval to sign.'});
}
