/**
 * POST /api/lessons/[lessonId]/checkpoint
 *
 * Records a checkpoint/quiz/exam attempt via the engine's
 * recordCheckpointAttempt function. Returns pass/fail and attempt number.
 *
 * Body: { courseId, moduleOrder, score, passingScore, answers? }
 */

import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { getCurrentUser } from '@/lib/auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { recordCheckpointAttempt } from '@/lib/lms/engine';
import { logger } from '@/lib/logger';
import { assertLessonAccess, accessErrorResponse } from '@/lib/lms/access-control';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { lessonId } = await params;

  try {
    await assertLessonAccess(user.id, lessonId);
  } catch (e) {
    const { status, body } = accessErrorResponse(e);
    return NextResponse.json(body, { status });
  }

  let body: {
    courseId: string;
    moduleOrder: number;
    score: number;
    passingScore: number;
    answers?: Record<string, number>;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { courseId, moduleOrder, score, passingScore, answers } = body;

  if (!courseId || moduleOrder === undefined || score === undefined || passingScore === undefined) {
    return NextResponse.json({ error: 'Missing required fields: courseId, moduleOrder, score, passingScore' }, { status: 400 });
  }

  if (typeof score !== 'number' || score < 0 || score > 100) {
    return NextResponse.json({ error: 'score must be a number between 0 and 100' }, { status: 400 });
  }

  try {
    const result = await recordCheckpointAttempt(
      user.id,
      lessonId,
      courseId,
      moduleOrder,
      score,
      passingScore,
      answers ?? {}
    );

    logger.info('[checkpoint] Attempt recorded', {
      userId: user.id,
      lessonId,
      courseId,
      score,
      passed: result.passed,
      attemptNumber: result.attemptNumber,
    });

    return NextResponse.json(result);
  } catch (err) {
    logger.error('[checkpoint] recordCheckpointAttempt failed:', err instanceof Error ? err : new Error(String(err)));
    return NextResponse.json({ error: 'Failed to record checkpoint attempt' }, { status: 500 });
  }
}
