import { NextRequest, NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { safeError, safeDbError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; courseId: string }> },
) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard(request);

  const { slug, courseId } = await params;

  // Resolve slug → program id
  const db = await createClient();
  const { data: program, error: progErr } = await db
    .from('programs')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (progErr) return safeDbError(progErr, 'Program lookup failed');
  if (!program) return safeError('Program not found', 404);

  const programId = program.id;
  const adminDb = createAdminClient();

  // Verify the external course belongs to this program and allows manual completion
  const { data: course, error: lookupErr } = await adminDb
    .from('program_external_courses')
    .select('id, manual_completion_enabled')
    .eq('id', courseId)
    .eq('program_id', programId)
    .eq('is_active', true)
    .maybeSingle();

  if (lookupErr) return safeDbError(lookupErr, 'Lookup failed');
  if (!course) return safeError('External course not found', 404);
  if (!course.manual_completion_enabled) {
    return safeError('Manual completion not enabled for this course', 403);
  }

  // Accept multipart (file upload) or JSON (self-attest with no file)
  let certificateUrl: string | undefined;
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) return safeError('No file provided', 400);

    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      return safeError('File must be PDF, JPEG, PNG, or WebP', 400);
    }
    if (file.size > 10 * 1024 * 1024) {
      return safeError('File exceeds 10 MB limit', 400);
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
    const storagePath = `external-course-certs/${auth.id}/${courseId}/${Date.now()}.${ext}`;

    const { data: upload, error: uploadErr } = await db.storage
      .from('documents')
      .upload(storagePath, file, { contentType: file.type, upsert: true });

    if (uploadErr) return safeDbError(uploadErr, 'File upload failed');

    const { data: urlData } = db.storage.from('documents').getPublicUrl(upload.path);
    certificateUrl = urlData.publicUrl;
  }

  const { error } = await adminDb
    .from('external_course_completions')
    .upsert(
      {
        user_id: auth.id,
        external_course_id: courseId,
        program_id: programId,
        completed_at: new Date().toISOString(),
        ...(certificateUrl ? { certificate_url: certificateUrl } : {}),
      },
      { onConflict: 'user_id,external_course_id' },
    );

  if (error) return safeDbError(error, 'Failed to record completion');

  return NextResponse.json({ ok: true, certificate_url: certificateUrl ?? null });
}
