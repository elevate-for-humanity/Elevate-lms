import { NextRequest, NextResponse } from 'next/server';
import { getQuestionsForProgram } from '@/lib/paris/interview/question-bank';
import { applyRateLimit } from '@/lib/api/withRateLimit';

/**
 * GET /api/paris/interview/questions
 *
 * AUTH: Intentionally public. Applicants can enter the pre-enrollment interview
 * before creating an LMS account. Only question text is exposed; scoring
 * weights, rubrics, and internal eligibility logic stay server-side.
 */
export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'pageLoad');
  if (rateLimited) return rateLimited;

  try {
    const program = request.nextUrl.searchParams.get('program')?.trim() || '';
    if (!program) {
      return NextResponse.json({ error: 'Missing required parameter: program' }, { status: 400 });
    }

    const supportedPrograms = new Set([
      'barber-apprenticeship',
      'cdl-training',
      'hvac',
      'medical-assistant',
      'cosmetology',
      'phlebotomy',
    ]);

    if (!supportedPrograms.has(program)) {
      return NextResponse.json(
        { error: 'Program not supported for PARIS interview', code: 'PROGRAM_NOT_SUPPORTED' },
        { status: 400 },
      );
    }

    const questions = getQuestionsForProgram(program);
    const publicQuestions = questions.map((question) => ({
      id: question.id,
      question: question.question,
      domain: question.domain,
      followUps: question.followUps,
    }));

    return NextResponse.json({
      program,
      questions: publicQuestions,
      questionCount: publicQuestions.length,
    });
  } catch {
    return NextResponse.json({ error: 'Interview questions are temporarily unavailable.' }, { status: 503 });
  }
}
