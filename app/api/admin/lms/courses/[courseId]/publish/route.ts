
/**
 * POST /api/admin/lms/courses/[courseId]/publish
 *
 * Publishes a canonical course (courses table) via the DB guard function.
 * Fails if the course is missing title, slug, modules, or lessons.
 *
 * This route is for courses in the canonical `courses` table only.
 * Legacy AI-generated courses (training_courses) use /api/admin/courses/generate/publish.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { publishCourse } from '@/lib/lms/course-service';
import { safeInternalError } from '@/lib/api/safe-error';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

async function runHealthCheck(
  supabase: Awaited<ReturnType<typeof createClient>>,
  courseId: string,
): Promise<{ pass: boolean; blocking_issues: string[] }> {
  const modules = await supabase
    .from('course_modules')
    .select('id, title, course_lessons(id, title, lesson_type, content, video_url, quiz_questions)')
    .eq('course_id', courseId);

  const blocking: string[] = [];
  const mods = modules.data ?? [];

  if (mods.length === 0) blocking.push('no modules');

  let totalLessons = 0;
  for (const m of mods as Array<{
    id: string;
    title: string;
    course_lessons: Array<{
      id: string;
      title: string;
      lesson_type: string | null;
      content: string | null;
      video_url: string | null;
      quiz_questions: unknown[] | null;
    }>;
  }>) {
    const lessons = m.course_lessons ?? [];
    if (lessons.length === 0) blocking.push(`empty module: ${m.title}`);
    totalLessons += lessons.length;

    for (const l of lessons) {
      const issues: string[] = [];
      const type = l.lesson_type ?? '';
      const isAssessment = ['quiz', 'checkpoint', 'exam'].includes(type);

      if (!l.lesson_type) issues.push('no lesson_type');
      if (!l.content)     issues.push('no content');
      // Assessments (checkpoint/quiz/exam) are quiz-only — no video required
      if (!isAssessment && !l.video_url) issues.push('no video');
      // Assessments must have quiz_questions
      if (isAssessment &&
          (!l.quiz_questions || (l.quiz_questions as unknown[]).length === 0)) {
        issues.push('no quiz_questions');
      }
      if (issues.length > 0) {
        blocking.push(`"${l.title}" (${m.title}): ${issues.join(', ')}`);
      }
    }
  }

  if (totalLessons === 0) blocking.push('no lessons');

  if (mods.length > 1) {
    const { count } = await supabase
      .from('module_completion_rules')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', courseId);
    if ((count ?? 0) === 0) blocking.push('multiple modules but no module_completion_rules');
  }

  return { pass: blocking.length === 0, blocking_issues: blocking };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { courseId } = await params;
    const body = await request.json().catch(() => ({}));
    const label: string | undefined = body.label;

    // Health gate — publish is blocked if any blocking issue exists
    const health = await runHealthCheck(supabase, courseId);
    if (!health.pass) {
      return NextResponse.json(
        {
          error:           'PUBLISH_BLOCKED',
          blocking_issues: health.blocking_issues,
        },
        { status: 422 },
      );
    }

    const result = await publishCourse(supabase, courseId, user.id, label);

    await logAdminAudit({
      action:     AdminAction.COURSE_PUBLISHED,
      actorId:    user.id,
      entityType: 'courses',
      entityId:   courseId,
      metadata:   { label, lesson_count: (result as any)?.lessonCount },
      req:        request,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return safeInternalError(error, 'Failed to publish course');
  }
}
