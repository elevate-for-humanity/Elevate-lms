/**
 * POST /api/admin/course-builder/automatic
 *
 * Canonical Admin-owned automatic course generator.
 * Preserves the original AutomaticCourseBuilder capability while removing the
 * cross-service dependency on the LMS-owned /api/ai/generate-and-publish-course route.
 */
import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { requireAdminClient } from '@/lib/supabase/admin';
import { generateCourseOutlineFn } from '@/lib/ai/generate-course-outline-fn';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';
import { transformLessonContent } from '@/lib/lms/transformLessonContent';
import { defaultActivities } from '@/lib/curriculum/activities';
import { COMPLIANCE_PROFILES } from '@/lib/course-builder/compliance-profiles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

type GenerateAndPublishRequest = {
  title: string;
  audience: string;
  hours?: number;
  state?: string;
  credentialOrExam?: string;
  deliveryFormat?: string;
  prompt?: string;
  programId?: string;
  complianceProfileKey?: string;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 90);
}

function inferComplianceProfile(body: GenerateAndPublishRequest): string {
  if (body.complianceProfileKey && COMPLIANCE_PROFILES[body.complianceProfileKey]) {
    return body.complianceProfileKey;
  }

  const signal = `${body.title} ${body.credentialOrExam ?? ''} ${body.prompt ?? ''}`.toLowerCase();
  if (/(apprentice|apprenticeship|dol|rapids)/.test(signal)) return 'dol_apprenticeship';
  if (/(naadac|peer recovery|peer support|crs|prs)/.test(signal)) return 'naadac_peer_support';
  if (/(state board|license|licensure|barber|cosmetology|esthetic|nail)/.test(signal)) return 'state_board_strict';
  if (/(regulated|certification|credential|exam)/.test(signal)) return 'custom_regulated';
  return 'internal_basic';
}

function buildPrompt(body: GenerateAndPublishRequest, complianceProfileKey: string): string {
  return [
    `Generate a complete workforce-ready training course titled "${body.title}".`,
    `Target audience: ${body.audience}.`,
    body.hours ? `Total training hours: ${body.hours}.` : '',
    body.state ? `State alignment: ${body.state}.` : '',
    body.credentialOrExam ? `Credential or exam: ${body.credentialOrExam}.` : '',
    body.deliveryFormat ? `Delivery format: ${body.deliveryFormat}.` : '',
    body.prompt ? `Additional requirements: ${body.prompt}` : '',
    `Compliance profile: ${complianceProfileKey}.`,
    'Include modules, instructional lessons, checkpoint assessments, and a final exam when required by the compliance profile.',
    'All content must be specific, job-ready, reviewable, and usable in a real workforce training program.',
  ]
    .filter(Boolean)
    .join(' ');
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  let body: GenerateAndPublishRequest;
  try {
    body = await request.json();
  } catch {
    return safeError('Request body must be valid JSON', 400);
  }

  if (!body?.title?.trim()) return safeError('title is required', 400);
  if (!body?.audience?.trim()) return safeError('audience is required', 400);
  if (body.hours !== undefined && (!Number.isFinite(body.hours) || body.hours <= 0)) {
    return safeError('hours must be a positive number', 400);
  }

  const complianceProfileKey = inferComplianceProfile(body);
  const complianceProfile = COMPLIANCE_PROFILES[complianceProfileKey];

  const genResult = await generateCourseOutlineFn(buildPrompt(body, complianceProfileKey));
  if (!genResult.ok) {
    const failure = genResult as { ok: false; attempts: number; errors_per_attempt: string[][] };
    return NextResponse.json(
      {
        ok: false,
        error: `Generation failed after ${failure.attempts} attempts`,
        errors_per_attempt: failure.errors_per_attempt,
      },
      { status: 422 },
    );
  }

  const { outline, attempt, normalization } = genResult;
  const db = await requireAdminClient();
  const courseSlug = `ai-${slugify(outline.course.slug || outline.course.title)}-${Date.now().toString(36)}`;

  const { data: courseRow, error: courseErr } = await db
    .from('courses')
    .insert({
      title: outline.course.title,
      slug: courseSlug,
      description: [
        outline.course.description,
        body.audience ? `Audience: ${body.audience}` : '',
        body.state ? `State: ${body.state}` : '',
        body.credentialOrExam ? `Credential: ${body.credentialOrExam}` : '',
        `Compliance: ${complianceProfileKey}`,
      ]
        .filter(Boolean)
        .join(' | '),
      short_description: outline.course.description.substring(0, 200),
      duration_hours: body.hours ?? complianceProfile.minimumProgramHours,
      compliance_profile_key: complianceProfileKey,
      governing_region: body.state ?? null,
      governing_body:
        complianceProfileKey === 'dol_apprenticeship'
          ? 'U.S. Department of Labor Registered Apprenticeship'
          : complianceProfileKey === 'state_board_strict'
            ? `${body.state ?? 'State'} licensing authority`
            : null,
      status: 'draft',
      is_active: false,
      program_id: body.programId ?? null,
      metadata: {
        source: 'automatic_course_builder',
        audience: body.audience,
        credentialOrExam: body.credentialOrExam ?? null,
        deliveryFormat: body.deliveryFormat ?? null,
        complianceProfileKey,
        generationAttempt: attempt,
        normalizationApplied: normalization,
        humanReviewRequired: true,
      },
    })
    .select('id')
    .maybeSingle();

  if (courseErr || !courseRow) {
    return safeInternalError(courseErr, 'Failed to create course record');
  }

  const courseId = courseRow.id as string;
  const moduleRows = outline.modules.map((m) => ({
    course_id: courseId,
    title: m.title,
    description: m.description,
    order_index: m.module_index,
  }));

  const { data: insertedModules, error: modErr } = await db
    .from('course_modules')
    .insert(moduleRows)
    .select('id, order_index');

  if (modErr || !insertedModules) {
    await db.from('courses').delete().eq('id', courseId);
    return safeInternalError(modErr, 'Failed to insert modules');
  }

  const moduleIdMap = new Map(insertedModules.map((m) => [m.order_index as number, m.id as string]));

  const lessonRows = outline.lessons.map((lesson) => {
    const activities = defaultActivities(lesson.step_type);
    const blob = {
      compliance_status: 'draft_for_human_review',
      compliance_notice: (outline.course as any).compliance_notice,
      learning_points: lesson.learning_points,
      scenario: lesson.scenario,
      assessment_question: lesson.assessment_question,
      exam_eligibility:
        lesson.step_type === 'exam' ? outline.course.exam_eligibility_criteria : undefined,
      pass_threshold:
        lesson.step_type === 'checkpoint'
          ? outline.course.pass_threshold_checkpoints
          : lesson.step_type === 'exam'
            ? outline.course.pass_threshold_final_exam
            : undefined,
    };
    const { html, quizQuestions } = transformLessonContent(blob, lesson.slug);

    return {
      course_id: courseId,
      module_id: moduleIdMap.get(lesson.module_index) ?? null,
      title: lesson.title,
      slug: lesson.slug,
      lesson_type: lesson.step_type,
      order_index: lesson.order_index,
      passing_score:
        lesson.step_type === 'checkpoint'
          ? outline.course.pass_threshold_checkpoints
          : lesson.step_type === 'exam'
            ? outline.course.pass_threshold_final_exam
            : null,
      activities,
      status: 'draft',
      is_published: false,
      content: JSON.stringify(blob),
      rendered_html: html,
      quiz_questions: quizQuestions.length > 0 ? quizQuestions : null,
    };
  });

  const { error: lessonErr } = await db.from('course_lessons').insert(lessonRows);
  if (lessonErr) {
    await db.from('course_modules').delete().eq('course_id', courseId);
    await db.from('courses').delete().eq('id', courseId);
    return safeInternalError(lessonErr, 'Failed to insert lessons');
  }

  // Keep AI output in draft/review state. The canonical Course Builder publish gate
  // is responsible for making the course learner-visible after compliance review.
  await logAdminAudit({
    action: AdminAction.BULK_CONTENT_GENERATED,
    actorId: auth.id,
    entityType: 'courses',
    entityId: courseId,
    metadata: {
      title: outline.course.title,
      modules_inserted: moduleRows.length,
      lessons_generated: lessonRows.length,
      generation_attempt: attempt,
      normalization_applied: normalization,
      program_id: body.programId ?? null,
      compliance_profile_key: complianceProfileKey,
      human_review_required: true,
    },
    req: request,
  });

  return NextResponse.json({
    ok: true,
    course_id: courseId,
    title: outline.course.title,
    modules_inserted: moduleRows.length,
    lessons_published: 0,
    lessons_generated: lessonRows.length,
    curriculum_lessons_inserted: 0,
    compliance_status: 'draft_for_human_review',
    compliance_profile_key: complianceProfileKey,
    generation_attempt: attempt,
    normalization_applied: normalization,
    review_required: true,
  });
}
