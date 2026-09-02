import type { NextRequest } from 'next/server';
import type { SupabaseClient } from '../supabase';
import { createClient } from '../supabase/server';
import { publishCourse } from '../lms/course-service';
import { logAdminAudit, AdminAction } from '../admin/audit-log';
import { normalizeGeneratedCourseForGovernance } from '../course-factory/post-generation-governance';
import { getCourseMediaState } from '../course-factory/media-manager';

const ASSESSMENT_TYPES = new Set(['quiz', 'checkpoint', 'exam', 'final_exam']);
const PRACTICAL_TYPES = new Set(['practical', 'lab', 'fieldwork', 'observation', 'practicum']);

function asArray(value: unknown): any[] { return Array.isArray(value) ? value : []; }
function hasContent(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0;
  return !!value && typeof value === 'object' && Object.keys(value as Record<string, unknown>).length > 0;
}
export const AUTOMATED_COURSE_GATE_VERSION = 'course-quality-v1';

/**
 * Canonical persisted-course procurement gate.
 * Static repository catalogs are intentionally unsupported; persisted records
 * and their machine-verifiable evidence are the only publication authority.
 * Publication is automatic only after the complete deterministic gate passes.
 */
export async function runPersistedCourseProcurementHealthCheckWithClient(supabase: SupabaseClient, courseId: string) {
  const blocking: string[] = [];
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id,title,slug,description,status,review_status,reviewed_by,reviewed_at,generation_status,generation_progress,compliance_profile_key,governing_body,governing_standard_version,duration_hours,passing_score')
    .eq('id', courseId).maybeSingle();
  if (courseError) throw courseError;
  if (!course) return { pass: false, blocking_issues: ['course not found'], metrics: {} };

  if (!course.title?.trim()) blocking.push('course title is missing');
  if (!course.slug?.trim()) blocking.push('course slug is missing');
  if (!course.description?.trim()) blocking.push('course description is missing');
  if (!course.duration_hours || Number(course.duration_hours) <= 0) blocking.push('course duration_hours is missing');
  const externalProfile = Boolean(course.compliance_profile_key && course.compliance_profile_key !== 'internal_basic');
  if (externalProfile && !course.governing_body?.trim()) blocking.push('governing body is missing');
  if (externalProfile && !course.governing_standard_version?.trim()) blocking.push('governing standard/test-plan version is missing');
  if (course.generation_status && !['completed', 'published'].includes(course.generation_status)) blocking.push(`course generation is not complete (${course.generation_status}, ${course.generation_progress ?? 0}%)`);

  const { data: modules, error: moduleError } = await supabase.from('course_modules').select(`
    id,title,slug,domain_key,target_hours,order_index,
    course_lessons(id,title,slug,lesson_type,content,rendered_html,video_url,video_config,quiz_questions,passing_score,duration_minutes,generation_status,ai_generated,approved,domain_key,hour_category,delivery_method,learning_objectives,competency_checks,practical_required,evidence_type,requires_instructor_signoff,content_json)
  `).eq('course_id', courseId).order('order_index', { ascending: true });
  if (moduleError) throw moduleError;

  const mods = modules ?? [];
  if (mods.length === 0) blocking.push('course has no modules');
  let totalLessons = 0, assessments = 0, practicals = 0, competencyMappings = 0, interactiveLessons = 0, accessibleNarrationLessons = 0, validatedLessons = 0;
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
      const objectives = asArray(lesson.learning_objectives), competencies = asArray(lesson.competency_checks), questions = asArray(lesson.quiz_questions);
      const contentJson = lesson.content_json && typeof lesson.content_json === 'object' ? lesson.content_json as Record<string, any> : {};
      const experience = contentJson.experience && typeof contentJson.experience === 'object' ? contentJson.experience as Record<string, any> : null;
      if (isAssessment) { assessments += 1; moduleHasAssessment = true; }
      if (isPractical) practicals += 1;
      competencyMappings += competencies.length;
      if (experience && Object.keys(experience).length > 0) interactiveLessons += 1;
      if (String(experience?.narrationScript ?? '').trim()) accessibleNarrationLessons += 1;
      if (lesson.approved === true) validatedLessons += 1;
      if (!type) issues.push('lesson_type missing');
      if (!lesson.slug?.trim()) issues.push('slug missing');
      if (!lesson.duration_minutes || Number(lesson.duration_minutes) <= 0) issues.push('duration missing');
      if (objectives.length === 0) issues.push('learning objectives missing');
      if (!lesson.domain_key?.trim()) issues.push('standards/domain mapping missing');
      if (!lesson.hour_category) issues.push('hour category missing');
      if (!lesson.delivery_method) issues.push('delivery method missing');
      if (lesson.ai_generated === true && lesson.generation_status && !['verification_ready','certificate_ready','published','completed','generated'].includes(lesson.generation_status)) issues.push(`generation not ready (${lesson.generation_status})`);
      if (isAssessment) {
        if (questions.length === 0) issues.push('assessment has no questions');
        if (lesson.passing_score == null) issues.push('assessment passing score missing');
        questions.forEach((question: any, qi: number) => {
          if (!String(question?.explanation ?? '').trim()) issues.push(`question ${qi + 1} rationale missing`);
          if (!question?.domainKey && asArray(question?.competencyKeys).length === 0) issues.push(`question ${qi + 1} standards/competency mapping missing`);
        });
      } else {
        if (!hasContent(lesson.content) && !String(lesson.rendered_html ?? '').trim() && !String(lesson.video_url ?? '').trim()) issues.push('instructional content missing');
        if (lesson.ai_generated === true && !isPractical) {
          if (!experience) issues.push('canonical interactive lesson experience missing');
          else {
            if (!String(experience.narrationScript ?? '').trim()) issues.push('narration/transcript missing');
            if (!String(experience.visualPrompt ?? '').trim()) issues.push('visual specification missing');
            if (asArray(experience.flashcards).length < 4) issues.push('fewer than 4 flashcards');
            if (asArray(experience.knowledgeChecks).length < 3) issues.push('fewer than 3 formative knowledge checks');
            if (!experience.remediation || Number(experience.remediation.passingScore ?? 0) <= 0) issues.push('mastery remediation plan missing');
          }
        }
        if (lesson.video_url) {
          const videoConfig = lesson.video_config && typeof lesson.video_config === 'object' ? lesson.video_config as Record<string, any> : {};
          if (!String(experience?.narrationScript ?? videoConfig.transcript ?? '').trim()) issues.push('video has no transcript/narration text for accessibility');
        }
      }
      if (isPractical) {
        if (competencies.length === 0) issues.push('practical competency checks missing');
        if (!lesson.evidence_type) issues.push('practical evidence type missing');
        if (lesson.requires_instructor_signoff !== true) issues.push('authorized human sign-off missing for practical competency');
      }
      if (issues.length) blocking.push(`"${lesson.title}" (${module.title}): ${issues.join(', ')}`);
    }
    if (!moduleHasAssessment) blocking.push(`module "${module.title}" has no mastery assessment`);
  }
  if (totalLessons === 0) blocking.push('course has no lessons');
  if (assessments === 0) blocking.push('course has no assessment/mastery system');
  if (competencyMappings === 0) blocking.push('course has no competency graph/mappings');
  if (interactiveLessons === 0) blocking.push('course has no interactive self-paced lesson experiences');
  if (mods.length > 1) {
    const { count, error } = await supabase.from('module_completion_rules').select('id', { count: 'exact', head: true }).eq('course_id', courseId);
    if (error) throw error;
    if ((count ?? 0) === 0) blocking.push('multiple modules but no mastery/progression rules');
  }
  return {
    pass: blocking.length === 0,
    blocking_issues: [...new Set(blocking)],
    metrics: {
      modules: mods.length,
      lessons: totalLessons,
      assessments,
      practicals,
      competencyMappings,
      interactiveLessons,
      accessibleNarrationLessons,
      validatedLessons,
      review_status: course.review_status ?? null,
      reviewed_by: course.reviewed_by ?? null,
      reviewed_at: course.reviewed_at ?? null,
      reviewMode: 'automated_quality_gate',
      gateVersion: AUTOMATED_COURSE_GATE_VERSION,
    },
  };
}

export async function runPersistedCourseProcurementHealthCheck(courseId: string) { return runPersistedCourseProcurementHealthCheckWithClient(await createClient(), courseId); }

export async function repairPersistedCourseAcceptanceWithClient(input: {
  db: SupabaseClient;
  courseId: string;
  maxAttempts?: number;
}) {
  const maxAttempts = Math.max(1, Math.min(3, Math.round(input.maxAttempts ?? 2)));
  const repairs: Array<{ attempt: number; blockingBefore: string[]; normalization: unknown }> = [];
  let health = await runPersistedCourseProcurementHealthCheckWithClient(input.db, input.courseId);

  for (let attempt = 1; !health.pass && attempt <= maxAttempts; attempt += 1) {
    const blockingBefore = [...health.blocking_issues];
    const normalization = await normalizeGeneratedCourseForGovernance(input.courseId);
    repairs.push({ attempt, blockingBefore, normalization });
    health = await runPersistedCourseProcurementHealthCheckWithClient(input.db, input.courseId);

    // Stop a deterministic no-progress loop. Content generation itself already
    // has bounded schema-repair retries and durable checkpoints upstream.
    if (
      !health.pass &&
      health.blocking_issues.length === blockingBefore.length &&
      health.blocking_issues.every((issue, index) => issue === blockingBefore[index])
    ) break;
  }

  return { ...health, repairs, repaired: repairs.length > 0 };
}

export async function publishPersistedCourseWithClient(input: { db: SupabaseClient; courseId: string; actorId: string; label?: string; request?: NextRequest; }) {
  const health = await repairPersistedCourseAcceptanceWithClient({
    db: input.db,
    courseId: input.courseId,
  });
  if (!health.pass) {
    if (input.actorId) await logAdminAudit({ action: AdminAction.COURSE_PUBLISHED, actorId: input.actorId, entityType: 'courses', entityId: input.courseId, metadata: { repair_exhausted: true, label: input.label, blocking_issues: health.blocking_issues, metrics: health.metrics, repairs: health.repairs }, req: input.request });
    return { ok: false as const, error: 'AUTOMATED_REPAIR_EXHAUSTED', blocking_issues: health.blocking_issues, metrics: health.metrics, repairs: health.repairs };
  }
  const evidence = {
    passed: true,
    evaluated_at: new Date().toISOString(),
    metrics: health.metrics,
    repairs: health.repairs,
  };
  const { data: automatedApprovalId, error: approvalError } = await input.db.rpc(
    'record_course_automated_approval',
    {
      p_course_id: input.courseId,
      p_gate_version: AUTOMATED_COURSE_GATE_VERSION,
      p_evidence: evidence,
      p_initiated_by: input.actorId || null,
    },
  );
  if (approvalError) {
    return {
      ok: false as const,
      error: 'AUTOMATED_APPROVAL_RECORD_FAILED',
      blocking_issues: [approvalError.message],
      metrics: health.metrics,
      repairs: health.repairs,
    };
  }
  const result = await publishCourse(input.db, input.courseId, input.actorId, input.label);
  await logAdminAudit({ action: AdminAction.COURSE_PUBLISHED, actorId: input.actorId, entityType: 'courses', entityId: input.courseId, metadata: { label: input.label, lesson_count: (result as any)?.lessonCount, procurement_gate: health.metrics, review_mode: 'automated_quality_gate', automated_approval_id: automatedApprovalId, repairs: health.repairs }, req: input.request });
  return { ok: true as const, automated_approval_id: automatedApprovalId, procurement_gate: health.metrics, repairs: health.repairs, ...result };
}

export async function publishPersistedCourse(input: { courseId: string; actorId: string; label?: string; request?: NextRequest; }) { return publishPersistedCourseWithClient({ ...input, db: await createClient() }); }

/**
 * Idempotent terminal step for AI-controlled course builds. Media completion
 * invokes this function; it never starts paid work and never publishes a
 * partial package.
 */
export async function finalizeCourseAutomaticallyIfReadyWithClient(input: {
  db: SupabaseClient;
  courseId: string;
  actorId: string;
}) {
  const { data: course, error } = await input.db
    .from('courses')
    .select('id,status,generation_status')
    .eq('id', input.courseId)
    .maybeSingle();
  if (error) throw error;
  if (!course) return { ok: false as const, state: 'missing' as const };
  if (course.status === 'published' || course.generation_status === 'published') {
    return { ok: true as const, state: 'already_published' as const };
  }
  if (!['completed', 'review'].includes(String(course.generation_status ?? ''))) {
    return { ok: false as const, state: 'generation_pending' as const };
  }

  const media = await getCourseMediaState(input.courseId, { verifyUrls: true });
  if (!media.completePackage) {
    return { ok: false as const, state: 'media_pending' as const, media };
  }

  const publication = await publishPersistedCourseWithClient({
    db: input.db,
    courseId: input.courseId,
    actorId: input.actorId,
    label: 'Automated quality-gate publication',
  });
  return publication.ok
    ? { ok: true as const, state: 'published' as const, media, publication }
    : { ok: false as const, state: 'quality_gate_failed' as const, media, publication };
}
