import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/requireAuth';
import { createClient } from '@/lib/supabase/server';
import {
  resolveDomainMasteryThresholds,
  resolveLessonMasteryPolicy,
  resolveStoredLessonExperience,
} from '@/lib/course-factory/mastery-policy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const { user, error: authError } = await requireAuth(request);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { courseId } = await params;
  const db = await createClient();

  const { data: enrollment, error: enrollmentError } = await db
    .from('course_enrollments')
    .select('id')
    .eq('student_id', user.id)
    .eq('course_id', courseId)
    .eq('status', 'active')
    .maybeSingle();
  if (enrollmentError)
    return NextResponse.json({ error: 'Unable to verify enrollment' }, { status: 500 });
  if (!enrollment) return NextResponse.json({ error: 'Course access required' }, { status: 403 });

  const [{ data: interactions, error: interactionError }, { data: attempts, error: attemptError }] =
    await Promise.all([
      db
        .from('interaction_progress')
        .select('lesson_id,score,completed,weak_objectives')
        .eq('learner_id', user.id)
        .eq('course_id', courseId),
      db
        .from('practice_attempts')
        .select('score,domain_scores,attempt_number')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .eq('status', 'completed')
        .order('attempt_number', { ascending: false })
        .limit(1),
    ]);
  if (interactionError || attemptError)
    return NextResponse.json({ error: 'Unable to calculate focused review' }, { status: 500 });

  const { data: lessonRows, error: lessonError } = await db
    .from('course_lessons')
    .select('id,title,slug,domain_key,learning_objectives,content_json,content,order_index')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });
  if (lessonError)
    return NextResponse.json({ error: 'Unable to load course lessons' }, { status: 500 });

  const lessonMap = new Map((lessonRows ?? []).map((lesson: any) => [lesson.id, lesson]));
  const courseDomainThresholds = resolveDomainMasteryThresholds(lessonRows ?? []);
  const weakDomains = new Set<string>();
  const weakObjectives = new Set<string>();
  const weakLessonIds = new Set<string>();

  for (const row of interactions ?? []) {
    const score = Number((row as any).score ?? 0);
    const lesson = lessonMap.get((row as any).lesson_id) as any;
    const threshold = resolveLessonMasteryPolicy(
      resolveStoredLessonExperience(lesson?.content_json, lesson?.content),
    ).threshold;
    if ((row as any).completed && score >= threshold) continue;
    if (lesson?.id) weakLessonIds.add(lesson.id);
    if (lesson?.domain_key) weakDomains.add(String(lesson.domain_key));
    for (const objective of (row as any).weak_objectives ?? []) {
      const value = String(objective).trim();
      if (value) weakObjectives.add(value);
    }
  }

  const latestPractice = (attempts ?? [])[0] as any | undefined;
  if (latestPractice?.domain_scores && typeof latestPractice.domain_scores === 'object') {
    for (const [domain, rawScore] of Object.entries(
      latestPractice.domain_scores as Record<string, unknown>,
    )) {
      const score = Number(rawScore);
      if (Number.isFinite(score) && score < (courseDomainThresholds.get(domain) ?? 80)) {
        weakDomains.add(domain);
      }
    }
  }

  let lessonsToReview: any[] = [];
  if (weakDomains.size > 0) {
    lessonsToReview = (lessonRows ?? []).filter((lesson: any) =>
      weakDomains.has(String(lesson.domain_key ?? 'unmapped')),
    );
  } else if (weakLessonIds.size > 0) {
    lessonsToReview = (lessonRows ?? []).filter((lesson: any) => weakLessonIds.has(lesson.id));
  }

  const practiceQuestions = lessonsToReview.map((lesson: any) => ({
    lessonId: lesson.id,
    domainKey: lesson.domain_key,
    prompt: `Recheck mastery for ${lesson.title}`,
  }));

  const domainThresholds = resolveDomainMasteryThresholds(lessonsToReview);
  const masteryThreshold = domainThresholds.size ? Math.max(...domainThresholds.values()) : 80;
  const row = {
    user_id: user.id,
    course_id: courseId,
    weak_domains: [...weakDomains],
    lessons_to_review: lessonsToReview.map((lesson: any) => ({
      id: lesson.id,
      title: lesson.title,
      slug: lesson.slug,
      domainKey: lesson.domain_key,
      learningObjectives: lesson.learning_objectives ?? [],
    })),
    practice_questions: practiceQuestions,
    status: 'active',
    started_at: new Date().toISOString(),
  };

  const { data: focusedReview, error: saveError } = await db
    .from('focused_reviews')
    .insert(row)
    .select('id,status,weak_domains,lessons_to_review,practice_questions,started_at')
    .single();
  if (saveError)
    return NextResponse.json({ error: 'Unable to save focused review' }, { status: 500 });

  return NextResponse.json({
    success: true,
    focusedReview,
    weakObjectives: [...weakObjectives],
    masteryThreshold,
    domainMasteryThresholds: Object.fromEntries(domainThresholds),
    nextAction: lessonsToReview.length
      ? 'review_assigned_lessons_then_reassess'
      : 'complete_practice_assessment',
  });
}
