/**
 * POST /api/admin/lms/courses/[courseId]/publish
 *
 * Canonical persisted-course publication boundary. The Studio publish panel and
 * all Admin course publishing must cross this gate. The gate validates the
 * actual rows that the learner LMS will render; it does not trust UI state.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { publishCourse } from '@/lib/lms/course-service';
import { safeInternalError } from '@/lib/api/safe-error';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ASSESSMENT_TYPES = new Set(['quiz', 'checkpoint', 'exam']);
const PRACTICAL_TYPES = new Set(['practical', 'lab', 'fieldwork', 'observation']);

function asArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function hasContent(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0;
  return !!value && typeof value === 'object' && Object.keys(value as Record<string, unknown>).length > 0;
}

async function runProcurementHealthCheck(
  supabase: Awaited<ReturnType<typeof createClient>>,
  courseId: string,
): Promise<{ pass: boolean; blocking_issues: string[]; metrics: Record<string, number> }> {
  const blocking: string[] = [];
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id,title,slug,description,status,generation_status,generation_progress,review_status,compliance_profile_key,governing_body,governing_standard_version,duration_hours,passing_score')
    .eq('id', courseId)
    .maybeSingle();

  if (courseError) throw courseError;
  if (!course) {
    return { pass: false, blocking_issues: ['course not found'], metrics: {} };
  }

  if (!course.title?.trim()) blocking.push('course title is missing');
  if (!course.slug?.trim()) blocking.push('course slug is missing');
  if (!course.description?.trim()) blocking.push('course description is missing');
  if (!course.duration_hours || Number(course.duration_hours) <= 0) blocking.push('course duration_hours is missing');
  if (course.review_status !== 'approved') blocking.push('course has not completed human review/approval');

  const externalProfile = Boolean(course.compliance_profile_key && course.compliance_profile_key !== 'internal_basic');
  if (externalProfile && !course.governing_body?.trim()) blocking.push('governing body is missing');
  if (externalProfile && !course.governing_standard_version?.trim()) blocking.push('governing standard/test-plan version is missing');

  if (course.generation_status && !['completed', 'published'].includes(course.generation_status)) {
    blocking.push(`course generation is not complete (${course.generation_status}, ${course.generation_progress ?? 0}%)`);
  }

  const { data: modules, error: moduleError } = await supabase
    .from('course_modules')
    .select(`
      id,title,slug,domain_key,target_hours,order_index,
      course_lessons(
        id,title,slug,lesson_type,content,rendered_html,video_url,quiz_questions,
        passing_score,duration_minutes,generation_status,ai_generated,approved,
        domain_key,hour_category,delivery_method,learning_objectives,
        competency_checks,practical_required,evidence_type,requires_instructor_signoff,
        content_json
      )
    `)
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  if (moduleError) throw moduleError;
  const mods = modules ?? [];
  if (mods.length === 0) blocking.push('course has no modules');

  let totalLessons = 0;
  let approvedLessons = 0;
  let assessments = 0;
  let practicals = 0;
  let competencyMappings = 0;
  let interactiveLessons = 0;

  for (const [mi, module] of (mods as any[]).entries()) {
    if (!module.title?.trim()) blocking.push(`module ${mi + 1}: title missing`);
    if (!module.slug?.trim()) blocking.push(`module ${mi + 1}: slug missing`);
    if (!module.domain_key?.trim()) blocking.push(`module "${module.title || mi + 1}": standards/domain mapping missing`);
    if (!module.target_hours || Number(module.target_hours) <= 0) blocking.push(`module "${module.title || mi + 1}": target hours missing`);

    const lessons = asArray(module.course_lessons);
    if (lessons.length === 0) blocking.push(`empty module: ${module.title}`);
    totalLessons += lessons.length;

    let moduleHasAssessment = false;
    for (const lesson of lessons) {
      const issues: string[] = [];
      const type = String(lesson.lesson_type ?? '');
      const isAssessment = ASSESSMENT_TYPES.has(type);
      const isPractical = lesson.practical_required === true || PRACTICAL_TYPES.has(type);
      const objectives = asArray(lesson.learning_objectives);
      const competencies = asArray(lesson.competency_checks);
      const questions = asArray(lesson.quiz_questions);
      const contentJson = lesson.content_json && typeof lesson.content_json === 'object'
        ? (lesson.content_json as Record<string, any>)
        : {};
      const experience = contentJson.experience && typeof contentJson.experience === 'object'
        ? contentJson.experience
        : null;

      if (lesson.approved === true) approvedLessons += 1;
      if (isAssessment) {
        assessments += 1;
        moduleHasAssessment = true;
      }
      if (isPractical) practicals += 1;
      competencyMappings += competencies.length;
      if (experience && Object.keys(experience).length > 0) interactiveLessons += 1;

      if (!type) issues.push('lesson_type missing');
      if (!lesson.slug?.trim()) issues.push('slug missing');
      if (!lesson.duration_minutes || Number(lesson.duration_minutes) <= 0) issues.push('duration missing');
      if (objectives.length === 0) issues.push('learning objectives missing');
      if (!lesson.domain_key?.trim()) issues.push('standards/domain mapping missing');
      if (!lesson.hour_category) issues.push('hour category missing');
      if (!lesson.delivery_method) issues.push('delivery method missing');
      if (lesson.ai_generated === true && lesson.approved !== true) issues.push('AI lesson not human-approved');
      if (lesson.ai_generated === true && lesson.generation_status && !['verification_ready', 'certificate_ready', 'published', 'completed'].includes(lesson.generation_status)) {
        issues.push(`generation not ready (${lesson.generation_status})`);
      }

      if (isAssessment) {
        if (questions.length === 0) issues.push('assessment has no questions');
        if (lesson.passing_score == null) issues.push('assessment passing score missing');
        questions.forEach((question: any, qi: number) => {
          if (!String(question?.explanation ?? '').trim()) issues.push(`question ${qi + 1} rationale missing`);
          if (!question?.domainKey && asArray(question?.competencyKeys).length === 0) issues.push(`question ${qi + 1} standards/competency mapping missing`);
        });
      } else if (!hasContent(lesson.content) && !String(lesson.rendered_html ?? '').trim() && !String(lesson.video_url ?? '').trim()) {
        issues.push('instructional content missing');
      }

      if (isPractical) {
        if (competencies.length === 0) issues.push('practical competency checks missing');
        if (!lesson.evidence_type) issues.push('practical evidence type missing');
        if (lesson.requires_instructor_signoff !== true) issues.push('authorized human sign-off missing');
      }

      if (issues.length > 0) blocking.push(`"${lesson.title}" (${module.title}): ${issues.join(', ')}`);
    }

    if (!moduleHasAssessment) blocking.push(`module "${module.title}" has no mastery assessment`);
  }

  if (totalLessons === 0) blocking.push('course has no lessons');
  if (approvedLessons !== totalLessons) blocking.push(`lesson approval incomplete (${approvedLessons}/${totalLessons})`);
  if (assessments === 0) blocking.push('course has no assessment/mastery system');
  if (competencyMappings === 0) blocking.push('course has no competency graph/mappings');
  if (interactiveLessons === 0) blocking.push('course has no interactive self-paced lesson experiences');

  if (mods.length > 1) {
    const { count, error } = await supabase
      .from('module_completion_rules')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', courseId);
    if (error) throw error;
    if ((count ?? 0) === 0) blocking.push('multiple modules but no mastery/progression rules');
  }

  return {
    pass: blocking.length === 0,
    blocking_issues: [...new Set(blocking)],
    metrics: {
      modules: mods.length,
      lessons: totalLessons,
      approvedLessons,
      assessments,
      practicals,
      competencyMappings,
      interactiveLessons,
    },
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || !['admin', 'staff', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { courseId } = await params;
    const body = await request.json().catch(() => ({}));
    const label: string | undefined = body.label;

    const health = await runProcurementHealthCheck(supabase, courseId);
    if (!health.pass) {
      await logAdminAudit({
        action: AdminAction.COURSE_PUBLISHED,
        actorId: user.id,
        entityType: 'courses',
        entityId: courseId,
        metadata: { blocked: true, label, blocking_issues: health.blocking_issues, metrics: health.metrics },
        req: request,
      });
      return NextResponse.json(
        { error: 'PUBLISH_BLOCKED', blocking_issues: health.blocking_issues, metrics: health.metrics },
        { status: 422 },
      );
    }

    const result = await publishCourse(supabase, courseId, user.id, label);

    await logAdminAudit({
      action: AdminAction.COURSE_PUBLISHED,
      actorId: user.id,
      entityType: 'courses',
      entityId: courseId,
      metadata: { label, lesson_count: (result as any)?.lessonCount, procurement_gate: health.metrics },
      req: request,
    });

    return NextResponse.json({ success: true, procurement_gate: health.metrics, ...result });
  } catch (error) {
    return safeInternalError(error, 'Failed to publish course');
  }
}
