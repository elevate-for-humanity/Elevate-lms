import { NextRequest, NextResponse } from 'next/server';
import { getQuestionsForProgram } from '@/lib/paris/interview/question-bank';

/**
 * GET /api/paris/interview/questions
 * Get interview questions for a program (without scoring rubric)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const program = searchParams.get('program');

    if (!program) {
      return NextResponse.json(
        { error: 'Missing required parameter: program' },
        { status: 400 }
      );
    }

    // Validate program is supported
    const supportedPrograms = ['barber-apprenticeship', 'cdl-training', 'hvac', 'medical-assistant', 'cosmetology', 'phlebotomy'];
    
    if (!supportedPrograms.includes(program)) {
      return NextResponse.json(
        { error: 'Program not supported for PARS interview', code: 'PROGRAM_NOT_SUPPORTED' },
        { status: 400 }
      );
    }

    // Get questions and strip scoring rubrics (don't expose to client)
    const questions = getQuestionsForProgram(program);
    
    const sanitizedQuestions = questions.map(q => ({
      id: q.id,
      question: q.question,
      domain: q.domain,
      followUps: q.followUps,
      weight: q.weight,
      requiredDomain: q.requiredDomain
    }));

    return NextResponse.json({
      program,
      questions: sanitizedQuestions,
      questionCount: sanitizedQuestions.length,
      estimatedDuration: `${questions.length * 5}-${questions.length * 8} minutes`
    });

  } catch (error) {
    console.error('PARS Interview Questions Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
