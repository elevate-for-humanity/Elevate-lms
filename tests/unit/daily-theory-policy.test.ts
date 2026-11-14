import { describe, expect, it } from 'vitest';
import { scorePassesDailyTheory, theoryDateInTimeZone } from '@/lib/apprenticeship-programs/daily-theory';
import { DAILY_THEORY_PASSING_SCORE } from '@/lib/apprenticeship-programs/constants';

describe('daily theory policy', () => {
  it('requires 70% to pass', () => {
    expect(DAILY_THEORY_PASSING_SCORE).toBe(70);
    expect(scorePassesDailyTheory(70)).toBe(true);
    expect(scorePassesDailyTheory(69.9)).toBe(false);
    expect(scorePassesDailyTheory(100)).toBe(true);
  });

  it('formats theory date as YYYY-MM-DD', () => {
    const d = theoryDateInTimeZone('UTC');
    expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
