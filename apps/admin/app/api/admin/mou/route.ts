import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
export const dynamic = 'force-dynamic';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const clean = (v:unknown,max:number) => typeof v === 'string' ? v.trim().slice(0,max) : '';
function contentError(title:string,content:string) {
  if (!title || content.length < 200) return 'Enter a title and the complete agreement text. A short introduction or blank template cannot be issued as an agreement.';
  if (/\{\{[^}]+\}\}|\[(?:insert|partner name|company name|program holder name|signer name)[^\]]*\]/i.test(content)) return 'Complete the named parties and all placeholder fields before saving this agreement.';
  return null;
}
function reply(body:unknown,status=200) { return NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}}); }
export async function POST(request:NextRequest) {
  const limited=await applyRateLimit(request,'strict');if(limited)return limited;
  const auth=await apiRequireAdmin(request);if(auth.error)return auth.error;
  const body=await request.json().catch(()=>null);
  if(body?.action!=='create'||!uuid.test(body?.partner_id||''))return reply({error:'Select an existing partner before creating an agreement.'},400);
  const db=await requireAdminClient();
  const {data:partner,error:partnerError}=await db.from('partners').select('id,name').eq('id',body.partner_id).maybeSingle();
  if(partnerError)return reply({error:'Partner lookup is unavailable.'},503);
  if(!partner)return reply({error:'Partner not found.'},404);
  let title=clean(body.title,250),content=clean(body.content,100000),templateId:null|string=null;
  if(body.template_id){
    if(!uuid.test(body.template_id))return reply({error:'Invalid template.'},400);
    const {data:template,error}=await db.from('mou_templates').select('id,name,title,content').eq('id',body.template_id).eq('is_active',true).maybeSingle();
    if(error)return reply({error:'Template lookup is unavailable.'},503);
    if(!template)return reply({error:'Template not found.'},404);
    title=clean(template.title||template.name,250);content=clean(template.content,100000);templateId=template.id;
  }
  if ((typeof body.content === 'string' && body.content.length > 100000) || (typeof body.title === 'string' && body.title.length > 250)) return reply({error:'The title or agreement exceeds the supported size. Split large attachments into separate documents.'},400);
  const invalid=contentError(title,content);if(invalid)return reply({error:invalid},400);
  const expiry=clean(body.expiry_date,10)||null;
  if(expiry&&(!/^\d{4}-\d{2}-\d{2}$/.test(expiry)||!Number.isFinite(Date.parse(expiry+'T12:00:00Z'))||new Date(expiry+'T12:00:00Z').toISOString().slice(0,10)!==expiry))return reply({error:'Enter a valid expiry date.'},400);
  const {data:mou,error}=await db.from('partner_mous').insert({partner_id:partner.id,status:'pending',mou_version:'draft-1',expiry_date:expiry,terms:{title,content,template_id:templateId,partner_name:partner.name,partner_email:clean(body.partner_email,254)||null,draft:true,created_by:auth.userId,document_hash:createHash('sha256').update(content).digest('hex')}}).select('id,partner_id,mou_version,status,expiry_date,created_at,terms').single();
  if(error||!mou)return reply({error:'The agreement could not be saved. Please retry.'},503);
  return reply({mou:{...mou,partners:{name:partner.name}},emailSent:false,message:'Agreement draft saved for review. No signature or delivery is recorded.'},201);
}
export async function PATCH(request:NextRequest) {
  const limited=await applyRateLimit(request,'strict');if(limited)return limited;
  const auth=await apiRequireAdmin(request);if(auth.error)return auth.error;
  const body=await request.json().catch(()=>null);
  if(!uuid.test(body?.id||'')||!body.updated_at)return reply({error:'A current agreement record is required.'},400);
  const db=await requireAdminClient();
  const {data:existing,error:lookupError}=await db.from('partner_mous').select('id,status,signed_at,terms,updated_at').eq('id',body.id).maybeSingle();
  if(lookupError)return reply({error:'Agreement lookup is unavailable.'},503);
  if(!existing)return reply({error:'Agreement not found.'},404);
  if(existing.status!=='pending'||existing.signed_at)return reply({error:'Executed or issued agreements cannot be edited. Preserve the original and create a new draft.'},409);
  if ((typeof body.content === 'string' && body.content.length > 100000) || (typeof body.title === 'string' && body.title.length > 250)) return reply({error:'Agreement content exceeds the supported size.'},400);
  const title=clean(body.title,250),content=clean(body.content,100000),invalid=contentError(title,content);if(invalid)return reply({error:invalid},400);
  const {data,error}=await db.from('partner_mous').update({terms:{...(existing.terms||{}),title,content,draft:true,updated_by:auth.userId,document_hash:createHash('sha256').update(content).digest('hex')},updated_at:new Date().toISOString()}).eq('id',body.id).eq('status','pending').is('signed_at',null).eq('updated_at',body.updated_at).select('id').maybeSingle();
  if(error)return reply({error:'Agreement changes could not be saved.'},503);
  if(!data)return reply({error:'This agreement changed while you were editing. Reload before saving.'},409);
  return reply({success:true});
}
