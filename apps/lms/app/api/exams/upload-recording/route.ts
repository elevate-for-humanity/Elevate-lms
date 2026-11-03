import { createHash, randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { requireExamSessionAccess } from '@/lib/testing/session-access';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  const limited = await applyRateLimit(req, 'api');
  if (limited) return limited;
  try {
    const form = await req.formData();
    const file = form.get('file');
    const sessionId = form.get('sessionId');
    if (
      !(file instanceof File) ||
      typeof sessionId !== 'string' ||
      !/^[0-9a-f-]{36}$/i.test(sessionId)
    ) {
      return NextResponse.json({ error: 'Valid file and sessionId are required' }, { status: 400 });
    }
    const access = await requireExamSessionAccess(sessionId);
    if (access instanceof NextResponse) return access;
    if (access.session.evidence_storage_key)
      return NextResponse.json({ error: 'Evidence is already recorded' }, { status: 409 });
    const mime = file.type.split(';')[0];
    if (
      !['video/webm', 'video/mp4'].includes(mime) ||
      file.size < 1 ||
      file.size > 100 * 1024 * 1024
    ) {
      return NextResponse.json(
        { error: 'A WebM or MP4 recording up to 100 MB is required' },
        { status: 400 },
      );
    }
    const path = `${sessionId}/${randomUUID()}.${mime === 'video/mp4' ? 'mp4' : 'webm'}`;
    const bytes = await file.arrayBuffer();
    const hash = createHash('sha256').update(Buffer.from(bytes)).digest('hex');
    const { error: uploadError } = await access.db.storage
      .from('exam-evidence')
      .upload(path, bytes, { contentType: mime, upsert: false });
    if (uploadError)
      return NextResponse.json({ error: 'Recording upload failed' }, { status: 503 });
    // The attachment and its actor-attributed audit entry commit in one transaction.
    const { data, error } = await access.db.rpc('attach_private_exam_evidence', {
      p_actor: access.user.id,
      p_session: sessionId,
      p_key: `exam-evidence/${path}`,
      p_hash: hash,
    });
    if (error || !data) {
      await access.db.storage.from('exam-evidence').remove([path]);
      return NextResponse.json({ error: 'Evidence could not be attached' }, { status: 409 });
    }
    return NextResponse.json({ ok: true, path, evidenceHash: hash });
  } catch {
    return NextResponse.json({ error: 'Recording could not be saved' }, { status: 500 });
  }
}
