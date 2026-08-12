import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().trim().min(1).max(250).optional(),
  slug: z.string().trim().min(1).max(150).optional(),
});

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 120);
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return safeError('Invalid clone request', 400);

  try {
    const db = await requireAdminClient();
    const { data: source, error: sourceError } = await db
      .from('courses')
      .select('*')
      .eq('id', parsed.data.courseId)
      .maybeSingle();
    if (sourceError) throw sourceError;
    if (!source) return safeError('Course not found', 404);

    const title = parsed.data.title || `${source.title} (Copy)`;
    const requestedBase = parsed.data.slug || `${source.slug}-copy`;
    const baseSlug = slugify(requestedBase) || `course-copy-${Date.now().toString(36)}`;
    let slug = baseSlug;
    for (let attempt = 2; attempt < 100; attempt += 1) {
      const { data: existing } = await db.from('courses').select('id').eq('slug', slug).maybeSingle();
      if (!existing) break;
      slug = `${baseSlug}-${attempt}`;
    }

    const now = new Date().toISOString();
    const { data: clone, error: cloneError } = await db
      .from('courses')
      .insert({
        program_id: source.program_id,
        legacy_course_id: null,
        slug,
        title,
        short_description: source.short_description,
        description: source.description,
        status: 'draft',
        is_active: false,
        published_at: null,
        course_name: title,
        generation_status: 'draft',
        generation_progress: 0,
        generation_paused: false,
        generator_prompt: source.generator_prompt,
        last_generated_at: null,
        thumbnail_url: source.thumbnail_url,
        total_lessons: source.total_lessons,
        duration_hours: source.duration_hours,
        review_status: 'draft',
        submitted_for_review_at: null,
        submitted_by: null,
        reviewed_at: null,
        reviewed_by: null,
        review_notes: null,
        org_id: source.org_id,
        version: 1,
        published_by: null,
        compliance_profile_key: source.compliance_profile_key,
        governing_body: source.governing_body,
        governing_region: source.governing_region,
        governing_standard_version: source.governing_standard_version,
        retention_policy_days: source.retention_policy_days,
        audit_notes: source.audit_notes,
        course_code: null,
        category: source.category,
        passing_score: source.passing_score,
        module_id: null,
        course_slug: slug,
        updated_at: now,
      })
      .select('id,title,slug')
      .single();
    if (cloneError) throw cloneError;

    const { data: modules, error: moduleLoadError } = await db
      .from('course_modules')
      .select('*')
      .eq('course_id', source.id)
      .order('order_index');
    if (moduleLoadError) throw moduleLoadError;

    const moduleIdMap = new Map<string, string>();
    for (const module of modules ?? []) {
      const { data: newModule, error: moduleError } = await db
        .from('course_modules')
        .insert({
          course_id: clone.id,
          title: module.title,
          description: module.description,
          order_index: module.order_index,
          duration_minutes: module.duration_minutes,
          content: module.content,
          video_url: module.video_url,
          duration: module.duration,
          is_required: module.is_required,
          order: module.order,
          type: module.type,
          is_published: false,
          available_from: null,
          is_draft: true,
          org_id: module.org_id ?? source.org_id,
          domain_key: module.domain_key,
          target_hours: module.target_hours,
          slug: module.slug,
          updated_at: now,
        })
        .select('id')
        .single();
      if (moduleError) throw moduleError;
      moduleIdMap.set(module.id, newModule.id);
    }

    const { data: lessons, error: lessonLoadError } = await db
      .from('course_lessons')
      .select('*')
      .eq('course_id', source.id)
      .order('order_index');
    if (lessonLoadError) throw lessonLoadError;

    if (lessons?.length) {
      const lessonRows = lessons.map((lesson) => ({
        course_id: clone.id,
        module_id: moduleIdMap.get(lesson.module_id) ?? null,
        legacy_lesson_id: null,
        slug: lesson.slug,
        title: lesson.title,
        content: lesson.content,
        lesson_type: lesson.lesson_type,
        order_index: lesson.order_index,
        passing_score: lesson.passing_score,
        quiz_questions: lesson.quiz_questions,
        is_required: lesson.is_required,
        video_url: lesson.video_url,
        activity_type: lesson.activity_type,
        scenario_prompt: lesson.scenario_prompt,
        key_terms: lesson.key_terms,
        status: 'draft',
        is_published: false,
        partner_exam_code: lesson.partner_exam_code,
        legacy_curriculum_id: null,
        duration_minutes: lesson.duration_minutes,
        video_config: lesson.video_config,
        activities: lesson.activities,
        rendered_html: lesson.rendered_html,
        generation_status: lesson.generation_status,
        locked: false,
        ai_generated: lesson.ai_generated,
        approved: false,
        generator_prompt: lesson.generator_prompt,
        last_generated_at: lesson.last_generated_at,
        domain_key: lesson.domain_key,
        required_skill_id: lesson.required_skill_id,
        required_reps: lesson.required_reps,
        requires_verification: lesson.requires_verification,
        learning_objectives: lesson.learning_objectives,
        competency_checks: lesson.competency_checks,
        instructor_notes: lesson.instructor_notes,
        practical_required: lesson.practical_required,
        unlock_rule: lesson.unlock_rule,
        required_artifacts: lesson.required_artifacts,
        rubric_id: lesson.rubric_id,
        script_text: lesson.script_text,
        resources: lesson.resources,
        version: 1,
        published_at: null,
        published_by: null,
        previous_version_id: null,
        org_id: lesson.org_id ?? source.org_id,
        media_asset_id: lesson.media_asset_id,
        script: lesson.script,
        bullet_points: lesson.bullet_points,
        duration_seconds: lesson.duration_seconds,
        scene_data: lesson.scene_data,
        video_status: lesson.video_url ? 'complete' : 'pending',
        video_job_id: null,
        video_error: null,
        video_generated_at: lesson.video_url ? lesson.video_generated_at : null,
        hour_category: lesson.hour_category,
        evidence_type: lesson.evidence_type,
        delivery_method: lesson.delivery_method,
        requires_instructor_signoff: lesson.requires_instructor_signoff,
        instructor_requirement: lesson.instructor_requirement,
        minimum_seat_time_minutes: lesson.minimum_seat_time_minutes,
        fieldwork_eligible: lesson.fieldwork_eligible,
        compliance_profile_key: lesson.compliance_profile_key,
        content_json: lesson.content_json ?? {},
        updated_at: now,
      }));
      const { error: lessonError } = await db.from('course_lessons').insert(lessonRows);
      if (lessonError) throw lessonError;
    }

    await logAdminAudit({
      action: AdminAction.CAREER_COURSE_CREATED,
      actorId: auth.id,
      entityType: 'courses',
      entityId: clone.id,
      metadata: { sourceCourseId: source.id, operation: 'course.clone', moduleCount: modules?.length ?? 0, lessonCount: lessons?.length ?? 0 },
      req: request,
    });

    return NextResponse.json({ ok: true, course: clone, moduleCount: modules?.length ?? 0, lessonCount: lessons?.length ?? 0 });
  } catch (error) {
    return safeInternalError(error, 'Failed to clone course');
  }
}
