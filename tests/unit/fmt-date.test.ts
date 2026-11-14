import { describe, it, expect } from 'vitest';
import { fmtDate, fmtDateLong, fmtDateTime, fmtTime, fmtDateWeekday, ageDays } from '../../lib/fmt-date';

describe('fmt-date', () => {
  const iso = '2026-04-15T15:04:00Z';

  describe('fmtDate', () => {
    it('formats as "Mon DD"', () => {
      expect(fmtDate(iso)).toBe('Apr 15');
    });

    it('returns dash for null/undefined', () => {
      expect(fmtDate(null)).toBe('—');
      expect(fmtDate(undefined)).toBe('—');
    });

    it('accepts Date objects', () => {
      expect(fmtDate(new Date(iso))).toBe('Apr 15');
    });
  });

  describe('fmtDateLong', () => {
    it('formats as "Mon DD, YYYY"', () => {
      expect(fmtDateLong(iso)).toBe('Apr 15, 2026');
    });

    it('returns dash for null', () => {
      expect(fmtDateLong(null)).toBe('—');
    });
  });

  describe('fmtDateTime', () => {
    it('formats with date and time', () => {
      const result = fmtDateTime(iso);
      expect(result).toContain('Apr 15');
      expect(result).toContain('2026');
      expect(result).toContain('3:04');
      expect(result).toContain('PM');
    });

    it('returns dash for null', () => {
      expect(fmtDateTime(null)).toBe('—');
    });
  });

  describe('fmtTime', () => {
    it('formats as time only', () => {
      expect(fmtTime(iso)).toBe('3:04 PM');
    });

    it('returns dash for null', () => {
      expect(fmtTime(null)).toBe('—');
    });
  });

  describe('fmtDateWeekday', () => {
    it('includes weekday abbreviation', () => {
      const result = fmtDateWeekday(iso);
      expect(result).toContain('Wed');
      expect(result).toContain('Apr 15');
    });

    it('returns dash for null', () => {
      expect(fmtDateWeekday(null)).toBe('—');
    });
  });

  describe('ageDays', () => {
    it('returns 0 for null/undefined', () => {
      expect(ageDays(null)).toBe(0);
      expect(ageDays(undefined)).toBe(0);
    });

    it('calculates days between timestamps', () => {
      const ref = '2026-04-20T00:00:00Z';
      expect(ageDays('2026-04-15T00:00:00Z', ref)).toBe(5);
    });

    it('returns 0 for same-day', () => {
      const ref = '2026-04-15T12:00:00Z';
      expect(ageDays('2026-04-15T00:00:00Z', ref)).toBe(0);
    });
  });
});
