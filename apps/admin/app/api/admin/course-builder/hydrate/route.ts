/** Canonical assessment hydration for the unified Course Builder. */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { requireAdminClient } from '@/lib/supabase/admin';
import {
  generateAndPersistModuleQuiz,
  generateAndPersistFinalExam,
} from '@/lib/course-builder/assessment-generator';
import {
  courseBuilderCreditErrorResponse,
  refundCourseBuilderRequestCredits,
  reserveCourseBuilderRequestCredits,
  type CreditReservation,
} from '@/lib/course-builder/request-metering';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const rl = await applyRateLimit(request, 'strict');
  if (rl) return rl;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  let body: {
    lessonId: string;
    lessonType: 'checkpoint' | 'quiz' | 'exam';
    moduleTitle?: string;
    courseTitle?: string;
    domainKey?: string;
    competencyKeys?: string[];
    questionCount?: number;
    passingScore?: number;
    domainDistribution?: Record<string, number>;
  };
  try {
    body = await request.json();
  } catch {
    return safeError('Invalid JSON', 400);
  }
  if (!body.lessonId) return safeError('lessonId is required', 400);
  if (!body.lessonType) return safeError('lessonType is required', 400);

  const db = await requireAdminClient();
  let reservation: CreditReservation | null = null;
  try {
    reservation = await reserveCourseBuilderRequestCredits({
      request,
      userId: auth.id,
      effectiveRoles: auth.effectiveRoles,
      operation: 'assessment',
      metadata: { lesson_id: body.lessonId, lesson_type: body.lessonType },
    });
    const result =
      body.lessonType === 'exam'
        ? await generateAndPersistFinalExam(db, {
            lessonId: body.lessonId,
            lessonSlug: body.lessonId,
            courseTitle: body.courseTitle ?? 'Course Final Exam',
            questionCount: body.questionCount ?? 50,
            passingScore: body.passingScore ?? 80,
            domainDistribution: body.domainDistribution,
          })
        : await generateAndPersistModuleQuiz(db, {
            lessonId: body.lessonId,
            lessonSlug: body.lessonId,
            moduleTitle: body.moduleTitle ?? 'Module',
            domainKey: body.domainKey,
            competencyKeys: body.competencyKeys,
            questionCount: body.questionCount ?? 10,
            passingScore: body.passingScore ?? 70,
          });
    if (result.errors.length)
      await refundCourseBuilderRequestCredits(reservation, auth.id, 'assessment_generation_failed');
    return NextResponse.json(
      {
        lessonId: result.lessonId,
        writtenToDb: result.writtenToDb,
        questionCount: result.questions.length,
        errors: result.errors,
      },
      { status: result.errors.length ? 207 : 200 },
    );
  } catch (err) {
    await refundCourseBuilderRequestCredits(
      reservation,
      auth.id,
      'assessment_generation_exception',
    );
    const credits = courseBuilderCreditErrorResponse(err);
    if (credits) return credits;
    return safeInternalError(err, 'Hydration failed');
  }
}
