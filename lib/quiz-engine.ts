export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
}

export interface QuizAttempt {
  quiz_id: string;
  user_id: string;
  answers: Record<string, number>;
  score: number;
  passed: boolean;
  started_at: string;
  completed_at?: string;
}

export function calculateScore(
  questions: QuizQuestion[],
  answers: Record<string, number>,
): { score: number; correct: number; total: number } {
  let correct = 0;
  const total = questions.length;

  questions.forEach((question) => {
    if (answers[question.id] === question.correct_answer) {
      correct++;
    }
  });

  const score = Math.round((correct / total) * 100);

  return { score, correct, total };
}

export function checkPassed(score: number, passingScore: number): boolean {
  return score >= passingScore;
}

export function validateAnswers(
  questions: QuizQuestion[],
  answers: Record<string, number>,
): boolean {
  // Check if all questions are answered
  return questions.every((q) => answers[q.id] !== undefined);
}
