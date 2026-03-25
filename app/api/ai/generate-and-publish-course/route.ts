/**
 * POST /api/ai/generate-and-publish-course
 *
 * Full pipeline in one call:
 *   generate → normalize → validate → write staging → publish course_lessons
 *
 * The LMS renderer reads from lms_lessons view which sources course_lessons WHERE is_published=true.
 * curriculum_lessons is written as a secondary archive but is not the read path.
 *
 * Auth: X-Internal-Service-Key header (server-to-server only).
 *
 * Request body:
 *   { title, audience, hours?, state?, credentialOrExam?, deliveryFormat?, prompt?, programId? }
 *
 * Success response:
 *   { ok: true, course_id, title, modules_inserted, lessons_published,
 *     curriculum_lessons_inserted, curriculum_lessons_skipped, compliance_status, attempt }
 *
 * Failure response (422):
 *   { ok: false, error, errors_per_attempt? }
 */

import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateCourseOutlineFn } from '@/lib/ai/generate-course-outline-fn';

export const maxDuration = 300;

interface GenerateAndPublishRequest {
  title: string;
  audience: string;
  hours?: number;
  state?: string;
  credentialOrExam?: string;
  deliveryFormat?: string;
  prompt?: string;
  programId?: string; // optional — links course to a program
}

function buildPrompt(body: GenerateAndPublishRequest): string {
  return [
    `Generate a complete workforce-ready training course titled "${body.title}".`,
    `Target audience: ${body.audience}.`,
    body.hours ? `Total training hours: ${body.hours}.` : '',
    body.state ? `State alignment: ${body.state}.` : '',
    body.credentialOrExam ? `Credential or exam: ${body.credentialOrExam}.` : '',
    body.deliveryFormat ? `Delivery format: ${body.deliveryFormat}.` : '',
    body.prompt ? `Additional requirements: ${body.prompt}` : '',
    'Include 5 modules with 4 lessons each, 3 checkpoints after modules 2/3/4, and 1 final exam with 25+ questions.',
    'All content must be specific, job-ready, and usable in a real training program.',
  ].filter(Boolean).join(' ');
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  let body: GenerateAndPublishRequest;
  try {
    body = await request.json();
  } catch {
    return safeError('Request body must be valid JSON', 400);
  }

  if (!body?.title?.trim()) return safeError('title is required', 400);
  if (!body?.audience?.trim()) return safeError('audience is required', 400);

  // ── Gate 1–3: Generate, normalize, validate (3-attempt retry) ────────────
  const genResult = await generateCourseOutlineFn(buildPrompt(body));

  if (!genResult.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: `Generation failed after ${genResult.attempts} attempts`,
        errors_per_attempt: genResult.errors_per_attempt,
      },
      { status: 422 }
    );
  }

  const { outline, attempt, normalization } = genResult;
  const db = createAdminClient();

  // ── Gate 4: Write staging tables ─────────────────────────────────────────
  // Insert course (map to actual courses columns)
  const { data: courseRow, error: courseErr } = await db
    .from('courses')
    .insert({
      title:             outline.course.title,
      slug:              `ai-${outline.course.slug}-${Date.now()}`,
      description:       [
        outline.course.description,
        body.audience ? `Audience: ${body.audience}` : '',
        body.state ? `State: ${body.state}` : '',
        body.credentialOrExam ? `Credential: ${body.credentialOrExam}` : '',
        `Compliance: ${outline.course.compliance_status}`,
      ].filter(Boolean).join(' | '),
      short_description: outline.course.description.substring(0, 200),
      status:            'draft',
      is_active:         false,
      program_id:        body.programId ?? null,
    })
    .select('id')
    .single();

  if (courseErr || !courseRow) {
    return safeInternalError(courseErr, 'Failed to create course record');
  }

  const courseId = courseRow.id as string;

  // Insert modules (actual columns: course_id, title, description, order_index)
  const moduleRows = outline.modules.map(m => ({
    course_id:   courseId,
    title:       m.title,
    description: m.description,
    order_index: m.module_index,
  }));

  const { data: insertedModules, error: modErr } = await db
    .from('course_modules')
    .insert(moduleRows)
    .select('id, order_index');

  if (modErr || !insertedModules) {
    // Rollback course
    await db.from('courses').delete().eq('id', courseId);
    return safeInternalError(modErr, 'Failed to insert modules');
  }

  // Build module_index → module_id map
  const moduleIdMap = new Map(insertedModules.map(m => [m.order_index as number, m.id as string]));

  // Insert lessons (actual columns: course_id, module_id, title, slug, lesson_type,
  //                                 order_index, passing_score, activities, content, status)
  const lessonRows = outline.lessons.map(l => {
    const activities: Record<string, boolean> = {
      video: true, reading: true, flashcards: true, practice: true,
    };
    if (l.step_type === 'checkpoint') activities.checkpoint = true;
    if (l.step_type === 'exam')       activities.exam = true;

    return {
      course_id:    courseId,
      module_id:    moduleIdMap.get(l.module_index) ?? null,
      title:        l.title,
      slug:         l.slug,
      lesson_type:  l.step_type,   // actual column name
      order_index:  l.order_index,
      passing_score: l.step_type === 'checkpoint'
        ? outline.course.pass_threshold_checkpoints
        : l.step_type === 'exam'
          ? outline.course.pass_threshold_final_exam
          : null,
      activities,
      status:       'draft',
      is_published: false,
      // All AI-generated content goes in the content JSON blob
      content: JSON.stringify({
        compliance_status:      'draft_for_human_review',
        compliance_notice:      outline.course.compliance_notice,
        learning_points:        l.learning_points,
        scenario:               l.scenario,
        assessment_question:    l.assessment_question,
        exam_eligibility:       l.step_type === 'exam'
          ? outline.course.exam_eligibility_criteria
          : undefined,
        pass_threshold:         l.step_type === 'checkpoint'
          ? outline.course.pass_threshold_checkpoints
          : l.step_type === 'exam'
            ? outline.course.pass_threshold_final_exam
            : undefined,
      }),
    };
  });

  const { error: lessonErr } = await db.from('course_lessons').insert(lessonRows);

  if (lessonErr) {
    // Rollback — course_lessons failed, nothing to clean there
    await db.from('course_modules').delete().eq('course_id', courseId);
    await db.from('courses').delete().eq('id', courseId);
    return safeInternalError(lessonErr, 'Failed to insert lessons');
  }

  // ── Gate 5: Atomic publish via DB function ────────────────────────────────
  // publish_course_from_staging() runs inside a single Postgres transaction:
  //   - UPDATE course_lessons SET is_published=true (makes them visible to lms_lessons)
  //   - INSERT curriculum_lessons (archive copy, idempotent on lesson_order)
  // Any failure rolls back both writes atomically — no compensating deletes needed.
  const { data: publishResult, error: publishErr } = await db
    .rpc('publish_course_from_staging', {
      p_course_id:  courseId,
      p_program_id: (body.programId && body.programId !== courseId) ? body.programId : null,
    });

  if (publishErr) {
    // Transaction rolled back by Postgres — only staging tables need cleanup
    await db.from('course_lessons').delete().eq('course_id', courseId);
    await db.from('course_modules').delete().eq('course_id', courseId);
    await db.from('courses').delete().eq('id', courseId);
    return safeInternalError(publishErr, 'Failed to publish course');
  }

  const pub = publishResult as {
    lessons_published: number;
    curriculum_lessons_inserted: number;
    curriculum_lessons_skipped: number;
  };

  return NextResponse.json({
    ok: true,
    course_id:                   courseId,
    title:                       outline.course.title,
    modules_inserted:            moduleRows.length,
    lessons_published:           pub.lessons_published,
    curriculum_lessons_inserted: pub.curriculum_lessons_inserted,
    curriculum_lessons_skipped:  pub.curriculum_lessons_skipped,
    compliance_status:           'draft_for_human_review',
    generation_attempt:          attempt,
    normalization_applied:       normalization,
  });
}
