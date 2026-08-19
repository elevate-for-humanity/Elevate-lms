import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/requireAuth';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const { user, error: authError } = await requireAuth(request);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { courseId } = await params;
  const db = await createClient();

  const { data: enrollment, error: enrollmentError } = await db
    .from('course_enrollments')
    .select('id,status')
    .eq('student_id', user.id)
    .eq('course_id', courseId)
    .eq('status', 'active')
    .maybeSingle();
  if (enrollmentError) return NextResponse.json({ error: 'Unable to verify enrollment' }, { status: 500 });
  if (!enrollment) return NextResponse.json({ error: 'Course access required' }, { status: 403 });

  const [{ data: lessons, error: lessonError }, { data: interactions, error: interactionError }, { data: attempts, error: attemptError }] = await Promise.all([
    db.from('course_lessons').select('id,title,domain_key,learning_objectives').eq('course_id', courseId),
    db.from('interaction_progress').select('lesson_id,score,completed,attempts,weak_objectives,updated_at').eq('learner_id', user.id).eq('course_id', courseId),
    db.from('practice_attempts').select('attempt_number,score,domain_scores,completed_at,status,time_spent_seconds').eq('user_id', user.id).eq('course_id', courseId).eq('status', 'completed').order('attempt_number', { ascending: false }),
  ]);

  if (lessonError || interactionError || attemptError) {
    return NextResponse.json({ error: 'Unable to calculate readiness' }, { status: 500 });
  }

  const lessonMap = new Map((lessons ?? []).map((lesson: any) => [lesson.id, lesson]));
  const domainBuckets = new Map<string, number[]>();
  const weakObjectives = new Set<string>();

  for (const row of interactions ?? []) {
    const lesson = lessonMap.get((row as any).lesson_id) as any;
    const domain = String(lesson?.domain_key ?? 'unmapped');
    const score = Number((row as any).score);
    if (Number.isFinite(score)) {
      const list = domainBuckets.get(domain) ?? [];
      list.push(score);
      domainBuckets.set(domain, list);
    }
    if (!(row as any).completed || score < 80) {
      for (const objective of ((row as any).weak_objectives ?? [])) {
        const value = String(objective).trim();
        if (value) weakObjectives.add(value);
      }
    }
  }

  const latestPractice = (attempts ?? [])[0] as any | undefined;
  if (latestPractice?.domain_scores && typeof latestPractice.domain_scores === 'object') {
    for (const [domain, raw] of Object.entries(latestPractice.domain_scores as Record<string, unknown>)) {
      const score = Number(raw);
      if (!Number.isFinite(score)) continue;
      const list = domainBuckets.get(domain) ?? [];
      list.push(score);
      domainBuckets.set(domain, list);
    }
  }

  const domainBreakdown = Object.fromEntries(
    [...domainBuckets.entries()].map(([domain, scores]) => [
      domain,
      Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length),
    ]),
  );
  const domainValues = Object.values(domainBreakdown) as number[];
  const interactionScores = (interactions ?? [])
    .map((row: any) => Number(row.score))
    .filter((score: number) => Number.isFinite(score));
  const interactionAverage = interactionScores.length
    ? interactionScores.reduce((sum: number, value: number) => sum + value, 0) / interactionScores.length
    : 0;
  const practiceScore = Number(latestPractice?.score ?? 0);
  const overallScore = clamp(
    Math.round(
      latestPractice
        ? interactionAverage * 0.4 + practiceScore * 0.6
        : interactionAverage,
    ),
  );

  const weakDomains = Object.entries(domainBreakdown)
    .filter(([, score]) => Number(score) < 80)
    .map(([domain]) => domain);
  const strengths = Object.entries(domainBreakdown)
    .filter(([, score]) => Number(score) >= 85)
    .map(([domain]) => domain);

  const recommendations: string[] = [];
  if ((attempts ?? []).length === 0) recommendations.push('Complete a full practice assessment to strengthen readiness evidence.');
  if (weakDomains.length) recommendations.push(`Focused review required in: ${weakDomains.join(', ')}.`);
  if (weakObjectives.size) recommendations.push(`Review ${weakObjectives.size} missed objective${weakObjectives.size === 1 ? '' : 's'} before the next attempt.`);
  if (!recommendations.length) recommendations.push('Continue spaced review and complete another practice assessment before certification testing.');

  const confidenceLevel = (attempts ?? []).length >= 2 && domainValues.length >= 2 ? 'moderate' : 'low';
  const report = {
    user_id: user.id,
    course_id: courseId,
    overall_score: overallScore,
    // Do not claim a statistical pass probability without a validated predictive model.
    pass_probability: null,
    confidence_level: confidenceLevel,
    domain_breakdown: domainBreakdown,
    strengths,
    weaknesses: { domains: weakDomains, objectives: [...weakObjectives] },
    recommendations,
    study_plan: {
      nextAction: weakDomains.length ? 'focused_review' : 'practice_assessment',
      weakDomains,
      suggestedMasteryThreshold: 80,
    },
    generated_at: new Date().toISOString(),
  };

  const { error: saveError } = await db.from('readiness_reports').insert(report);
  if (saveError) return NextResponse.json({ error: 'Unable to persist readiness report' }, { status: 500 });

  return NextResponse.json({
    success: true,
    report: {
      overallScore,
      confidenceLevel,
      domainBreakdown,
      strengths,
      weakDomains,
      weakObjectives: [...weakObjectives],
      recommendations,
      completedPracticeAttempts: (attempts ?? []).length,
      latestPracticeScore: latestPractice?.score ?? null,
      passProbability: null,
      passProbabilityNote: 'Not reported until a validated predictive model is approved.',
    },
  });
}
