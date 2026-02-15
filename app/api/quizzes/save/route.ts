import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const quiz = await request.json();

    // Save quiz
    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .upsert({
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        time_limit: quiz.timeLimit,
        passing_score: quiz.passingScore,
        shuffle_questions: quiz.shuffleQuestions,
        shuffle_answers: quiz.shuffleAnswers,
        show_correct_answers: quiz.showCorrectAnswers,
        allow_retakes: quiz.allowRetakes,
        max_attempts: quiz.maxAttempts,
        created_by: user.id,
      })
      .select()
      .single();

    if (quizError) throw quizError;

    // Delete existing questions
    if (quiz.id) {
      await supabase.from('quiz_questions').delete().eq('quiz_id', quizData.id);
    }

    // Save questions
    if (quiz.questions && quiz.questions.length > 0) {
      const questions = quiz.questions.map(
        (q: Record<string, any>, index: number) => ({
          quiz_id: quizData.id,
          question_type: q.type,
          question_text: q.question,
          points: q.points,
          question_order: index,
          options: q.options || null,
          correct_answer: q.correctAnswer,
          explanation: q.explanation,
          image_url: q.imageUrl,
          code_language: q.codeLanguage,
          matching_pairs: q.matchingPairs || null,
        })
      );

      const { error: questionsError } = await supabase
        .from('quiz_questions')
        .insert(questions);

      if (questionsError) throw questionsError;
    }

    return NextResponse.json({
      success: true,
      quizId: quizData.id,
      message: 'Quiz saved successfully',
    });
  } catch (error) { 
    logger.error(
      'Error saving quiz:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to save quiz' },
      { status: 500 }
    );
  }
}
