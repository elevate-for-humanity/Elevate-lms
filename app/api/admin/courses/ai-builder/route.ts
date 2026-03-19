/**
 * POST /api/admin/courses/ai-builder
 *
 * Generates a complete course draft with AI and saves it to the real LMS tables.
 *
 * Schema mapping:
 *   training_courses      ← course_name, title, description, summary, difficulty,
 *                            duration_hours, is_published=false, metadata
 *   training_lessons      ← course_id, lesson_number, title, description, content,
 *                            order_index, is_published=false, quiz_questions (jsonb)
 *   lesson_content_blocks ← lesson_id, block_type, content (jsonb), order_index
 *
 * Quizzes table uses integer PKs incompatible with training_courses UUID — quiz data
 * is stored in training_lessons.quiz_questions (jsonb) instead.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { logger } from '@/lib/logger';
import { generateCourse } from '@/lib/ai/course-generator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120; // AI generation can take up to 60s

// ─── Auth guard ────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const supabase = await createClient();
  if (!supabase) return { error: 'Database unavailable', status: 503 as const };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 as const };

  const adminDb = createAdminClient();
  if (!adminDb) return { error: 'Database unavailable', status: 503 as const };

  const { data: profile } = await adminDb
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin', 'instructor'].includes(profile.role)) {
    return { error: 'Forbidden', status: 403 as const };
  }

  return { user, adminDb };
}

// ─── Input schema ──────────────────────────────────────────────────────────────

const InputSchema = z.object({
  prompt: z.string().min(10, 'Prompt must be at least 10 characters').max(20000),
  courseTitle: z.string().max(200).optional(),
  audience: z.string().max(200).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  lessonCount: z.number().int().min(1).max(20).optional(),
  durationHours: z.number().min(0.5).max(200).optional(),
  tone: z.string().max(100).optional(),
  includeQuiz: z.boolean().optional(),
  includeReflection: z.boolean().optional(),
});

// ─── Slug generator ────────────────────────────────────────────────────────────

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
    + '-' + Date.now().toString(36);
}

// ─── Handler ───────────────────────────────────────────────────────────────────

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const auth = await requireAdmin();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { user, adminDb } = auth;

    // Parse + validate input
    const body = await request.json().catch(() => null);
    const parsed = InputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const opts = parsed.data;
    logger.info('[AI Course Builder] Starting generation', {
      userId: user.id,
      promptLength: opts.prompt.length,
      lessonCount: opts.lessonCount,
    });

    // ── Step 1: Generate course draft ────────────────────────────────────────
    const draft = await generateCourse(opts);

    logger.info('[AI Course Builder] Draft generated', {
      title: draft.title,
      lessonCount: draft.lessons.length,
    });

    // LEGACY_SYSTEM_DISABLED — AI-generated courses must use /api/admin/lms/courses/generate
    return NextResponse.json(
      { error: 'LEGACY_SYSTEM_DISABLED: use POST /api/admin/lms/courses/generate' },
      { status: 410 }
    );

    // ── Step 2: Insert training_courses ──────────────────────────────────────
    const { data: course, error: courseErr } = await adminDb
      .from('training_courses')
      .insert({
        course_name: draft.course_name,          // NOT NULL
        title: draft.title,
        description: draft.description || null,
        summary: draft.summary || null,
        difficulty: draft.difficulty,
        duration_hours: draft.duration_hours || null,
        is_published: false,
        is_active: false,
        created_by: user.id,
        slug: toSlug(draft.title),
        metadata: {
          learning_objectives: draft.learning_objectives,
          ai_generated: true,
          generated_at: new Date().toISOString(),
          generator_version: '1.0',
          source_prompt: opts.prompt.slice(0, 500),
        },
      })
      .select('id, course_name, title, slug')
      .single();

    if (courseErr || !course) {
      logger.error('[AI Course Builder] Course insert failed', courseErr);
      return NextResponse.json(
        { error: 'Failed to save course', detail: courseErr?.message },
        { status: 500 }
      );
    }

    logger.info('[AI Course Builder] Course saved', { courseId: course.id });

    // ── Step 3: Insert training_lessons + lesson_content_blocks ─────────────
    const lessonResults: { id: string; title: string; lesson_number: number }[] = [];
    const lessonErrors: string[] = [];

    for (let i = 0; i < draft.lessons.length; i++) {
      const lessonDraft = draft.lessons[i];
      const lessonNumber = i + 1;

      const { data: lesson, error: lessonErr } = await adminDb
        .from('training_lessons')
        .insert({
          course_id: course.id,
          lesson_number: lessonNumber,           // NOT NULL
          title: lessonDraft.title,              // NOT NULL
          description: lessonDraft.description || null,
          content: lessonDraft.content || null,
          order_index: i,
          is_published: false,
          duration_minutes: lessonDraft.duration_minutes || null,
          // Store quiz questions in the jsonb column — quizzes table uses integer PKs
          // incompatible with this course's UUID, so we use the native jsonb field.
          quiz_questions: lessonDraft.quiz_questions.length > 0
            ? lessonDraft.quiz_questions
            : null,
        })
        .select('id, title, lesson_number')
        .single();

      if (lessonErr || !lesson) {
        logger.error('[AI Course Builder] Lesson insert failed', { lessonNumber, error: lessonErr });
        lessonErrors.push(`Lesson ${lessonNumber}: ${lessonErr?.message || 'unknown error'}`);
        continue;
      }

      lessonResults.push(lesson);

      // Insert lesson_content_blocks for structured content
      const blocks = [
        // Block 0: main content
        {
          lesson_id: lesson.id,
          block_type: 'text',
          order_index: 0,
          content: { text: lessonDraft.content },
        },
        // Block 1: key takeaways
        ...(lessonDraft.key_takeaways.length > 0 ? [{
          lesson_id: lesson.id,
          block_type: 'callout',
          order_index: 1,
          content: {
            heading: 'Key Takeaways',
            items: lessonDraft.key_takeaways,
          },
        }] : []),
        // Block 2: reflection prompt
        ...(lessonDraft.reflection_prompt ? [{
          lesson_id: lesson.id,
          block_type: 'reflection',
          order_index: 2,
          content: {
            prompt: lessonDraft.reflection_prompt,
          },
        }] : []),
      ];

      if (blocks.length > 0) {
        const { error: blockErr } = await adminDb
          .from('lesson_content_blocks')
          .insert(blocks);

        if (blockErr) {
          // Non-fatal — lesson is saved, blocks are supplementary
          logger.warn('[AI Course Builder] Content blocks insert failed', {
            lessonId: lesson.id,
            error: blockErr,
          });
        }
      }
    }

    // ── Step 4: Log to ai_course_generation_log ──────────────────────────────
    await adminDb
      .from('ai_course_generation_log')
      .insert({
        user_id: user.id,
        action: 'course_generated',
        details: {
          course_id: course.id,
          course_title: draft.title,
          lesson_count: lessonResults.length,
          prompt_length: opts.prompt.length,
          options: {
            difficulty: opts.difficulty,
            lessonCount: opts.lessonCount,
            includeQuiz: opts.includeQuiz,
          },
        },
      })
      .catch(() => {}); // Non-fatal

    // ── Step 5: Return result ────────────────────────────────────────────────
    const hasPartialFailure = lessonErrors.length > 0;

    return NextResponse.json(
      {
        success: true,
        courseId: course.id,
        courseTitle: draft.title,
        slug: course.slug,
        lessonCount: lessonResults.length,
        lessons: lessonResults,
        learningObjectives: draft.learning_objectives,
        ...(hasPartialFailure && { warnings: lessonErrors }),
        adminUrl: `/admin/courses/${course.id}/content`,
      },
      { status: 201 }
    );

  } catch (error) {
    logger.error('[AI Course Builder] Unhandled error', error);
    const message = error instanceof Error ? error.message : 'Generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/admin/courses/ai-builder', _POST, {
  actor_type: 'admin',
  skip_body: true, // prompt may contain large text
});
