import {
  DAILY_THEORY_PASSING_SCORE,
  type BeautyApprenticeshipSlug,
  isBeautyApprenticeshipSlug,
} from '@/lib/beauty-apprenticeship/constants';

export type DailyTheoryRecord = {
  id: string;
  user_id: string;
  program_slug: string;
  theory_date: string;
  lesson_id: string | null;
  best_score: number;
  passed: boolean;
  attempt_count: number;
};

export function theoryDateInTimeZone(timeZone = 'America/Indiana/Indianapolis'): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
}

export function scorePassesDailyTheory(score: number): boolean {
  return score >= DAILY_THEORY_PASSING_SCORE;
}

export function isBeautyProgramSlug(slug: string | null | undefined): slug is BeautyApprenticeshipSlug {
  return !!slug && isBeautyApprenticeshipSlug(slug);
}

/** Message shown when RTI credit is blocked for the day */
export function dailyTheoryBlockedMessage(score?: number): string {
  if (score == null) {
    return `Complete today’s theory lesson and score at least ${DAILY_THEORY_PASSING_SCORE}% on the daily quiz before RTI hours can be credited for this date. You may retake the quiz until you pass.`;
  }
  return `Today’s best score is ${score}%. You need ${DAILY_THEORY_PASSING_SCORE}% or higher to credit RTI/theory hours for this date. Retake the daily quiz in Elevate LMS.`;
}
