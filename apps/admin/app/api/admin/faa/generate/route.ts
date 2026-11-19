import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { FAA_PROGRAMS, faaEndDate, faaTotalCents } from '@/lib/workone/faa-programs.mjs';
import { createFaaPdf } from '@/lib/workone/faa-pdf.mjs';

export const dynamic='force-dynamic';
export const runtime='nodejs';

export async function POST(req: NextRequest) {
  const session=await createClient();
  const {data:{user},error:sessionError}=await session.auth.getUser();
  if(sessionError||!user)return NextResponse.json({error:'Authentication required'},{status:401});
  const db=await requireAdminClient();
  const {data:actor,error:actorError}=await db.from('profiles').select('role,full_name,is_active,suspended,status').eq('id',user.id).maybeSingle();
  if(actorError||!actor||(!['admin','super_admin'].includes(actor.role)||actor.is_active===false||actor.suspended===true||['suspended','disabled','inactive','banned'].includes(String(actor.status||'').toLowerCase())))
    return NextResponse.json({error:'Administrator approval required'},{status:403});
  let data:unknown;try{data=await req.json();}catch{return NextResponse.json({error:'Invalid JSON'},{status:400});}
  const input=data as {studentId?:unknown;programKey?:unknown;startDate?:unknown;sign?:unknown;approved?:unknown;confirmName?:unknown;providerName?:unknown;intent?:unknown};
  const studentId=typeof input.studentId==='string'?input.studentId:'';
  const programKey=typeof input.programKey==='string'?input.programKey:'';
  const startDate=typeof input.startDate==='string'?input.startDate:'';
  const program=FAA_PROGRAMS[programKey as keyof typeof FAA_PROGRAMS];
  if(!/^[a-f0-9-]{36}$/i.test(studentId)||!program)
    return NextResponse.json({error:'Existing student and approved template are required'},{status:422});
  let endDate:string;
  try{endDate=faaEndDate(startDate,program.weeks);}catch{return NextResponse.json({error:'Invalid training start date'},{status:422});}
  const {data:student,error:studentError}=await db.from('profiles').select('id,full_name,first_name,last_name,phone,email,role').eq('id',studentId).maybeSingle();
  if(studentError||!student||!['student','learner','apprentice','barber_apprentice','cosmetology_apprentice'].includes(String(student.role)))
    return NextResponse.json({error:'Student record not found or is not a learner'},{status:404});
  const name=student.full_name||[student.first_name,student.last_name].filter(Boolean).join(' ');
  if(!name)return NextResponse.json({error:'Student name must be verified first'},{status:409});
  // The owner authorizes use of her saved signature when she deliberately
  // finalizes an FAA in an authenticated admin session; drafts stay unsigned.
  const sign=input.intent==='finalize';
  if(input.intent!=='finalize'&&input.intent!=='draft')
    return NextResponse.json({error:'Specify draft or finalize intent'},{status:422});
  const providerName=typeof input.providerName==='string'?input.providerName.trim():'';
  if(providerName.length<4||providerName.length>100)
    return NextResponse.json({error:'A valid provider contact name is required'},{status:422});
  let signaturePng:Uint8Array|null=null;
  let legalSigner=providerName;
  if(sign){
    if(input.approved!==true)
      return NextResponse.json({error:'Explicit administrator finalization approval required'},{status:422});
    const {data:meta,error:metaError}=await db.storage.from('documents').download(`faa-signatures/${user.id}/provider.json`);
    if(metaError||!meta)return NextResponse.json({error:'Your legal signature identity has not been registered'},{status:409});
    let stored:{actor_id?:string;signer_name?:string;signature_path?:string;image_id?:string};
    try{stored=JSON.parse(await meta.text());}catch{return NextResponse.json({error:'Saved signature identity is invalid'},{status:409});}
    if(stored.actor_id!==user.id||!stored.signer_name||
      stored.signer_name!==providerName)
      return NextResponse.json({error:'Signature owner and legal name confirmation do not match'},{status:403});
    if(!stored.image_id||!/^[0-9a-f-]{36}$/i.test(stored.image_id)||
      stored.signature_path!==`faa-signatures/${user.id}/images/${stored.image_id}.png`)
      return NextResponse.json({error:'Signature binding validation failed'},{status:409});
    legalSigner=stored.signer_name;
    const {data:image,error:signatureError}=await db.storage.from('documents').download(stored.signature_path);
    if(signatureError||!image)return NextResponse.json({error:'Save your signature image first; the FAA has not been signed'},{status:409});
    signaturePng=new Uint8Array(await image.arrayBuffer());
  }
  const now=new Date().toISOString();
  let bytes:Uint8Array;
  try{bytes=await createFaaPdf({
    student:{id:student.id,name,phone:student.phone,email:student.email},
    program,startDate,actorName:legalSigner,signaturePng,signedAt:sign?now:null
  });}catch{return NextResponse.json({error:'FAA PDF generation failed; no document was signed'},{status:500});}
  const documentId=randomUUID();
  const path=`faa/${student.id}/${documentId}.pdf`;
  // Immutable snapshots: never overwrite earlier versions, even for a corrected FAA.
  const {error:uploadError}=await db.storage.from('documents').upload(path,bytes,{contentType:'application/pdf',upsert:false});
  if(uploadError)return NextResponse.json({error:'Unable to store FAA securely; nothing submitted'},{status:503});
  const {error:recordError}=await db.from('student_binder_documents').insert({
    student_id:student.id,document_type:'funding_documents',
    title:`FAA ${programKey} ${startDate} ${documentId.slice(0,8)}`,
    file_url:path,status:'uploaded',uploaded_by:user.id,
    notes:sign?`Provider signed ${now}; WorkOne approval pending; draft award only.`:
      'Draft — unsigned. Proposed training costs; WorkOne approval pending.'
  });
  if(recordError){
    await db.storage.from('documents').remove([path]);
    return NextResponse.json({error:'Document indexing failed; no FAA was finalized'},{status:503});
  }
  const {error:auditError}=await db.from('admin_audit_events').insert({
    action:sign?'faa.signed':'faa.draft_generated',actor_user_id:user.id,actor_role:actor.role,
    target_type:'profiles',target_id:student.id,
    metadata:{documentId,path,programKey,startDate,endDate,amount_cents:faaTotalCents(program),
      status:sign?'signed_by_provider':'unsigned_draft',signed_at:sign?now:null,
      funding_approved:false,signatureConsent:sign===true,signaturePolicy:'admin_explicit_finalize_only'}
  });
  if(auditError) {
    // The document is preserved for recovery, but don't claim a completed signing
    // transaction when the independent audit receipt could not be recorded.
    return NextResponse.json({error:'FAA saved to private storage but audit logging failed; contact administrator before using'},{status:503});
  }
  const safeName=name.replace(/[^a-zA-Z0-9-]/g,'_').slice(0,60);
  return new NextResponse(Buffer.from(bytes),{
    status:200,
    headers:{
      'Content-Type':'application/pdf',
      'Content-Disposition':`attachment; filename="FAA_${safeName}_${startDate}_${sign?'signed':'draft'}.pdf"`,
      'Cache-Control':'private, no-store',
      'X-FAA-Document-Id':documentId,
      'X-FAA-Status':sign?'signed-by-provider':'unsigned-draft'
    }
  });
}
