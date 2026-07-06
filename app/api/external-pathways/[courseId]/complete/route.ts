/**
 * POST /api/external-pathways/[courseId]/complete
 *
 * Learner-facing certificate upload for external career pathway courses.
 * Resolves the program from the external course's program_id, then delegates
 * to the existing completion logic (upsert into external_course_completions).
 *
 * Accepts multipart/form-data with a `file` field (PDF/image, max 10 MB).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeDbError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return safeError('Unauthenticated', 401);

  const { courseId } = await params;

  const db = await requireAdminClient();

  // Resolve external course → program_id
  const { data: course, error: courseErr } = await db
    .from('program_external_courses')
    .select('id, program_id, title, manual_completion_enabled')
    .eq('id', courseId)
    .eq('is_active', true)
    .maybeSingle();

  if (courseErr) return safeDbError(courseErr, 'Course lookup failed');
  if (!course) return safeError('External course not found', 404);
  if (!course.manual_completion_enabled) {
    return safeError('Manual completion not enabled for this course', 403);
  }

  // Parse file
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('multipart/form-data')) {
    return safeError('Expected multipart/form-data', 400);
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) return safeError('No file provided', 400);
  if (file.size > MAX_BYTES) return safeError('File exceeds 10 MB limit', 400);
  if (!ALLOWED_TYPES.includes(file.type)) {
    return safeError('File must be PDF, JPG, PNG, or WebP', 400);
  }

  // Upload to Supabase Storage
  const ext = file.name.split('.').pop() ?? 'pdf';
  const storagePath = `external-certificates/${user.id}/${courseId}-${Date.now()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadErr } = await db.storage
    .from('documents')
    .upload(storagePath, Buffer.from(arrayBuffer), {
      contentType: file.type,
      upsert: true,
    });

  if (uploadErr) {
    logger.error('[external-pathways/complete] Storage upload failed', { uploadErr });
    return safeError('File upload failed', 500);
  }

  const { data: { publicUrl } } = db.storage.from('documents').getPublicUrl(storagePath);

  // Upsert completion record
  const { error: upsertErr } = await db
    .from('external_course_completions')
    .upsert(
      {
        user_id: user.id,
        external_course_id: courseId,
        program_id: course.program_id,
        certificate_url: publicUrl,
        created_at: new Date().toISOString(),
        // approved_at left null — admin approves via /admin/external-course-completions
      },
      { onConflict: 'user_id,external_course_id' },
    );

  if (upsertErr) {
    logger.error('[external-pathways/complete] Upsert failed', { upsertErr });
    return safeDbError(upsertErr, 'Could not record completion');
  }

  logger.info('[external-pathways/complete] Certificate submitted', {
    userId: user.id,
    courseId,
    courseTitle: course.title,
  });

  return NextResponse.json({ ok: true });
}
