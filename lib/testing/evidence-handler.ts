import { NextResponse } from 'next/server';
import { requireExamSessionAccess } from '@/lib/testing/session-access';
export async function getExamEvidence(request: Request) {
  const id = new URL(request.url).searchParams.get('sessionId');
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
    return NextResponse.json({ error: 'Valid sessionId required' }, { status: 400 });
  const access = await requireExamSessionAccess(id);
  if (access instanceof NextResponse) return access;
  const key = access.session.evidence_storage_key;
  if (!key?.startsWith(`exam-evidence/${id}/`))
    return NextResponse.json({ error: 'Private evidence unavailable' }, { status: 404 });
  const { data, error } = await access.db.storage
    .from('exam-evidence')
    .createSignedUrl(key.slice('exam-evidence/'.length), 60);
  if (error || !data) return NextResponse.json({ error: 'Evidence unavailable' }, { status: 503 });
  return NextResponse.redirect(data.signedUrl, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
