import { describe, it, expect } from 'vitest';
import { isRecord, rec, str, num, bool, date, arr, toDateString, toError, toErrorMessage, toErrorDetail } from '../../lib/safe';

describe('safe helpers', () => {
  describe('isRecord', () => {
    it('returns true for plain objects', () => {
      expect(isRecord({})).toBe(true);
      expect(isRecord({ a: 1 })).toBe(true);
    });

    it('returns false for arrays', () => {
      expect(isRecord([1, 2])).toBe(false);
    });

    it('returns false for null', () => {
      expect(isRecord(null)).toBe(false);
    });

    it('returns false for primitives', () => {
      expect(isRecord('string')).toBe(false);
      expect(isRecord(42)).toBe(false);
      expect(isRecord(undefined)).toBe(false);
    });
  });

  describe('rec', () => {
    it('returns the object if it is a record', () => {
      const obj = { key: 'val' };
      expect(rec(obj)).toBe(obj);
    });

    it('returns empty object for non-records', () => {
      expect(rec(null)).toEqual({});
      expect(rec([1])).toEqual({});
      expect(rec('string')).toEqual({});
    });
  });

  describe('str', () => {
    it('returns string values', () => {
      expect(str('hello')).toBe('hello');
    });

    it('returns fallback for non-strings', () => {
      expect(str(42)).toBeNull();
      expect(str(null, 'default')).toBe('default');
    });
  });

  describe('num', () => {
    it('returns finite numbers', () => {
      expect(num(42)).toBe(42);
      expect(num(0)).toBe(0);
      expect(num(-3.14)).toBe(-3.14);
    });

    it('returns fallback for non-numbers', () => {
      expect(num('42')).toBeNull();
      expect(num(NaN)).toBeNull();
      expect(num(Infinity)).toBeNull();
    });

    it('uses custom fallback', () => {
      expect(num(undefined, 0)).toBe(0);
    });
  });

  describe('bool', () => {
    it('returns boolean values', () => {
      expect(bool(true)).toBe(true);
      expect(bool(false)).toBe(false);
    });

    it('returns fallback for non-booleans', () => {
      expect(bool(1)).toBeNull();
      expect(bool('true')).toBeNull();
      expect(bool(null, false)).toBe(false);
    });
  });

  describe('date', () => {
    it('returns Date instances', () => {
      const d = new Date('2026-01-01');
      expect(date(d)).toBe(d);
    });

    it('parses valid date strings', () => {
      const result = date('2026-06-15');
      expect(result).toBeInstanceOf(Date);
      expect(result!.getFullYear()).toBe(2026);
    });

    it('parses numeric timestamps', () => {
      const ts = new Date('2026-01-01').getTime();
      expect(date(ts)).toBeInstanceOf(Date);
    });

    it('returns fallback for invalid strings', () => {
      expect(date('not-a-date')).toBeNull();
    });

    it('returns fallback for non-date types', () => {
      expect(date(null)).toBeNull();
      expect(date(undefined)).toBeNull();
      expect(date({})).toBeNull();
    });
  });

  describe('arr', () => {
    it('returns arrays as-is', () => {
      expect(arr([1, 2, 3])).toEqual([1, 2, 3]);
    });

    it('returns empty array for non-arrays', () => {
      expect(arr(null)).toEqual([]);
      expect(arr('string')).toEqual([]);
      expect(arr(42)).toEqual([]);
    });
  });

  describe('toDateString', () => {
    it('converts Date to locale string', () => {
      const result = toDateString(new Date('2026-06-15'));
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
    });

    it('converts ISO string to locale string', () => {
      const result = toDateString('2026-06-15');
      expect(result).toBeTruthy();
    });

    it('returns empty string for invalid inputs', () => {
      expect(toDateString('invalid')).toBe('');
      expect(toDateString(null)).toBe('');
      expect(toDateString(undefined)).toBe('');
    });
  });

  describe('toError', () => {
    it('returns Error instances as-is', () => {
      const err = new Error('test');
      expect(toError(err)).toBe(err);
    });

    it('wraps non-Error values', () => {
      const result = toError('string error');
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('string error');
    });
  });

  describe('toErrorMessage', () => {
    it('returns generic message in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      expect(toErrorMessage(new Error('secret details'))).toBe('An unexpected error occurred');
      process.env.NODE_ENV = originalEnv;
    });

    it('returns actual message in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      expect(toErrorMessage(new Error('debug info'))).toBe('debug info');
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('toErrorDetail', () => {
    it('always returns the real message', () => {
      expect(toErrorDetail(new Error('detail'))).toBe('detail');
      expect(toErrorDetail('string err')).toBe('string err');
    });
  });
});
