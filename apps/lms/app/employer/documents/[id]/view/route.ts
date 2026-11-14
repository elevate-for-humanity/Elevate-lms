import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resolveDocumentStorageLocator } from '@/lib/admin/document-record';
export const dynamic = 'force-dynamic';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireRole(['employer', 'sponsor']);
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))
    return new NextResponse('Document not found', { status: 404 });
  const db = await createClient();
  // Both RLS and an explicit owner predicate must pass before using privileged storage.
  const { data: doc, error } = await db
    .from('documents')
    .select('id,user_id,file_path,file_url,metadata')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) return new NextResponse('Document access is temporarily unavailable', { status: 503 });
  if (!doc) return new NextResponse('Document not found', { status: 404 });
  const locator = resolveDocumentStorageLocator(doc);
  if (!locator || locator.bucket !== 'documents' || !locator.path.startsWith(`${user.id}/`))
    return new NextResponse('File is not available. Please contact Elevate.', { status: 404 });
  const admin = await requireAdminClient();
  const { data, error: signedError } = await admin.storage
    .from(locator.bucket)
    .createSignedUrl(locator.path, 60);
  if (signedError || !data?.signedUrl)
    return new NextResponse('File could not be opened. Please retry.', { status: 503 });
  return NextResponse.redirect(data.signedUrl, {
    headers: { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' },
  });
}
