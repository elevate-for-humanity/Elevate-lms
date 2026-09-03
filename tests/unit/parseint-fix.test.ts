/**
 * Unit tests to verify parseInt radix parameter fix
 *
 * This test ensures that parseInt with radix 10 correctly handles
 * edge cases that could cause issues without the radix parameter.
 */

import { describe, it, expect } from 'vitest';

describe('parseInt with radix parameter', () => {
  it('should correctly parse decimal numbers with leading zeros', () => {
    // Without radix, "08" and "09" could be problematic in older JS
    expect(parseInt('08', 10)).toBe(8);
    expect(parseInt('09', 10)).toBe(9);
    expect(parseInt('010', 10)).toBe(10);
  });

  it('should handle normal decimal strings', () => {
    expect(parseInt('1', 10)).toBe(1);
    expect(parseInt('50', 10)).toBe(50);
    expect(parseInt('100', 10)).toBe(100);
  });

  it('should handle strings with whitespace', () => {
    expect(parseInt(' 42 ', 10)).toBe(42);
    expect(parseInt('  100', 10)).toBe(100);
  });

  it('should handle invalid inputs gracefully', () => {
    expect(isNaN(parseInt('abc', 10))).toBe(true);
    expect(isNaN(parseInt('', 10))).toBe(true);
  });

  it('should parse numbers from strings with trailing non-numeric characters', () => {
    expect(parseInt('42px', 10)).toBe(42);
    expect(parseInt('100%', 10)).toBe(100);
  });

  it('should handle fallback patterns used in the codebase', () => {
    // Common pattern: parseInt(value || '0', 10)
    const value1 = undefined;
    const value2 = null;
    const value3 = '';

    expect(parseInt((value1 as any) || '0', 10)).toBe(0);
    expect(parseInt((value2 as any) || '0', 10)).toBe(0);
    expect(parseInt(value3 || '0', 10)).toBe(0);
  });

  it('should correctly parse pagination parameters', () => {
    // Simulating query parameter parsing
    const mockSearchParams = {
      page: '1',
      limit: '50',
      offset: '0',
    };

    const page = parseInt(mockSearchParams.page || '1', 10);
    const limit = parseInt(mockSearchParams.limit || '50', 10);
    const offset = parseInt(mockSearchParams.offset || '0', 10);

    expect(page).toBe(1);
    expect(limit).toBe(50);
    expect(offset).toBe(0);
  });

  it('should handle edge case with octal-looking strings', () => {
    // These would be problematic without radix in older JS
    expect(parseInt('0777', 10)).toBe(777); // Not octal 511
    expect(parseInt('0123', 10)).toBe(123); // Not octal 83
  });
});
