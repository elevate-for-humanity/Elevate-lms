import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { COMPLIANCE_PROFILES } from '@/lib/course-builder/compliance-profiles';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QuestionSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string()).min(2),
  correct_index: z.number().int().min(0),
  explanation: z.string().optional().default(''),
});
const LessonSchema = z.object({
  lesson_number: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().optional().default(''),
  objectives: z.array(z.string()).optional().default([]),
  content: z.string().optional().default(''),
  content_type: z.enum(['video', 'reading', 'quiz', 'assignment']).optional().default('reading'),
  duration_minutes: z.number().int().positive().optional().default(20),
  is_required: z.boolean().optional().default(true),
  quiz_questions: z.array(QuestionSchema).optional().default([]),
});
const CourseSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional().default(''),
  description: z.string().min(1),
  audience: z.string().optional().default(''),
  duration_hours: z.number().positive(),
  category: z.string().optional().default('workforce'),
  passing_score: z.number().min(0).max(100).optional().default(70),
  completion_rule: z.enum(['all_lessons', 'required_lessons']).optional().default('all_lessons'),
  modules: z.array(z.object({
    title: z.string().min(1),
    sort_order: z.number().int().positive(),
    lessons: z.array(LessonSchema).min(1),
  })).min(1),
});
const BodySchema = z.object({
  course: CourseSchema,
  programId: z.string().uuid().optional(),
  complianceProfileKey: z.string().optional(),
  state: z.string().optional(),
  credentialOrExam: z.string().optional(),
});

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 90);
}

function inferProfile(input: z.infer<typeof BodySchema>): string {
  if (input.complianceProfileKey && COMPLIANCE_PROFILES[input.complianceProfileKey]) return input.complianceProfileKey;
  const signal = `${input.course.title} ${input.course.description} ${input.credentialOrExam ?? ''}`.toLowerCase();
  if (/(apprentice|apprenticeship|dol|rapids)/.test(signal)) return 'dol_apprenticeship';
  if (/(naadac|peer recovery|peer support|crs|prs)/.test(signal)) return 'naadac_peer_support';
  if (/(state board|license|licensure|barber|cosmetology|esthetic|nail)/.test(signal)) return 'state_board_strict';
  if (/(credential|certification|regulated|exam)/.test(signal)) return 'custom_regulated';
  return 'internal_basic';
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return safeError('Invalid reviewed course payload', 400);
  const input = parsed.data;
  const profileKey = inferProfile(input);
  const profile = COMPLIANCE_PROFILES[profileKey];

  try {
    const db = await requireAdminClient();
    const baseSlug = slugify(input.course.title) || 'ai-course';
    const slug = `${baseSlug}-${Date.now().toString(36)}`;
    const now = new Date().toISOString();

    const { data: course, error: courseError } = await db.from('courses').insert({
      title: input.course.title,
      course_name: input.course.title,
      slug,
      course_slug: slug,
      short_description: input.course.subtitle || input.course.description.slice(0, 200),
      description: input.course.description,
      category: input.course.category,
      program_id: input.programId ?? null,
      duration_hours: input.course.duration_hours,
      passing_score: input.course.passing_score,
      status: 'draft',
      review_status: 'draft',
      is_active: false,
      compliance_profile_key: profileKey,
      governing_region: input.state ?? null,
      governing_body:
        profileKey === 'dol_apprenticeship'
          ? 'U.S. Department of Labor Registered Apprenticeship'
          : profileKey === 'state_board_strict'
            ? `${input.state ?? 'State'} licensing authority`
            : null,
      metadata: {
        source: 'ai_course_builder_chat',
        audience: input.course.audience,
        completionRule: input.course.completion_rule,
        credentialOrExam: input.credentialOrExam ?? null,
        complianceProfileKey: profileKey,
        humanReviewRequired: true,
      },
      updated_at: now,
    }).select('id,title,slug').single();
    if (courseError) throw courseError;

    let lessonCount = 0;
    for (const module of [...input.course.modules].sort((a, b) => a.sort_order - b.sort_order)) {
      const moduleSlug = `${slugify(module.title)}-${module.sort_order}`;
      const { data: moduleRow, error: moduleError } = await db.from('course_modules').insert({
        course_id: course.id,
        title: module.title,
        slug: moduleSlug,
        order_index: module.sort_order,
        order: module.sort_order,
        is_published: false,
        is_draft: true,
        target_hours: module.lessons.reduce((sum, lesson) => sum + lesson.duration_minutes, 0) / 60,
        updated_at: now,
      }).select('id').single();
      if (moduleError) throw moduleError;

      const lessonRows = module.lessons.map((lesson) => ({
        course_id: course.id,
        module_id: moduleRow.id,
        title: lesson.title,
        slug: `${moduleSlug}-${slugify(lesson.title)}-${lesson.lesson_number}`,
        order_index: lesson.lesson_number,
        lesson_type: lesson.content_type === 'quiz' ? 'quiz' : lesson.content_type === 'assignment' ? 'assignment' : 'lesson',
        content: lesson.content,
        rendered_html: null,
        learning_objectives: lesson.objectives,
        duration_minutes: lesson.duration_minutes,
        minimum_seat_time_minutes: lesson.duration_minutes,
        is_required: lesson.is_required,
        quiz_questions: lesson.quiz_questions.map((question) => ({
          question: question.question,
          options: question.options,
          correct: question.correct_index,
          explanation: question.explanation,
        })),
        passing_score: lesson.quiz_questions.length ? input.course.passing_score : null,
        status: 'draft',
        is_published: false,
        approved: false,
        ai_generated: true,
        content_json: {},
        compliance_profile_key: profileKey,
        updated_at: now,
      }));
      const { error: lessonError } = await db.from('course_lessons').insert(lessonRows);
      if (lessonError) throw lessonError;
      lessonCount += lessonRows.length;
    }

    await db.from('courses').update({ total_lessons: lessonCount, updated_at: new Date().toISOString() }).eq('id', course.id);
    await logAdminAudit({
      action: AdminAction.BULK_CONTENT_GENERATED,
      actorId: auth.id,
      entityType: 'courses',
      entityId: course.id,
      metadata: { operation: 'course.chat_saved', modules: input.course.modules.length, lessons: lessonCount, complianceProfileKey: profileKey },
      req: request,
    });

    return NextResponse.json({ ok: true, courseId: course.id, title: course.title, modules: input.course.modules.length, lessons: lessonCount, compliance_profile_key: profileKey, review_required: true });
  } catch (error) {
    return safeInternalError(error, 'Failed to save AI-designed course');
  }
}
