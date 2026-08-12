import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { getComplianceProfile } from '@/lib/course-builder/compliance-profiles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Check = { key: string; ok: boolean; severity: 'error' | 'warning' | 'info'; message: string };

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const courseId = request.nextUrl.searchParams.get('courseId');
  if (!courseId) return safeError('courseId is required', 400);

  try {
    const db = await requireAdminClient();
    const { data: course, error: courseError } = await db
      .from('courses')
      .select('id,title,status,is_active,program_id,duration_hours,passing_score,compliance_profile_key,governing_body,governing_region,governing_standard_version')
      .eq('id', courseId)
      .maybeSingle();
    if (courseError) throw courseError;
    if (!course) return safeError('Course not found', 404);

    const [{ data: modules, error: moduleError }, { data: lessons, error: lessonError }] = await Promise.all([
      db.from('course_modules').select('id,title,order_index,target_hours,domain_key,is_published,is_draft').eq('course_id', courseId).order('order_index'),
      db.from('course_lessons').select('id,module_id,title,lesson_type,duration_minutes,minimum_seat_time_minutes,passing_score,status,is_published,approved,learning_objectives,practical_required,requires_instructor_signoff,competency_checks,hour_category,delivery_method,content,content_json,video_url').eq('course_id', courseId).order('order_index'),
    ]);
    if (moduleError) throw moduleError;
    if (lessonError) throw lessonError;

    const profileKey = course.compliance_profile_key || 'internal_basic';
    const profile = getComplianceProfile(profileKey);
    const moduleRows = modules ?? [];
    const lessonRows = lessons ?? [];
    const assessments = lessonRows.filter((lesson) => ['quiz', 'checkpoint', 'exam'].includes(lesson.lesson_type || ''));
    const exams = lessonRows.filter((lesson) => lesson.lesson_type === 'exam');
    const practicals = lessonRows.filter((lesson) => Boolean(lesson.practical_required));
    const declaredHours = Number(course.duration_hours ?? 0);
    const lessonMinutes = lessonRows.reduce((sum, lesson) => sum + Number(lesson.minimum_seat_time_minutes ?? lesson.duration_minutes ?? 0), 0);
    const lessonHours = lessonMinutes / 60;
    const moduleTargetHours = moduleRows.reduce((sum, mod) => sum + Number(mod.target_hours ?? 0), 0);
    const missingObjectives = lessonRows.filter((lesson) => !Array.isArray(lesson.learning_objectives) || lesson.learning_objectives.length === 0);
    const missingAssessmentScores = assessments.filter((lesson) => lesson.passing_score == null);
    const missingHourCategories = lessonRows.filter((lesson) => !lesson.hour_category);
    const missingDeliveryMethods = lessonRows.filter((lesson) => !lesson.delivery_method);
    const missingCompetencies = lessonRows.filter((lesson) => !Array.isArray(lesson.competency_checks) || lesson.competency_checks.length === 0);
    const practicalWithoutSignoff = practicals.filter((lesson) => !lesson.requires_instructor_signoff);
    const emptyLessons = lessonRows.filter((lesson) => !String(lesson.content ?? '').trim() && !lesson.content_json);
    const unapprovedLessons = lessonRows.filter((lesson) => !lesson.approved);

    const checks: Check[] = [];
    const add = (key: string, ok: boolean, severity: Check['severity'], message: string) => checks.push({ key, ok, severity, message });

    add('modules', moduleRows.length > 0, 'error', moduleRows.length ? `${moduleRows.length} modules present.` : 'Course has no modules.');
    add('lessons', lessonRows.length > 0, 'error', lessonRows.length ? `${lessonRows.length} lessons present.` : 'Course has no lessons.');
    add('content', emptyLessons.length === 0, 'error', emptyLessons.length ? `${emptyLessons.length} lessons have no instructional content.` : 'All lessons contain content.');
    add('objectives', missingObjectives.length === 0, 'warning', missingObjectives.length ? `${missingObjectives.length} lessons are missing learning objectives.` : 'All lessons have learning objectives.');
    add('lesson_approval', unapprovedLessons.length === 0 && lessonRows.length > 0, 'error', unapprovedLessons.length ? `${unapprovedLessons.length} lessons still require instructional review/approval.` : 'All lessons are approved.');
    add('compliance_profile', Boolean(course.compliance_profile_key), profileKey === 'internal_basic' ? 'warning' : 'error', course.compliance_profile_key ? `Compliance profile: ${profileKey}.` : 'No explicit compliance profile; internal_basic fallback is being used.');
    add('minimum_hours', declaredHours >= profile.minimumProgramHours, 'error', `Declared hours ${declaredHours}; profile minimum ${profile.minimumProgramHours}.`);
    add('lesson_hours', lessonHours > 0, 'error', `Configured lesson seat time: ${lessonHours.toFixed(2)} hours.`);
    if (declaredHours > 0) {
      const gap = Math.abs(declaredHours - lessonHours);
      add('hour_reconciliation', gap <= Math.max(1, declaredHours * 0.05), profileKey === 'internal_basic' ? 'warning' : 'error', `Declared ${declaredHours} hours vs configured lesson seat time ${lessonHours.toFixed(2)} hours.`);
    }
    if (moduleTargetHours > 0) add('module_targets', Math.abs(moduleTargetHours - declaredHours) <= Math.max(1, declaredHours * 0.05), 'warning', `Module target hours total ${moduleTargetHours.toFixed(2)}.`);
    if (profile.requiresFinalExam) add('final_exam', exams.length > 0, 'error', exams.length ? `${exams.length} final exam lesson(s) present.` : 'Compliance profile requires a final exam.');
    if (profile.requirePassingScoresForAssessments) add('assessment_scores', missingAssessmentScores.length === 0, 'error', missingAssessmentScores.length ? `${missingAssessmentScores.length} assessments are missing passing scores.` : 'All assessments have passing scores.');
    if (profile.requireHourCategory) add('hour_categories', missingHourCategories.length === 0, 'error', missingHourCategories.length ? `${missingHourCategories.length} lessons are missing hour categories.` : 'All lessons have hour categories.');
    if (profile.requireDeliveryMethod) add('delivery_methods', missingDeliveryMethods.length === 0, 'error', missingDeliveryMethods.length ? `${missingDeliveryMethods.length} lessons are missing delivery methods.` : 'All lessons have delivery methods.');
    if (profile.requireCompetencyMapping) add('competencies', missingCompetencies.length === 0, 'error', missingCompetencies.length ? `${missingCompetencies.length} lessons are missing competency mappings.` : 'All lessons have competency mappings.');
    if (profile.requireInstructorSignoffForPracticals) add('practical_signoff', practicalWithoutSignoff.length === 0, 'error', practicalWithoutSignoff.length ? `${practicalWithoutSignoff.length} practical lessons are missing instructor sign-off requirements.` : 'Practical sign-off rules are configured.');
    if (profile.requireRetentionPolicy) add('governance', Boolean(course.governing_body && course.governing_region), 'error', course.governing_body && course.governing_region ? 'Governing body and region are configured.' : 'Governing body and region are required for this profile.');

    const blockers = checks.filter((check) => !check.ok && check.severity === 'error');
    const warnings = checks.filter((check) => !check.ok && check.severity === 'warning');

    return NextResponse.json({
      ok: true,
      ready: blockers.length === 0,
      course,
      profile: { key: profileKey, label: profile.profileLabel, minimumProgramHours: profile.minimumProgramHours },
      metrics: {
        modules: moduleRows.length,
        lessons: lessonRows.length,
        approvedLessons: lessonRows.length - unapprovedLessons.length,
        assessments: assessments.length,
        exams: exams.length,
        practicals: practicals.length,
        declaredHours,
        lessonHours: Number(lessonHours.toFixed(2)),
        moduleTargetHours: Number(moduleTargetHours.toFixed(2)),
        missingObjectives: missingObjectives.length,
      },
      checks,
      blockerCount: blockers.length,
      warningCount: warnings.length,
    });
  } catch (error) {
    return safeInternalError(error, 'Failed to audit course readiness');
  }
}
