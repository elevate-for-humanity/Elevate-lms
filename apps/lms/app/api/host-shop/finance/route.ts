// pre-auth-registry: exempt - current Host Shop partner is authenticated before every read or write.
import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { requireCurrentHostShopPartner } from '@/lib/partners/current-host-shop';
import { applyRateLimit } from '@/lib/api/withRateLimit';
const TYPES = ['host_shop_invoice', 'host_shop_reimbursement', 'host_shop_billing_correction'];
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  const { db, partner } = await requireCurrentHostShopPartner();
  const result = await db.from('partner_documents').select('id,document_type,file_name,status,notes,created_at')
    .eq('partner_id', partner.id).in('document_type', TYPES).order('created_at', { ascending: false }).limit(30);
  if (result.error) return NextResponse.json({error:'Finance requests could not load.'},{status:503});
  return NextResponse.json({requests:result.data});
}
export async function POST(request: Request) {
  const limited = await applyRateLimit(request, 'strict');
  if (limited) return limited;
  const { db, partner, user } = await requireCurrentHostShopPartner();
  const body = await request.json().catch(() => null);
  const kind = String(body?.kind || ''), reference = String(body?.reference || '').trim();
  const description = String(body?.description || '').trim(), amount = String(body?.amount || '');
  const date = String(body?.date || '');
  if (!TYPES.includes(kind) || reference.length < 1 || reference.length > 120 ||
      description.length < 10 || description.length > 2000 ||
      !/^\d{1,7}(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) ||
      new Date(date).toISOString().slice(0,10) !== date || body?.attested !== true)
    return NextResponse.json({error:'Complete the reference, valid date, positive amount, description, and certification.'},{status:400});
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF();
  pdf.setFontSize(16); pdf.text('Host Shop finance request',15,20); pdf.setFontSize(11);
  let y=32;
  for (const line of [
    'Shop: '+partner.name, 'Type: '+kind, 'Reference: '+reference, 'Date: '+date,
    'Amount requested (USD): '+Number(amount).toFixed(2), 'Details: '+description,
    'Submitted by authenticated account: '+user.id, 'Submitted: '+new Date().toISOString(),
    'Request for Admin review. Not an approved charge, reimbursement, or payment.',
  ]) {
    for (const wrapped of pdf.splitTextToSize(line,180)) {
      if(y>275){pdf.addPage();y=20;} pdf.text(wrapped,15,y); y+=6;
    } y+=3;
  }
  const id=randomUUID(), path=partner.id+'/finance/'+id+'.pdf', bytes=pdf.output('arraybuffer');
  const uploaded=await db.storage.from('partner-documents').upload(path,bytes,{contentType:'application/pdf',upsert:false});
  if(uploaded.error)return NextResponse.json({error:'Finance request file could not be saved.'},{status:500});
  const saved=await db.from('partner_documents').insert({
    id,partner_id:partner.id,document_type:kind,display_name:reference,file_name:reference+'.pdf',
    file_url:path,file_type:'application/pdf',file_size:bytes.byteLength,storage_bucket:'partner-documents',status:'pending',
  }).select('id,status').single();
  if(saved.error||!saved.data){
    await db.storage.from('partner-documents').remove([path]);
    return NextResponse.json({error:'Finance request record could not be saved.'},{status:500});
  }
  return NextResponse.json({request:saved.data},{status:201});
}
