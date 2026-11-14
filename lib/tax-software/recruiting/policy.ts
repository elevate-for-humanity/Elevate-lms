import { z } from 'zod';
export const TAX_CAREER_JOB = 'supersonic-tax-professional';
export const applicationSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    phone: z.string().trim().max(30),
    location: z.string().trim().min(2).max(120),
    preference: z.enum(['remote', 'office', 'either']),
    credential: z.enum(['CPA', 'EA', 'Attorney', 'PTIN preparer', 'Trainee']),
    experience: z.string().trim().min(20).max(1500),
    privacyAcknowledged: z.literal(true),
  })
  .strict();
export const pretest = [
  {
    prompt: 'Which identifier generally belongs to an individual paid federal return preparer?',
    options: ['PTIN', 'EIN for every employee', 'A shared office password'],
    answer: 0,
  },
  {
    prompt:
      'Gross receipts are $32,000 and already include a $28,000 1099-NEC. Total receipts are?',
    options: ['$60,000', '$32,000', '$4,000'],
    answer: 1,
  },
  {
    prompt: 'Where should taxpayer identity documents be shared?',
    options: ['Public chat', 'Personal email', 'The approved private workflow'],
    answer: 2,
  },
  {
    prompt: 'A refund advance is:',
    options: ['Guaranteed IRS money', 'An optional loan subject to terms', 'Faster IRS processing'],
    answer: 1,
  },
  {
    prompt: 'What establishes IRS acceptance?',
    options: [
      'A prepared export',
      'A matched acceptance acknowledgment',
      'An appointment confirmation',
    ],
    answer: 1,
  },
] as const;
export const finalTest = [
  ...pretest,
  {
    prompt: 'A source document changes after review. You must:',
    options: [
      'Recalculate and repeat affected review/authorization',
      'Keep the old approval',
      'Ignore the correction',
    ],
    answer: 0,
  },
  {
    prompt: 'Which fees must be considered for pay from refund?',
    options: ['Preparation fee alone', 'Every applicable preparation and bank charge', 'No fees'],
    answer: 1,
  },
  {
    prompt: 'A new office may use the main office filing identity:',
    options: [
      'Automatically',
      'Without telling Drake',
      'Only after licensing/EFIN/provider requirements are verified',
    ],
    answer: 2,
  },
  {
    prompt: 'Completing this course means:',
    options: [
      'You have an IRS license',
      'Internal knowledge checks are complete; manager review and credentials remain separate',
      'You may access all offices',
    ],
    answer: 1,
  },
  {
    prompt: 'A taxpayer has only one of two expected W-2s. You should:',
    options: [
      'Finalize anyway',
      'Request and reconcile missing information',
      'Invent the second amount',
    ],
    answer: 1,
  },
] as const;
export function gradeExam(kind: 'pretest' | 'final', answers: number[]) {
  const qs = kind === 'pretest' ? pretest : finalTest;
  if (
    answers.length !== qs.length ||
    answers.some((a, i) => !Number.isInteger(a) || a < 0 || a >= qs[i].options.length)
  )
    throw Error('INVALID_ASSESSMENT');
  const score = Math.round((100 * qs.filter((q, i) => q.answer === answers[i]).length) / qs.length);
  return { score, passed: score >= 80 };
}
export const hiringChecklist = [
  'Application and experience reviewed by the hiring team',
  'Pre-training assessment completed',
  'Supersonic online system modules and knowledge checks passed',
  'Final system test passed at 80% or higher and practical exercise reviewed',
  'Current PTIN verified for the calendar year in which paid preparation is performed, when required',
  'CPA, EA, attorney or state credentials verified when applicable to the role',
  'References and interview completed',
  'Background screening disclosure and written authorization through the approved screening process; human review and required notices',
  'Role, compensation and employee/contractor terms documented in the offer',
  'Employee I-9/W-4 or contractor W-9 and payout documents handled through approved private HR onboarding, as applicable',
  'Confidentiality, security and remote-work requirements acknowledged',
  'Manager approves office assignment, MFA and minimum necessary production permissions',
] as const;
