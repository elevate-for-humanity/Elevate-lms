import { NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';
export async function GET(request: Request, {params}: {params: Promise<{id:string}>}) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  const {id} = await params;
  const db = await requireAdminClient();
  const result = await db.from('partner_documents').select('file_url,storage_bucket')
    .eq('id',id).in('document_type',['host_shop_invoice','host_shop_reimbursement','host_shop_billing_correction']).maybeSingle();
  if (result.error || !result.data?.file_url) return NextResponse.json({error:'Request not found.'},{status:404});
  const signed = await db.storage.from(result.data.storage_bucket || 'partner-documents').createSignedUrl(result.data.file_url,60);
  if (signed.error || !signed.data?.signedUrl) return NextResponse.json({error:'Document could not open.'},{status:503});
  return NextResponse.redirect(signed.data.signedUrl,303);
}
