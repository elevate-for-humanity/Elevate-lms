/**
 * Unit tests for type-safe helpers from lib/safe.ts
 */

import { describe, it, expect } from 'vitest';
import { date, isRecord, rec, str, num, bool, arr, toDateString, toError, toErrorMessage } from '../../lib/safe';

describe('isRecord', () => {
  it('should return true for plain objects', () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord({ a: 1 })).toBe(true);
  });

  it('should return false for arrays', () => {
    expect(isRecord([])).toBe(false);
    expect(isRecord([1, 2, 3])).toBe(false);
  });

  it('should return false for null and primitives', () => {
    expect(isRecord(null)).toBe(false);
    expect(isRecord(undefined)).toBe(false);
    expect(isRecord('string')).toBe(false);
    expect(isRecord(123)).toBe(false);
    expect(isRecord(true)).toBe(false);
  });
});

describe('rec', () => {
  it('should return the object if it is a record', () => {
    const obj = { a: 1 };
    expect(rec(obj)).toBe(obj);
  });

  it('should return empty object for non-records', () => {
    expect(rec(null)).toEqual({});
    expect(rec([])).toEqual({});
    expect(rec('string')).toEqual({});
  });
});

describe('str', () => {
  it('should return string if input is string', () => {
    expect(str('hello')).toBe('hello');
    expect(str('')).toBe('');
  });

  it('should return fallback for non-strings', () => {
    expect(str(123)).toBeNull();
    expect(str(null)).toBeNull();
    expect(str(undefined, 'default')).toBe('default');
  });
});

describe('num', () => {
  it('should return number if input is finite number', () => {
    expect(num(42)).toBe(42);
    expect(num(0)).toBe(0);
    expect(num(-5.5)).toBe(-5.5);
  });

  it('should return fallback for non-numbers and non-finite', () => {
    expect(num('42')).toBeNull();
    expect(num(NaN)).toBeNull();
    expect(num(Infinity)).toBeNull();
    expect(num(null, 0)).toBe(0);
  });
});

describe('bool', () => {
  it('should return boolean if input is boolean', () => {
    expect(bool(true)).toBe(true);
    expect(bool(false)).toBe(false);
  });

  it('should return fallback for non-booleans', () => {
    expect(bool(1)).toBeNull();
    expect(bool('true')).toBeNull();
    expect(bool(null, false)).toBe(false);
  });
});

describe('arr', () => {
  it('should return array if input is array', () => {
    const input = [1, 2, 3];
    expect(arr(input)).toBe(input);
  });

  it('should return empty array for non-arrays', () => {
    expect(arr(null)).toEqual([]);
    expect(arr({})).toEqual([]);
    expect(arr('string')).toEqual([]);
  });
});

describe('toDateString', () => {
  it('should format Date objects', () => {
    const d = new Date('2024-01-15');
    expect(toDateString(d)).toMatch(/1\/15\/2024|15\/1\/2024/); // locale dependent
  });

  it('should parse and format valid date strings', () => {
    expect(toDateString('2024-06-20')).toMatch(/6\/20\/2024|20\/6\/2024/);
  });

  it('should return empty string for invalid dates', () => {
    expect(toDateString('invalid')).toBe('');
    expect(toDateString(null)).toBe('');
  });
});

describe('toError', () => {
  it('should return Error instance unchanged', () => {
    const err = new Error('test');
    expect(toError(err)).toBe(err);
  });

  it('should wrap non-Error values in Error', () => {
    expect(toError('string error')).toBeInstanceOf(Error);
    expect(toError('string error').message).toBe('string error');
    expect(toError(123).message).toBe('123');
  });
});

describe('toErrorMessage', () => {
  it('should return message from Error', () => {
    expect(toErrorMessage(new Error('test message'))).toBe('test message');
  });

  it('should stringify non-Error values', () => {
    expect(toErrorMessage('string')).toBe('string');
    expect(toErrorMessage(123)).toBe('123');
  });
});

describe('date', () => {
  it('should return Date instance unchanged', () => {
    const input = new Date('2024-01-15');
    const result = date(input);
    expect(result).toBe(input);
    expect(result?.getFullYear()).toBe(2024);
  });

  it('should parse valid ISO date string', () => {
    const result = date('2024-06-20');
    expect(result).toBeInstanceOf(Date);
    expect(result?.getFullYear()).toBe(2024);
    expect(result?.getMonth()).toBe(5); // June is 0-indexed
    expect(result?.getDate()).toBe(20);
  });

  it('should parse valid timestamp number', () => {
    const timestamp = 1700000000000; // Nov 14, 2023
    const result = date(timestamp);
    expect(result).toBeInstanceOf(Date);
    expect(result?.getTime()).toBe(timestamp);
  });

  it('should return fallback for invalid string', () => {
    expect(date('not-a-date')).toBeNull();
    expect(date('invalid', new Date('2020-01-01'))).toEqual(new Date('2020-01-01'));
  });

  it('should return fallback for null and undefined', () => {
    expect(date(null)).toBeNull();
    expect(date(undefined)).toBeNull();
    const fallback = new Date('2023-01-01');
    expect(date(null, fallback)).toBe(fallback);
  });

  it('should return fallback for non-date types', () => {
    expect(date({})).toBeNull();
    expect(date([])).toBeNull();
    expect(date(true)).toBeNull();
  });
});
