export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { getSupabaseServerClient } from '@/lib/supabaseServer';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

// GET /api/quizzes/[quizId] - Load quiz with questions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = getSupabaseServerClient();
    const { quizId } = await params;

    // Fetch quiz details
    const { data: quiz, error: quizError } = await supabase
      .from('interactive_quizzes')
      .select('*')
      .eq('id', quizId)
      .single();

    if (quizError) throw quizError;

    // Fetch questions
    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('order_index');

    if (questionsError) throw questionsError;

    // Shuffle questions if enabled
    const finalQuestions = quiz.shuffle_questions
      ? questions.sort(() => Math.random() - 0.5)
      : questions;

    return NextResponse.json({
      quiz,
      questions: finalQuestions,
    });
  } catch (error) { 
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to load quiz' },
      { status: 500 }
    );
  }
}

// POST /api/quizzes/[quizId] - Submit quiz attempt
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = getSupabaseServerClient();
    const { quizId } = await params;
    const body = await parseBody<Record<string, any>>(request);
    const { userId, enrollmentId, answers, timeTakenSeconds } = body;

    // Fetch quiz and questions
    const { data: quiz } = await supabase
      .from('interactive_quizzes')
      .select('*')
      .eq('id', quizId)
      .single();

    const { data: questions } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quizId);

    if (!quiz || !questions) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // Calculate score
    let correctCount = 0;
    const feedback: any = {};

    questions.forEach((question: Record<string, any>) => {
      const userAnswer = answers[question.id];
      const correctAnswer = question.correct_answer;

      const isCorrect =
        JSON.stringify(userAnswer) === JSON.stringify(correctAnswer);
      if (isCorrect) correctCount++;

      feedback[question.id] = {
        correct: isCorrect,
        userAnswer,
        correctAnswer,
        explanation: question.explanation,
      };
    });

    const totalPoints = questions.reduce(
      (sum: number, q: { points?: number }) => sum + (q.points || 1),
      0
    );
    const score = correctCount;
    const percentage = (score / questions.length) * 100;
    const passed = percentage >= quiz.passing_score;

    // Get attempt number
    const { data: previousAttempts } = await supabase
      .from('quiz_attempts')
      .select('attempt_number')
      .eq('user_id', userId)
      .eq('quiz_id', quizId)
      .order('attempt_number', { ascending: false })
      .limit(1);

    const attemptNumber =
      previousAttempts && previousAttempts.length > 0
        ? previousAttempts[0].attempt_number + 1
        : 1;

    // Check max attempts
    if (quiz.max_attempts && attemptNumber > quiz.max_attempts) {
      return NextResponse.json(
        { error: 'Maximum attempts exceeded' },
        { status: 400 }
      );
    }

    // Save attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .insert({
        user_id: userId,
        quiz_id: quizId,
        enrollment_id: enrollmentId,
        answers,
        score,
        percentage,
        passed,
        time_taken_seconds: timeTakenSeconds,
        attempt_number: attemptNumber,
        feedback,
      })
      .select()
      .single();

    if (attemptError) throw attemptError;

    return NextResponse.json({
      attempt,
      feedback: quiz.show_correct_answers ? feedback : null,
      passed,
      score,
      percentage,
      attemptNumber,
      maxAttempts: quiz.max_attempts,
    });
  } catch (error) { 
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to submit quiz' },
      { status: 500 }
    );
  }
}
