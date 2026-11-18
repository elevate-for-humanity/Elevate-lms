import { NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { checkAndSendOnboardingCompleteEmail } from '@/lib/program-holder/onboarding-complete';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  const { id } = await params;
  const { decision } = await request.json().catch(() => ({}));
  if (!['approved', 'rejected'].includes(decision))
    return NextResponse.json({ error: 'Valid review decision required.' }, { status: 400 });
  const db = await requireAdminClient();
  const { data: existing, error: lookupError } = await db
    .from('program_holder_documents')
    .select('file_url,storage_bucket,status,approved')
    .eq('id', id)
    .maybeSingle();
  if (lookupError)
    return NextResponse.json({ error: 'Document could not be loaded.' }, { status: 503 });
  if (!existing) return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
  if (existing.status !== 'pending' || existing.approved) {
    return NextResponse.json(
      { error: 'This document is no longer pending review.' },
      { status: 409 },
    );
  }
  const bucket = existing.storage_bucket || 'documents';
  if (
    !existing.file_url?.trim() ||
    ![
      'documents',
      'provider-documents',
      'program-holder-documents',
      'program_holder_documents',
    ].includes(bucket)
  ) {
    return NextResponse.json(
      { error: 'The stored file is unavailable for review.' },
      { status: 409 },
    );
  }
  const { data: file, error: fileError } = await db.storage.from(bucket).exists(existing.file_url);
  if (fileError || !file) {
    return NextResponse.json(
      { error: 'The stored file is unavailable for review.' },
      { status: 409 },
    );
  }
  const now = new Date().toISOString();
  const { data: document, error } = await db
    .from('program_holder_documents')
    .update({
      status: decision,
      approved: decision === 'approved',
      reviewed_at: now,
      reviewed_by: auth.id,
      updated_at: now,
    })
    .eq('id', id)
    .eq('status', 'pending')
    .select('id,user_id,status')
    .maybeSingle();
  if (error || !document)
    return NextResponse.json({ error: 'Document review could not be saved.' }, { status: 500 });
  await db.from('admin_audit_events').insert({
    action: `program_holder_document.${decision}`,
    actor_user_id: auth.id,
    target_type: 'program_holder_document',
    target_id: id,
    metadata: { user_id: document.user_id },
  });
  if (decision === 'approved') await checkAndSendOnboardingCompleteEmail(db, document.user_id);
  return NextResponse.json({ document });
}
