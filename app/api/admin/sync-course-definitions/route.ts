import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { COURSE_DEFINITIONS } from '@/lib/courses/definitions';
import { HVAC_QUIZ_MAP, getUniversalExam } from '@/lib/courses/hvac-quizzes';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { v5 as uuidv5 } from 'uuid';
import { logAdminAudit, AdminAction, BULK_ENTITY_ID } from '@/lib/admin/audit-log';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Deterministic UUID namespace for course/lesson IDs
const UUID_NAMESPACE = 'a1b2c3d4-e5f6-7890-abcd-200000000001';

function deterministicUUID(key: string): string {
  return uuidv5(key, UUID_NAMESPACE);
}

async function requireAdmin() {
  const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 };
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return { error: 'Forbidden', status: 403 };
  }
  const db = createAdminClient();
  return { user, supabase, db };
}

function buildLessonHtml(
  type: string,
  title: string,
  description: string,
  duration: string,
  moduleName: string,
  lessonNum: number
): string {
  const meta = duration ? `<p class="text-sm text-gray-500">Duration: ${duration} | Lesson ${lessonNum}</p>` : `<p class="text-sm text-gray-500">Lesson ${lessonNum}</p>`;
  const modLine = `<p class="text-sm text-gray-400 mb-2">Module: ${moduleName}</p>`;

  switch (type) {
    case 'quiz':
      return `${modLine}${meta}<h2>Assessment</h2><p>${description}</p><p><strong>Instructions:</strong> Read each question carefully. Select the best answer. You need 70% to pass.</p>`;
    case 'lab':
      return `${modLine}${meta}<h2>Hands-On Lab</h2><p>${description}</p><p><strong>Requirements:</strong> This lab must be completed at an approved training facility with instructor supervision. Wear required PPE.</p><p><strong>Completion:</strong> Demonstrate competency to your instructor to receive credit.</p>`;
    case 'reading':
      return `${modLine}${meta}<h2>Reading Material</h2><p>${description}</p><p><strong>Instructions:</strong> Read the material thoroughly. Take notes on key concepts. You will be tested on this content.</p>`;
    case 'assignment':
      return `${modLine}${meta}<h2>Assignment</h2><p>${description}</p><p><strong>Submission:</strong> Complete the assignment and submit for instructor review.</p>`;
    case 'video':
      return `${modLine}${meta}<h2>${title}</h2><p>${description}</p><p><strong>Instructions:</strong> Watch the full video lesson. Take notes on key concepts. Mark as complete when finished.</p>`;
    default:
      return `${modLine}${meta}<h2>${title}</h2><p>${description}</p>`;
  }
}

/**
 * POST /api/admin/sync-course-definitions
 *
 * Syncs COURSE_DEFINITIONS from lib/courses/definitions.ts into
 * training_courses + training_lessons tables in Supabase.
 *
 * Body: { slug?: string } — sync one course by slug, or all if omitted.
 */
async function _POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { db } = auth;

  try {
    const body = await request.json().catch(() => ({}));
    const { slug } = body;

    const courses = slug
      ? COURSE_DEFINITIONS.filter((c) => c.slug === slug)
      : COURSE_DEFINITIONS;

    if (courses.length === 0) {
      return NextResponse.json(
        { error: `No course found with slug "${slug}"` },
        { status: 404 }
      );
    }

    const results: Array<{
      slug: string;
      courseId: string;
      lessonsUpserted: number;
      error?: string;
    }> = [];

    for (const course of courses) {
      const courseId = deterministicUUID(`${course.slug}-course`);

      // Upsert course
      const { error: courseError } = await supabase
        .from('training_courses')
        .upsert(
          {
            id: courseId,
            course_name: course.title,
            title: course.title,
            description: course.subtitle,
            is_active: true,
            category: course.category,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

      if (courseError) {
        logger.error(`[SyncDefs] Course upsert failed: ${course.slug}`, courseError);
        results.push({ slug: course.slug, courseId, lessonsUpserted: 0, error: 'Course sync failed' });
        continue;
      }

      // Flatten modules → lessons with order_index
      let lessonNumber = 0;
      const lessonRows: Array<Record<string, unknown>> = [];

      for (const mod of course.modules) {
        const moduleNum = parseInt(mod.id.split('-').pop() || '0', 10);

        for (let i = 0; i < mod.lessons.length; i++) {
          const lesson = mod.lessons[i];
          lessonNumber++;

          const lessonId = deterministicUUID(lesson.id);
          const orderIndex = moduleNum * 100 + (i + 1);

          // Build content HTML with module context and lesson type
          const desc = lesson.description || '';
          const dur = lesson.durationMinutes;
          const durStr = dur ? `${dur} minutes` : '';
          const contentHtml = buildLessonHtml(lesson.type, lesson.title, desc, durStr, mod.title, lessonNumber);

          // Look up quiz questions for this lesson
          const quizQuestions = lesson.id === 'hvac-10-07'
            ? getUniversalExam()
            : HVAC_QUIZ_MAP[lesson.id] || null;

          const contentType = lesson.type === 'quiz' ? 'quiz' : lesson.type === 'video' ? 'video' : 'reading';

          lessonRows.push({
            id: lessonId,
            course_id_uuid: courseId,
            lesson_number: lessonNumber,
            order_index: orderIndex,
            title: lesson.title,
            content: contentHtml,
            description: lesson.description || null,
            duration_minutes: lesson.durationMinutes || null,
            is_published: true,
            is_required: true,
            content_type: contentType,
            quiz_questions: quizQuestions ? JSON.stringify(quizQuestions) : '[]',
            passing_score: lesson.type === 'quiz' ? 70 : null,
          });
        }
      }

      // Delete existing lessons for this course, then insert fresh
      const { error: deleteError } = await supabase
        .from('training_lessons')
        .delete()
        .eq('course_id_uuid', courseId);

      if (deleteError) {
        logger.error(`[SyncDefs] Lesson delete failed: ${course.slug}`, deleteError);
        results.push({ slug: course.slug, courseId, lessonsUpserted: 0, error: 'Lesson cleanup failed' });
        continue;
      }

      // Insert in batches of 50 (Supabase limit)
      let inserted = 0;
      for (let batch = 0; batch < lessonRows.length; batch += 50) {
        const chunk = lessonRows.slice(batch, batch + 50);
        const { error: insertError } = await supabase
          .from('training_lessons')
          .insert(chunk);

        if (insertError) {
          logger.error(`[SyncDefs] Lesson insert failed: ${course.slug} batch ${batch}`, insertError);
          results.push({
            slug: course.slug,
            courseId,
            lessonsUpserted: inserted,
            error: 'Lesson insert failed',
          });
          break;
        }
        inserted += chunk.length;
      }

      if (!results.find((r) => r.slug === course.slug)) {
        results.push({ slug: course.slug, courseId, lessonsUpserted: inserted });
      }
    }

    const totalLessons = results.reduce((sum, r) => sum + r.lessonsUpserted, 0);
    const errors = results.filter((r) => r.error);

    await logAdminAudit({ action: AdminAction.COURSE_DEFINITIONS_SYNCED, actorId: auth.id, entityType: 'course_definitions', entityId: BULK_ENTITY_ID, metadata: { courses_synced: results.length, total_lessons: totalLessons, errors: errors.length }, req: request });

    return NextResponse.json({
      success: errors.length === 0,
      message: `Synced ${results.length} course(s), ${totalLessons} lessons. ${errors.length} error(s).`,
      results,
    });
  } catch (error) {
    logger.error('[SyncDefs] Route error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}

/**
 * GET /api/admin/sync-course-definitions
 *
 * Returns the list of courses available in definitions.ts
 * and their lesson counts.
 */
async function _GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const summary = COURSE_DEFINITIONS.map((c) => ({
    slug: c.slug,
    title: c.title,
    category: c.category,
    modules: c.modules.length,
    lessons: c.modules.reduce((sum, m) => sum + m.lessons.length, 0),
    courseId: deterministicUUID(`${c.slug}-course`),
  }));

  return NextResponse.json({ courses: summary });
}
export const GET = withApiAudit('/api/admin/sync-course-definitions', _GET);
export const POST = withApiAudit('/api/admin/sync-course-definitions', _POST);
