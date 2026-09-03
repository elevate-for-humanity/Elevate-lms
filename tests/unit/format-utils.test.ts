/**
 * Unit tests for safeFormatCurrency from lib/format-utils.ts
 *
 * Tests the main execution path: formatting numbers as USD currency strings
 * while safely handling null, undefined, and invalid inputs.
 */

import { describe, it, expect } from 'vitest';
import { safeFormatCurrency } from '../../lib/format-utils';

describe('safeFormatCurrency', () => {
  it('should format valid numbers as USD currency', () => {
    expect(safeFormatCurrency(100)).toBe('$100.00');
    expect(safeFormatCurrency(1234.56)).toBe('$1,234.56');
    expect(safeFormatCurrency(0)).toBe('$0.00');
  });

  it('should handle decimal precision correctly', () => {
    expect(safeFormatCurrency(99.999)).toBe('$100.00');
    expect(safeFormatCurrency(49.994)).toBe('$49.99');
    expect(safeFormatCurrency(0.01)).toBe('$0.01');
  });

  it('should return fallback for null and undefined', () => {
    expect(safeFormatCurrency(null)).toBe('$0');
    expect(safeFormatCurrency(undefined)).toBe('$0');
  });

  it('should return fallback for NaN', () => {
    expect(safeFormatCurrency(NaN)).toBe('$0');
  });

  it('should use custom fallback when provided', () => {
    expect(safeFormatCurrency(null, 'USD', 'N/A')).toBe('N/A');
    expect(safeFormatCurrency(undefined, 'USD', '--')).toBe('--');
  });

  it('should handle negative values', () => {
    expect(safeFormatCurrency(-50)).toBe('-$50.00');
    expect(safeFormatCurrency(-1234.56)).toBe('-$1,234.56');
  });

  it('should handle large numbers with proper formatting', () => {
    expect(safeFormatCurrency(1000000)).toBe('$1,000,000.00');
    expect(safeFormatCurrency(999999.99)).toBe('$999,999.99');
  });
});
