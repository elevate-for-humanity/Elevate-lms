import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resolveCourseEnrollment } from '@/lib/enrollment/resolve-course-enrollment';
import { validateDocument } from '@/lib/uploads/document-validation';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
async function submit(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const limited = await applyRateLimit(request, 'strict');
  if (limited) return limited;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = await requireAdminClient();
  const { id } = await params;
  const uploadedPaths: string[] = [];
  try {
    const { data: assignment, error: assignmentError } = await db
      .from('assignments')
      .select('id,course_id,due_date,allow_late_submission,submission_type')
      .eq('id', id)
      .maybeSingle();
    if (assignmentError) throw assignmentError;
    if (!assignment?.course_id)
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    const enrollment = await resolveCourseEnrollment(user.id, assignment.course_id);
    if (
      !enrollment ||
      !['active', 'enrolled', 'in_progress', 'confirmed'].includes(enrollment.status)
    )
      return NextResponse.json(
        { error: 'An active course enrollment is required.' },
        { status: 403 },
      );
    if (
      assignment.due_date &&
      new Date(assignment.due_date).getTime() < Date.now() &&
      assignment.allow_late_submission === false
    )
      return NextResponse.json(
        { error: 'The due date has passed. Contact your instructor for permission to submit.' },
        { status: 409 },
      );
    const multipart = request.headers.get('content-type')?.includes('multipart/form-data');
    const body = multipart ? await request.formData() : await request.json();
    const value = (key: string) => (multipart ? (body as FormData).get(key) : body[key]);
    const submissionText = String(value('submissionText') || '').trim();
    const submissionUrl = String(value('submissionUrl') || '').trim();
    const files = multipart
      ? (body as FormData)
          .getAll('file')
          .filter((item): item is File => item instanceof File && item.size > 0)
      : [];
    if (files.length > 5 || files.reduce((sum, file) => sum + file.size, 0) > 20 * 1024 * 1024)
      return NextResponse.json(
        { error: 'Submit up to five files, totaling no more than 20 MB.' },
        { status: 400 },
      );
    if (submissionText.length > 20000)
      return NextResponse.json(
        { error: 'Response must be 20,000 characters or fewer.' },
        { status: 400 },
      );
    if (submissionUrl) {
      let url: URL;
      try {
        url = new URL(submissionUrl);
      } catch {
        return NextResponse.json({ error: 'Provide a valid evidence URL.' }, { status: 400 });
      }
      if (!['https:', 'http:'].includes(url.protocol))
        return NextResponse.json({ error: 'Use an HTTP or HTTPS evidence link.' }, { status: 400 });
    }
    if (!submissionText && !submissionUrl && !files.length)
      return NextResponse.json(
        { error: 'Add a response, evidence link, or file.' },
        { status: 400 },
      );
    const { data: existing, error: existingError } = await db
      .from('assignment_submissions')
      .select('id,grade,file_path')
      .eq('assignment_id', id)
      .or(`user_id.eq.${user.id},student_id.eq.${user.id}`)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing?.grade != null)
      return NextResponse.json(
        { error: 'This submission has been graded. Contact your instructor before resubmitting.' },
        { status: 409 },
      );
    for (const file of files) {
      const kind = [
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ].includes(file.type)
        ? 'resume'
        : 'credential';
      const checked = await validateDocument(file, kind);
      if (checked.error || !checked.extension || !checked.bytes) {
        if (uploadedPaths.length) await db.storage.from('documents').remove(uploadedPaths);
        return NextResponse.json(
          { error: checked.error || 'Invalid evidence file.' },
          { status: 400 },
        );
      }
      const uploadedPath = `${user.id}/assignments/${id}/${randomUUID()}.${checked.extension}`;
      const upload = await db.storage
        .from('documents')
        .upload(uploadedPath, checked.bytes, { contentType: file.type, upsert: false });
      if (upload.error) throw upload.error;
      uploadedPaths.push(uploadedPath);
    }
    const payload = {
      assignment_id: id,
      course_id: assignment.course_id,
      user_id: user.id,
      student_id: user.id,
      submission_text: submissionText || null,
      submission_url: submissionUrl || null,
      file_path: uploadedPaths[0] || existing?.file_path || null,
      ...(uploadedPaths.length ? { file_paths: uploadedPaths, files: uploadedPaths } : {}),
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const result = existing
      ? await db
          .from('assignment_submissions')
          .update(payload)
          .eq('id', existing.id)
          .is('grade', null)
          .select('id,status,submitted_at')
          .single()
      : await db
          .from('assignment_submissions')
          .insert(payload)
          .select('id,status,submitted_at')
          .single();
    if (result.error) throw result.error;
    return NextResponse.json(
      { submission: result.data },
      { status: 201, headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    if (uploadedPaths.length) await db.storage.from('documents').remove(uploadedPaths);
    logger.error('Assignment submission failed', error);
    return NextResponse.json(
      { error: 'Your assignment could not be submitted. Please try again.' },
      { status: 500 },
    );
  }
}
export const POST = withApiAudit('/api/assignments/[id]/submit', submit);
