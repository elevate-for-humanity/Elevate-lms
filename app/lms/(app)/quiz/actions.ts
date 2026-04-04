'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function submitQuiz(formData: FormData) {
  // Session client — RLS enforces row ownership on quiz_attempts.
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error(`Auth failed: ${authError.message}`);
  if (!user) return { error: 'Not authenticated' };

  const quizId = formData.get('quiz_id') as string;
  const answersJson = formData.get('answers') as string;

  if (!quizId || !answersJson) {
    return { error: 'Quiz ID and answers are required' };
  }

  let answers;
  try {
    answers = JSON.parse(answersJson);
  } catch {
    return { error: 'Invalid answers format' };
  }

  // In this LMS, quiz_id == lesson_id (quizzes are lesson-typed rows).
  // Resolve lesson → course_id, then verify enrollment before writing.
  const { data: lesson, error: lessonError } = await supabase
    .from('lms_lessons')
    .select('course_id')
    .eq('id', quizId)
    .single();

  if (lessonError || !lesson?.course_id) {
    return { error: 'Quiz not found' };
  }

  // Verify the user is enrolled in this course before recording an attempt.
  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', lesson.course_id)
    .in('status', ['active', 'enrolled', 'in_progress', 'completed', 'confirmed'])
    .maybeSingle();

  if (!enrollment) {
    return { error: 'Not enrolled in this course' };
  }

  const { data, error } = await supabase
    .from('quiz_attempts')
    .insert({
      user_id: user.id,
      quiz_id: quizId,
      answers,
      submitted_at: new Date().toISOString(),
      status: 'submitted',
    })
    .select()
    .single();

  if (error) {
    return { error: 'Quiz submission failed' };
  }

  revalidatePath('/lms/quizzes');
  return {
    success: true,
    message: 'Quiz submitted successfully!',
    attemptId: data?.id,
    score: data?.score,
  };
}
