import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/requireAuth';
import { createClient } from '@/lib/supabase/server';
import { aiChat, isAIAvailable } from '@/lib/ai/ai-service';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TutorSchema = z.object({
  question: z.string().trim().min(2).max(2000),
  lessonId: z.string().uuid().optional(),
});

function textFromContent(value: unknown): string {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';
  const record = value as Record<string, any>;
  return [record.html, record.text, record.summary, record.experience?.narrationScript]
    .filter((v) => typeof v === 'string')
    .join('\n');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const { user, error: authError } = await requireAuth(request);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAIAvailable()) return NextResponse.json({ error: 'AI tutor is not configured' }, { status: 503 });

  const parsed = TutorSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid tutor request' }, { status: 400 });

  const { courseId } = await params;
  const { lessonId, question } = parsed.data;
  const db = await createClient();

  const { data: enrollment, error: enrollmentError } = await db
    .from('course_enrollments')
    .select('id')
    .eq('student_id', user.id)
    .eq('course_id', courseId)
    .eq('status', 'active')
    .maybeSingle();
  if (enrollmentError) return NextResponse.json({ error: 'Unable to verify enrollment' }, { status: 500 });
  if (!enrollment) return NextResponse.json({ error: 'Course access required' }, { status: 403 });

  const { data: course, error: courseError } = await db
    .from('courses')
    .select('id,title,description,governing_body,governing_standard_version')
    .eq('id', courseId)
    .maybeSingle();
  if (courseError || !course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

  let lesson: any = null;
  if (lessonId) {
    const result = await db
      .from('course_lessons')
      .select('id,title,content,content_json,learning_objectives,domain_key,competency_checks,instructor_notes')
      .eq('id', lessonId)
      .eq('course_id', courseId)
      .maybeSingle();
    if (result.error) return NextResponse.json({ error: 'Unable to load lesson context' }, { status: 500 });
    lesson = result.data;
  }

  const { data: weakRows } = await db
    .from('interaction_progress')
    .select('lesson_id,weak_objectives,score,feedback')
    .eq('learner_id', user.id)
    .eq('course_id', courseId)
    .lt('score', 80)
    .limit(10);

  const lessonText = lesson
    ? [textFromContent(lesson.content_json), textFromContent(lesson.content)].filter(Boolean).join('\n')
    : '';
  const sourceContext = [
    `Course: ${course.title}`,
    `Course description: ${course.description ?? ''}`,
    course.governing_body ? `Governing body: ${course.governing_body}` : '',
    course.governing_standard_version ? `Standard/test-plan version: ${course.governing_standard_version}` : '',
    lesson ? `Current lesson: ${lesson.title}` : '',
    lesson?.domain_key ? `Current domain: ${lesson.domain_key}` : '',
    lesson?.learning_objectives ? `Learning objectives: ${JSON.stringify(lesson.learning_objectives)}` : '',
    lesson?.competency_checks ? `Competency checks: ${JSON.stringify(lesson.competency_checks)}` : '',
    lessonText ? `Approved lesson content:\n${lessonText.slice(0, 18000)}` : '',
    weakRows?.length ? `Learner remediation context: ${JSON.stringify(weakRows)}` : '',
  ].filter(Boolean).join('\n\n');

  const response = await aiChat({
    messages: [
      {
        role: 'system',
        content:
          'You are the course tutor inside a regulated workforce LMS. Answer only from the supplied approved course context. Explain concepts, coach the learner, and suggest which objective to review. Never change grades, mark competencies complete, invent licensing/certification requirements, or claim a fact is in the course when it is not. If the supplied course context does not support an answer, say that clearly and recommend instructor review. Do not reveal answer keys for an active assessment; teach the concept instead.',
      },
      {
        role: 'user',
        content: `${sourceContext}\n\nLearner question: ${question}`,
      },
    ],
    temperature: 0.25,
    maxTokens: 1200,
  });

  return NextResponse.json({
    success: true,
    answer: response.content,
    groundedIn: lesson ? { courseId, lessonId: lesson.id, lessonTitle: lesson.title } : { courseId },
    canModifyGrades: false,
    canApproveCompetencies: false,
  });
}
