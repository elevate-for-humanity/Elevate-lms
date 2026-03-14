// lib/assessments/selectQuestions.ts
import { createSupabaseClient } from '@/lib/supabase-api';

interface Question {
  id: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question_text?: string;
  question_type?: string;
  points?: number;
  time_limit?: number;
  options?: any[];
  correct_answer?: any;
  explanation?: string;
  tags?: string[];
  [key: string]: any;
}

export async function selectQuestionsForExamAttempt(
  examId: string,
  adaptive: boolean
): Promise<Question[]> {
  const supabase = createSupabaseClient();
  const { data: exam, error: examError } = await supabase
    .from('exams')
    .select('*, bank:question_banks(*, questions(*))')
    .eq('id', examId)
    .single();

  if (examError || !exam || !exam.bank) {
    throw new Error('Exam or bank not found');
  }

  const all = exam.bank.questions || [];

  if (!adaptive) {
    // Simple random sample
    const shuffled = [...all].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, exam.total_questions);
  }

  // Simple adaptive pattern: 40% easy, 40% medium, 20% hard (if available)
  const easy = all.filter((q: Question) => q.difficulty === 'easy');
  const medium = all.filter((q: Question) => q.difficulty === 'medium');
  const hard = all.filter((q: Question) => q.difficulty === 'hard');

  const target = exam.total_questions;
  const easyCount = Math.round(target * 0.4);
  const mediumCount = Math.round(target * 0.4);
  const hardCount = target - easyCount - mediumCount;

  function pickRandom<T>(arr: T[], n: number): T[] {
    if (arr.length <= n) return arr;
    return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
  }

  const selected = [
    ...pickRandom(easy, easyCount),
    ...pickRandom(medium, mediumCount),
    ...pickRandom(hard, hardCount),
  ].slice(0, target) as Question[];

  return selected;
}
