// pre-auth-registry: exempt - authenticated holder relationship and document ownership are required.
import { NextResponse } from 'next/server';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import { extractHolderSyllabus, startHolderSyllabus } from '@/lib/program-holder/syllabus-course';
import { applyRateLimit } from '@/lib/api/withRateLimit';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  const ctx = await requireProgramHolder();
  if (ctx.mode !== 'holder') return NextResponse.json({ error: 'Program Holder session required.' }, { status: 403 });
  const result = await ctx.db.from('programs').select('id,title,name').in('id', ctx.programIds);
  if (result.error) return NextResponse.json({ error: 'Programs unavailable.' }, { status: 503 });
  return NextResponse.json({ programs: result.data });
}
export async function POST(request: Request) {
  const limited = await applyRateLimit(request, 'strict');
  if (limited) return limited;
  const ctx = await requireProgramHolder();
  if (ctx.mode !== 'holder') return NextResponse.json({ error: 'Program Holder session required.' }, { status: 403 });
  const body = await request.json().catch(() => null);
  const doc = await ctx.db.from('program_holder_documents')
    .select('id,file_name,file_url,storage_bucket,mime_type,description,ocr_text,document_type,status')
    .eq('id', String(body?.documentId || '')).eq('user_id', ctx.user.id).maybeSingle();
  if (doc.error || !doc.data || !['training_plan', 'hvac_training_plan', 'syllabus'].includes(doc.data.document_type))
    return NextResponse.json({ error: 'Syllabus not found.' }, { status: 404 });
  let meta;
  try { meta = JSON.parse(doc.data.description || '{}'); } catch { meta = {}; }
  if (doc.data.status === 'rejected') return NextResponse.json({ error: 'This syllabus was rejected. Submit a corrected syllabus before building.' }, { status: 409 });
  const programId = String(meta.program_id || body?.programId || (ctx.programIds.length === 1 ? ctx.programIds[0] : ''));
  if (!ctx.programIds.includes(programId) || (meta.program_holder_id && meta.program_holder_id !== ctx.holderId))
    return NextResponse.json({ error: 'Select one of your assigned programs for this saved syllabus.' }, { status: 400 });
  let sourceText = String(doc.data.ocr_text || '').trim();
  if (sourceText.length < 100) {
    try {
      const stored = await ctx.db.storage.from(doc.data.storage_bucket || 'documents').download(doc.data.file_url);
      if (stored.error || !stored.data) throw new Error('Saved syllabus file could not be opened.');
      sourceText = await extractHolderSyllabus(new File([await stored.data.arrayBuffer()], doc.data.file_name, {
        type: doc.data.mime_type || stored.data.type || 'application/pdf',
      }), String(body?.syllabusText || ''));
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Saved syllabus could not be read.' }, { status: 422 });
    }
  }
  const mapped = await ctx.db.from('program_holder_documents').update({
    ocr_text: sourceText, description: JSON.stringify({
      kind: 'holder_syllabus', program_holder_id: ctx.holderId, program_id: programId,
      ...(meta.kind !== 'holder_syllabus' ? { previous_description: doc.data.description } : {}),
    }),
  }).eq('id', doc.data.id).eq('user_id', ctx.user.id).select('id').single();
  if (mapped.error || !mapped.data)
    return NextResponse.json({ error: 'Syllabus program association could not be saved.' }, { status: 500 });
  try {
    return await startHolderSyllabus(ctx.db, {
      documentId: doc.data.id, holderId: ctx.holderId, programId,
      actorId: ctx.user.id, title: doc.data.file_name.replace(/\.[^.]+$/, '') + ' — Secondary assignment',
      text: sourceText, storagePath: doc.data.file_url,
    });
  } catch {
    return NextResponse.json({ error: 'Saved syllabus build could not start. Retry after Course Builder is available.' }, { status: 503 });
  }
}
