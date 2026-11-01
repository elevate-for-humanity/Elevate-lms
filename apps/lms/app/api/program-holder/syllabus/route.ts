// pre-auth-registry: exempt - authenticated holder relationship and document ownership are required.
import { NextResponse } from 'next/server';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import { startHolderSyllabus } from '@/lib/program-holder/syllabus-course';
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
    .select('id,file_name,file_url,description,ocr_text,document_type')
    .eq('id', String(body?.documentId || '')).eq('user_id', ctx.user.id).maybeSingle();
  if (doc.error || !doc.data || !['training_plan', 'hvac_training_plan'].includes(doc.data.document_type))
    return NextResponse.json({ error: 'Syllabus not found.' }, { status: 404 });
  let meta;
  try { meta = JSON.parse(doc.data.description || '{}'); } catch { meta = {}; }
  if (meta.kind !== 'holder_syllabus' || meta.program_holder_id !== ctx.holderId || !ctx.programIds.includes(meta.program_id))
    return NextResponse.json({ error: 'This syllabus must be uploaded with its assigned program first.' }, { status: 400 });
  try {
    return await startHolderSyllabus(ctx.db, {
      documentId: doc.data.id, holderId: ctx.holderId, programId: meta.program_id,
      actorId: ctx.user.id, title: doc.data.file_name.replace(/\.[^.]+$/, '') + ' — Secondary assignment',
      text: doc.data.ocr_text || '', storagePath: doc.data.file_url,
    });
  } catch {
    return NextResponse.json({ error: 'Saved syllabus build could not start. Retry after Course Builder is available.' }, { status: 503 });
  }
}
