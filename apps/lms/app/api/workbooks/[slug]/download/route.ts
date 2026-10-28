import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };
export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,100}$/.test(slug)) return NextResponse.json({ error: 'Workbook unavailable.' }, { status: 404, headers });
  const db = await createClient();
  const { data: { user }, error: authError } = await db.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Please sign in to open your workbook.' }, { status: 401, headers });
  // Session RLS verifies enrollment or this account's paid, active entitlement.
  // Never accept an object path or user identity from the request.
  const book = await db.from('digital_workbooks').select('id,pdf_storage_path').eq('slug', slug).eq('is_active', true).maybeSingle();
  if (book.error) return NextResponse.json({ error: 'Workbook access could not be verified.' }, { status: 503, headers });
  if (!book.data?.pdf_storage_path) return NextResponse.json({ error: 'Workbook unavailable for this account.' }, { status: 404, headers });
  const admin = await requireAdminClient();
  const file = await admin.storage.from('documents').download(book.data.pdf_storage_path);
  if (file.error || !file.data) return NextResponse.json({ error: 'The workbook file could not be loaded. Please retry.' }, { status: 503, headers });
  return new NextResponse(await file.data.arrayBuffer(), {
    headers: { ...headers, 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${slug}-workbook.pdf"` },
  });
}
