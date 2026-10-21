import { apiRequireAdmin } from '@/lib/admin/guards';
import { credentialDocumentPreview } from '@/lib/credentials/document-preview';
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  return credentialDocumentPreview(request, (await params).id);
}

export async function POST(request: import('next/server').NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { applyRateLimit } = await import('@/lib/api/withRateLimit');
  const limited = await applyRateLimit(request, 'strict');
  if (limited) return limited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  const { NextResponse } = await import('next/server');
  const { requireAdminClient } = await import('@/lib/supabase/admin');
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || !['approved', 'rejected'].includes(body.decision) || !/^[0-9a-f-]{36}$/i.test(id))
    return NextResponse.json({ error: 'Choose a valid document and decision.' }, { status: 400 });
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  if (body.decision === 'rejected' && (!reason || reason.length > 4000))
    return NextResponse.json({ error: 'Provide a rejection reason up to 4,000 characters.' }, { status: 400 });
  const earnedDate = typeof body.earnedDate === 'string' ? body.earnedDate : '';
  if (body.decision === 'approved' && !/^\d{4}-\d{2}-\d{2}$/.test(earnedDate))
    return NextResponse.json({ error: 'Provide the documented credential earned date.' }, { status: 400 });
  const db = await requireAdminClient();
  const { data, error } = await db.rpc('review_student_credential_document', {
    p_upload_id: id, p_actor_id: auth.id, p_decision: body.decision,
    p_earned_date: body.decision === 'approved' ? earnedDate : null,
    p_reason: body.decision === 'rejected' ? reason : null,
  });
  if (error) return NextResponse.json({ error: error.code === '40001' ? 'This document was already reviewed. Reload the page.' : 'The credential review could not be saved.' },
    { status: error.code === '40001' ? 409 : error.code === '42501' ? 403 : error.code === 'P0002' ? 404 : error.code === '22023' ? 400 : 500 });
  return NextResponse.json({ review: data });
}
