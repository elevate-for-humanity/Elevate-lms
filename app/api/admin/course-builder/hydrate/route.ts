/**
 * POST /api/admin/course-builder/hydrate
 *
 * Generates and persists assessment questions for a lesson.
 * Supports module quiz generation and final exam generation.
 *
 * Body:
 *   { lessonId, lessonType: 'checkpoint'|'quiz'|'exam', moduleTitle?, courseTitle?,
 *     domainKey?, competencyKeys?, questionCount?, passingScore?,
 *     domainDistribution?, replaceExisting? }
 *
 * Returns: { lessonId, writtenToDb, questionCount, errors }
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { getAdminClient } from '@/lib/supabase/admin';
import {
  generateAndPersistModuleQuiz,
  generateAndPersistFinalExam,
} from '@/lib/course-builder/assessment-generator';

export const dynamic = 'force-dynamic';

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
    replaceExisting?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return safeError('Invalid JSON', 400);
  }

  if (!body.lessonId) return safeError('lessonId is required', 400);
  if (!body.lessonType) return safeError('lessonType is required', 400);

  const db = await getAdminClient();

  try {
    let result;

    if (body.lessonType === 'exam') {
      if (!body.courseTitle) return safeError('courseTitle is required for exam generation', 400);
      result = await generateAndPersistFinalExam(db, {
        lessonId:           body.lessonId,
        lessonSlug:         body.lessonId,
        courseTitle:        body.courseTitle,
        questionCount:      body.questionCount ?? 50,
        passingScore:       body.passingScore ?? 80,
        domainDistribution: body.domainDistribution,
      });
    } else {
      if (!body.moduleTitle) return safeError('moduleTitle is required for quiz/checkpoint generation', 400);
      result = await generateAndPersistModuleQuiz(db, {
        lessonId:       body.lessonId,
        lessonSlug:     body.lessonId,
        moduleTitle:    body.moduleTitle,
        domainKey:      body.domainKey,
        competencyKeys: body.competencyKeys,
        questionCount:  body.questionCount ?? 10,
        passingScore:   body.passingScore ?? 70,
      });
    }

    return NextResponse.json({
      lessonId:      result.lessonId,
      writtenToDb:   result.writtenToDb,
      questionCount: result.questions.length,
      errors:        result.errors,
    }, { status: result.errors.length ? 207 : 200 });

  } catch (err) {
    return safeInternalError(err, 'Hydration failed');
  }
}
