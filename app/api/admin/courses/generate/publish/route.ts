/**
 * POST /api/admin/courses/generate/publish
 *
 * Writes a reviewed GeneratedCourse into production tables:
 *   training_courses  — course record
 *   training_lessons  — one row per lesson
 *   completion_rules  — one rule per course
 *   program_courses   — if program_id provided
 *
 * Returns { courseId, lessonCount }
 */

import { NextRequest, NextResponse } from 'next/server';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { getCurrentUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import type { GeneratedCourse } from '../route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { course, program_id, is_published = false }
      : { course: GeneratedCourse; program_id?: string; is_published?: boolean } = body;

    if (!course?.title || !course.modules?.length) {
      return NextResponse.json({ error: 'Invalid course data' }, { status: 400 });
    }

    const db = createAdminClient();

    // ── 1. Course record ────────────────────────────────────────────────────
    const slug = course.title
      .toLowerCase().trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 80);

    const durationHours = course.duration_hours ||
      Math.ceil(
        course.modules.reduce(
          (n, m) => n + m.lessons.reduce((s, l) => s + (l.duration_minutes || 10), 0), 0
        ) / 60
      );

    const { data: courseRow, error: courseErr } = await db
      .from('training_courses')
      .insert({
        course_name:    course.title,
        title:          course.title,
        description:    course.description,
        category:       course.category,
        duration_hours: durationHours,
        slug,
        is_published,
        is_active:      is_published,
        status:         is_published ? 'published' : 'draft',
        passing_score:  course.passing_score ?? 70,
        metadata: {
          subtitle:     course.subtitle,
          audience:     course.audience,
          generated:    true,
          generated_at: new Date().toISOString(),
          generated_by: user.id,
        },
      })
      .select('id')
      .single();

    if (courseErr) throw new Error(`Course insert: ${courseErr.message}`);
    const courseId = courseRow.id;

    // ── 2. Lesson records ───────────────────────────────────────────────────
    const lessonRows = course.modules.flatMap((mod, modIdx) =>
      mod.lessons.map((lesson) => ({
        course_id:        courseId,
        lesson_number:    lesson.lesson_number,
        title:            lesson.title,
        description:      lesson.description,
        content:          lesson.content,
        content_type:     lesson.content_type,
        duration_minutes: lesson.duration_minutes,
        is_required:      lesson.is_required ?? true,
        is_published,
        order_index:      lesson.lesson_number - 1,
        quiz_questions:   lesson.quiz_questions?.length ? lesson.quiz_questions : null,
        metadata: {
          module_title: mod.title,
          module_index: modIdx,
          objectives:   lesson.objectives ?? [],
        },
      }))
    );

    const { error: lessonsErr } = await db.from('training_lessons').insert(lessonRows);
    if (lessonsErr) throw new Error(`Lessons insert: ${lessonsErr.message}`);

    // ── 3. Completion rule ──────────────────────────────────────────────────
    await db.from('completion_rules').insert({
      entity_type: 'course',
      entity_id:   courseId,
      rule_type:   course.completion_rule ?? 'all_lessons',
      config:      { passing_score: course.passing_score ?? 70 },
      is_active:   true,
    });
    // Non-fatal if this fails — evaluator has a default fallback

    // ── 4. Program mapping ──────────────────────────────────────────────────
    if (program_id) {
      const { error: pcErr } = await db
        .from('program_courses')
        .upsert(
          { program_id, course_id: courseId, is_required: true, sort_order: 0 },
          { onConflict: 'program_id,course_id', ignoreDuplicates: true }
        );
      if (pcErr) logger.warn('program_courses upsert (non-fatal):', pcErr.message);
    }

    logger.info('Course published from generator', {
      userId: user.id, courseId, title: course.title,
      lessons: lessonRows.length, programId: program_id,
    });

    return NextResponse.json({ courseId, lessonCount: lessonRows.length });
  } catch (err: any) {
    logger.error('Course publish error:', err);
    return NextResponse.json({ error: err.message || 'Publish failed' }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/admin/courses/generate/publish', _POST);
