import { NextResponse } from 'next/server';
import { requireCurrentHostShopPartner } from '@/lib/partners/current-host-shop';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let context;
  try {
    context = await requireCurrentHostShopPartner();
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    if (code === 'HOST_SHOP_UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Host Shop access required.' }, { status: 403 });
  }
  const { db, partner } = context;

  const { data: document, error: documentError } = await db
    .from('partner_documents')
    .select('id, partner_id, file_url, storage_bucket')
    .eq('id', id)
    .eq('partner_id', partner.id)
    .maybeSingle();

  if (documentError || !document?.file_url) {
    return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
  }

  const bucket = document.storage_bucket || 'partner-documents';
  const { data: signed, error: signedError } = await db.storage
    .from(bucket)
    .createSignedUrl(document.file_url, 60);

  if (signedError || !signed?.signedUrl) {
    return NextResponse.json({ error: 'Unable to create a secure document link.' }, { status: 500 });
  }

  return NextResponse.json({ url: signed.signedUrl });
}
