import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const db = await requireAdminClient();
  const { data: partnerLink } = await db
    .from('partner_users')
    .select('partner_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (!partnerLink?.partner_id) {
    return NextResponse.json({ error: 'Host Shop access required.' }, { status: 403 });
  }

  const { data: document, error: documentError } = await db
    .from('partner_documents')
    .select('id, partner_id, file_url, storage_bucket')
    .eq('id', id)
    .eq('partner_id', partnerLink.partner_id)
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
