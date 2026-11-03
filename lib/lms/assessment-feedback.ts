/** Server-side multiple-choice checking. Never trust a client-supplied score. */
export type StoredQuizQuestion = {
  id?: string;
  prompt?: string;
  question?: string;
  question_text?: string;
  options?: string[];
  choices?: string[];
  answerIndex?: number;
  correct_answer?: number | string | boolean;
  correct?: number | string | boolean;
  correctAnswer?: number | string | boolean;
  explanation?: string;
};

export function evaluateAnswer(question: StoredQuizQuestion, selectedIndex: number | undefined) {
  const options = Array.isArray(question.options) ? question.options :
    Array.isArray(question.choices) ? question.choices : [];
  const expected = question.correctAnswer ?? question.correct_answer ??
    question.answerIndex ?? question.correct;
  const correctIndex = typeof expected === 'number' ? expected :
    typeof expected === 'boolean' ?
      options.findIndex(option => option.trim().toLowerCase() === String(expected).toLowerCase()) :
    typeof expected === 'string' ?
      options.findIndex(option => option.trim().toLowerCase() === expected.trim().toLowerCase()) : -1;
  const configured = Number.isInteger(correctIndex) && correctIndex >= 0 && correctIndex < options.length;
  return {
    correct: configured && Number.isInteger(selectedIndex) && selectedIndex === correctIndex,
    correctOption: configured ? options[correctIndex] : null,
    configured,
  };
}

export function scoreAnswers(questions: StoredQuizQuestion[], answers: Record<string,number>) {
  if (!questions.length) throw new Error('Assessment has no questions');
  return Math.round(questions.filter((question,index) =>
    evaluateAnswer(question,answers[String(question.id || `q-${index + 1}`)] ?? answers[String(index)]).correct
  ).length / questions.length * 100);
}
