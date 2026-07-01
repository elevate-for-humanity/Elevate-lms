import { DAILY_THEORY_PASSING_SCORE } from '@/lib/beauty-apprenticeship/constants';
import { PRESTIGE_ELEVATION_BARBER_CURRICULUM } from '@/lib/barber/branding';

export const DAILY_THEORY_POLICY = {
  passingScore: DAILY_THEORY_PASSING_SCORE,
  retakesAllowed: true,
  summary:
    'Complete your assigned theory lesson and pass the daily quiz before RTI hours count for that calendar day.',
  rules: [
    'Each training day, complete the theory reading and daily quiz in Elevate LMS before related instruction (RTI) hours are credited for that date.',
    `You must score at least ${DAILY_THEORY_PASSING_SCORE}% on the daily theory quiz. You may retake the quiz until you pass.`,
    'If you do not pass the daily theory quiz, no RTI/theory hours are credited for that calendar day (shop OJT may still be recorded separately per your host agreement).',
    'Your host shop supervisor and Elevate instructor see the same weekly syllabus module — bookwork on LMS matches the theory topic your shop is reinforcing.',
  ],
  instructorAlignment:
    'Host shops receive the program syllabus and weekly module outline so on-the-job coaching aligns with the same theory unit the apprentice completes online.',
} as const;

export const BARBER_RTI_LABEL = PRESTIGE_ELEVATION_BARBER_CURRICULUM;
