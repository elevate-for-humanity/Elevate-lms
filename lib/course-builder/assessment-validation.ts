type AssessmentQuestionLike = {
  prompt?: unknown;
  question?: unknown;
  type?: unknown;
  questionType?: unknown;
  options?: unknown;
  choices?: unknown;
  correctAnswer?: unknown;
  correct_answer?: unknown;
  explanation?: unknown;
  domainKey?: unknown;
  domain_key?: unknown;
  competencyKeys?: unknown;
  competencyKey?: unknown;
  competency_key?: unknown;
};

export function assessmentQuestionIssues(question: AssessmentQuestionLike, index: number): string[] {
  const prefix = `question ${index + 1}`;
  const issues: string[] = [];
  const prompt = String(question?.prompt ?? question?.question ?? '').trim();
  const rawOptions = Array.isArray(question?.options) ? question.options : question?.choices;
  const options = Array.isArray(rawOptions)
    ? rawOptions.map((option) => String(option).trim())
    : [];
  const rawCorrectAnswer = question?.correctAnswer ?? question?.correct_answer;
  const correctAnswers = Array.isArray(rawCorrectAnswer) ? rawCorrectAnswer : [rawCorrectAnswer];
  const questionType = String(question?.type ?? question?.questionType ?? '');

  if (!prompt) issues.push(`${prefix} prompt missing`);
  else if (/\b(?:placeholder|todo|tbd)\b/i.test(prompt)) issues.push(`${prefix} contains placeholder text`);
  if (!['multiple_choice', 'true_false'].includes(questionType)) {
    issues.push(`${prefix} type is unsupported`);
  }
  if (options.length < 2 || options.some((option) => !option)) issues.push(`${prefix} options are incomplete`);
  if (new Set(options.map((option) => option.toLocaleLowerCase())).size !== options.length) {
    issues.push(`${prefix} options are duplicated`);
  }
  const hasInvalidAnswer = !correctAnswers.length || correctAnswers.some((answer) => {
    if (typeof answer === 'number') return !Number.isInteger(answer) || answer < 0 || answer >= options.length;
    if (typeof answer === 'boolean') return questionType !== 'true_false';
    return !options.includes(String(answer));
  });
  if (hasInvalidAnswer) {
    issues.push(`${prefix} correct answer does not match an option`);
  }
  if (!String(question?.explanation ?? '').trim()) issues.push(`${prefix} rationale missing`);
  const domainKey = question?.domainKey ?? question?.domain_key;
  const competencyKeys = Array.isArray(question?.competencyKeys)
    ? question.competencyKeys
    : [question?.competencyKey ?? question?.competency_key].filter(Boolean);
  if (!domainKey && competencyKeys.length === 0) {
    issues.push(`${prefix} standards/competency mapping missing`);
  }

  return issues;
}
