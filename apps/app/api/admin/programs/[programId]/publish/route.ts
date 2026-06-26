/**
 * POST /api/admin/programs/[programId]/publish
 *
 * Publishes a program. Enforces:
 *   1. review_status = 'approved' (approval workflow gate)
 *   2. Completeness checks (title, description, hero, outcomes, modules, lessons)
 *   3. Snapshots state into program_versions before going live
 *
 * Use POST /api/admin/programs/[programId]/review to move through
 * draft → in_review → approved before calling this route.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { publishProgram } from '@/lib/course-builder/program-versioning';
import { autoGenerateCourseForProgram } from '@/lib/course-builder/program-auto-course';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { programId } = await params;
  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const body = await request.json().catch(() => ({}));
  const autoGenerateCourse = body?.auto_generate_course !== false;
  const autoMode = body?.auto_mode === 'replace' ? 'replace' : 'missing-only';
  const autoVideoMode = body?.auto_video_mode === 'off' ? 'off' : 'queue';
  const autoVideoQueueLimit =
    typeof body?.auto_video_queue_limit === 'number' ? Number(body.auto_video_queue_limit) : null;

  // 1. Approval gate
  const { data: program } = await db
    .from('programs')
    .select('title, description, hero_image_url, estimated_weeks, delivery_method, review_status')
    .eq('id', programId)
    .maybeSingle();

  if (!program) return safeError('Program not found', 404);

  if (program.review_status !== 'approved') {
    return safeError(
      `Program must be approved before publishing. Current status: '${program.review_status}'. ` +
        `Submit via POST /api/admin/programs/${programId}/review`,
      409,
    );
  }

  // 2. Completeness checks
  const [{ data: outcomes }, { data: modules }, { data: ctas }] = await Promise.all([
    db.from('program_outcomes').select('id').eq('program_id', programId),
    db.from('program_modules').select('id, program_lessons(id)').eq('program_id', programId),
    db.from('program_ctas').select('id').eq('program_id', programId),
  ]);

  const missing: string[] = [];
  if (!program.title?.trim()) missing.push('Program title');
  if (!program.description?.trim()) missing.push('Program description');
  if (!program.hero_image_url) missing.push('Hero image');
  if (!program.estimated_weeks) missing.push('Program duration');
  if (!program.delivery_method) missing.push('Delivery mode');
  if ((outcomes?.length ?? 0) < 3) missing.push(`Outcomes (${outcomes?.length ?? 0}/3 minimum)`);
  if ((ctas?.length ?? 0) === 0) missing.push('Primary CTA');

  const totalModules = modules?.length ?? 0;
  const totalLessons =
    modules?.reduce((n: number, m: any) => n + (m.program_lessons?.length ?? 0), 0) ?? 0;
  if (totalModules < 3) missing.push(`Modules (${totalModules}/3 minimum)`);
  if (totalLessons < 10) missing.push(`Lessons (${totalLessons}/10 minimum)`);

  if (missing.length > 0) {
    return NextResponse.json({ error: 'Program is incomplete', missing }, { status: 422 });
  }

  // 3. Publish with snapshot
  const result = await publishProgram(db, programId, auth.id);
  if (!result.ok) return safeInternalError(new Error(result.error), 'Publish failed');

  db.from('audit_logs')
    .insert({
      actor_id: auth.id,
      action: 'publish',
      resource_type: 'program',
      resource_id: programId,
    })
    .then(() => {})
    .catch(() => {});

  let autoCourseResult: Awaited<ReturnType<typeof autoGenerateCourseForProgram>> | null = null;
  if (autoGenerateCourse) {
    try {
      autoCourseResult = await autoGenerateCourseForProgram({
        programId,
        mode: autoMode,
        videoMode: autoVideoMode,
        videoQueueLimit: autoVideoQueueLimit,
      });
    } catch {
      // Non-blocking: publish should still succeed even if auto-generation fails.
    }
  }

  return NextResponse.json({
    ok: true,
    published: true,
    version: result.version,
    auto_course: autoCourseResult,
  });
}
