// pre-auth-registry: exempt - current authentication and explicit student ownership are checked before generating a private PDF.
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { programCompletionPdf } from '@/lib/certificates/program-completion-pdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function download(request: Request) {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = new URL(request.url).searchParams.get('id');
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Invalid certificate ID' }, { status: 400 });
  const result = await db.from('certificates')
    .select('certificate_number,student_name,user_id,course_title,completion_date,issued_at,metadata,status,revoked_at,certificate_type')
    .eq('id', id).eq('user_id', user.id).maybeSingle();
  const cert = result.data;
  if (result.error || !cert || cert.status !== 'active' || cert.revoked_at || cert.certificate_type !== 'course_completion')
    return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
  const startDate = cert.metadata?.training_start_date;
  const completionDate = cert.completion_date || cert.metadata?.completion_date;
  if (!startDate || !completionDate || !cert.student_name || !cert.course_title || !cert.certificate_number)
    return NextResponse.json({ error: 'Verified certificate details are incomplete' }, { status: 409 });
  const bytes = await programCompletionPdf({
    certificateNumber: cert.certificate_number, studentName: cert.student_name,
    studentId: user.id, courseTitle: cert.course_title,
    startDate: String(startDate).slice(0, 10), completionDate: String(completionDate).slice(0, 10),
    issuedAt: cert.issued_at,
  });
  const filename = cert.certificate_number.replace(/[^A-Za-z0-9-]/g, '');
  return new Response(Buffer.from(bytes), { headers: {
    'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${filename}.pdf"`,
    'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff',
  } });
}
export const GET = withApiAudit('/api/certificates/completion-pdf', download);
