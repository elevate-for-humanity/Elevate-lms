export const TRAINING_CATEGORY = 'supersonic-2026';
export const TRAINING_VERSION = '2026.1';
// Content IDs identify canonical staff_training_modules, not production client records.
const prompts = [
  [
    'A client from a different office appears. What do you do?',
    ['Stop and report access', 'Browse to investigate', 'Copy the return'],
    0,
  ],
  [
    'Only a tax-ID last four is available. What comes next?',
    ['Reconstruct the full ID', 'Securely collect and verify the full ID', 'Skip identification'],
    1,
  ],
  [
    'A source W-2 changes after calculation. What is required?',
    [
      'Keep the old estimate',
      'Recalculate and review affected information',
      'Mark the return accepted',
    ],
    1,
  ],
  [
    'What proves IRS acceptance?',
    ['An export', 'A signed intake', 'A matched acceptance acknowledgment'],
    2,
  ],
  [
    'Which amount must an eligible refund cover?',
    ['Preparation fee alone', 'All applicable preparation and bank fees', 'The advance maximum'],
    1,
  ],
  [
    'What does a successful export establish?',
    ['Ready for a verified handoff', 'IRS acceptance', 'Bank funding'],
    0,
  ],
  [
    'Twenty returns are prepared; twelve have matched acceptance acknowledgments. How many are accepted?',
    ['20', '12', '32'],
    1,
  ],
  [
    'What must a new location verify?',
    [
      'Its logo only',
      'Office permissions, licensing, EFIN and bank requirements',
      'Nothing if the brand matches',
    ],
    1,
  ],
] as const;
export const assessments = prompts.map(([prompt, options, answer], index) => ({
  id: `66c02600-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
  prompt,
  options,
  answer,
}));
export function gradeAssessment(moduleId: string, answers: number[]) {
  const assessment = assessments.find((a) => a.id === moduleId);
  if (
    !assessment ||
    answers.length !== 1 ||
    !Number.isInteger(answers[0]) ||
    answers[0] < 0 ||
    answers[0] >= assessment.options.length
  )
    throw Error('INVALID_ASSESSMENT');
  const score = assessment.answer === answers[0] ? 100 : 0;
  return { score, passed: score >= 80 };
}
