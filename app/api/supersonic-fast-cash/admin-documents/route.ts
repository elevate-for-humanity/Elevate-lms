import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET — list all uploaded tax documents (admin only)
export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);

  const admin = createAdminClient();
  if (!admin) return safeInternalError(new Error('Admin client unavailable'), 'Service unavailable');

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');
  const status = searchParams.get('status');

  let query = admin
    .from('tax_documents')
    .select('id, user_id, document_type, file_name, file_size, file_url, status, tax_year, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (userId) query = query.eq('user_id', userId);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return safeInternalError(error, 'Failed to fetch documents');

  return NextResponse.json({ documents: data ?? [] });
}

// PATCH — mark a document as reviewed
export async function PATCH(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);

  let body: { id?: string; status?: string };
  try { body = await request.json(); } catch { return safeError('Invalid request body', 400); }

  const { id, status } = body;
  if (!id) return safeError('Document ID required', 400);
  if (!['reviewed', 'pending_review', 'rejected'].includes(status ?? '')) return safeError('Invalid status', 400);

  const admin = createAdminClient();
  if (!admin) return safeInternalError(new Error('Admin client unavailable'), 'Service unavailable');

  const { error } = await admin
    .from('tax_documents')
    .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: auth.id })
    .eq('id', id);

  if (error) return safeInternalError(error, 'Failed to update document');

  return NextResponse.json({ ok: true });
}
