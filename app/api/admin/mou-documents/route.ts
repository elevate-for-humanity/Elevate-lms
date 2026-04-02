import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authGuards';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeDbError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  await requireAdmin();
  const db = createAdminClient();
  const { data, error } = await db.from('mou_documents').select('*').order('updated_at', { ascending: false });
  if (error) return safeDbError(error, 'Failed to fetch MOU documents');
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  await requireAdmin();
  const db = createAdminClient();
  const body = await request.json().catch(() => null);
  if (!body?.title) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }
  const { data, error } = await db
    .from('mou_documents')
    .insert({
      title: body.title,
      organization_name: body.organization_name ?? null,
      document_status: body.document_status ?? 'draft',
      effective_date: body.effective_date ?? null,
      expiration_date: body.expiration_date ?? null,
      file_url: body.file_url ?? null,
      external_document_id: body.external_document_id ?? null,
      notes: body.notes ?? null,
    })
    .select()
    .single();
  if (error) return safeDbError(error, 'Failed to create MOU document');
  return NextResponse.json({ data }, { status: 201 });
}
