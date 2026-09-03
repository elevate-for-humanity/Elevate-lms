import { describe, it, expect } from 'vitest';
import { getErrorMessage, toError } from '../../lib/error-utils';

describe('error-utils', () => {
  describe('getErrorMessage', () => {
    it('extracts message from Error instance', () => {
      expect(getErrorMessage(new Error('fail'))).toBe('fail');
    });

    it('returns string errors directly', () => {
      expect(getErrorMessage('something broke')).toBe('something broke');
    });

    it('extracts message property from object', () => {
      expect(getErrorMessage({ message: 'object error' })).toBe('object error');
    });

    it('returns fallback for null', () => {
      expect(getErrorMessage(null)).toBe('An unexpected error occurred');
    });

    it('returns fallback for undefined', () => {
      expect(getErrorMessage(undefined)).toBe('An unexpected error occurred');
    });

    it('returns fallback for numbers', () => {
      expect(getErrorMessage(42)).toBe('An unexpected error occurred');
    });
  });

  describe('toError', () => {
    it('returns Error instances as-is', () => {
      const err = new Error('original');
      expect(toError(err)).toBe(err);
    });

    it('wraps string in Error', () => {
      const result = toError('string error');
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('string error');
    });

    it('wraps objects with message property', () => {
      const result = toError({ message: 'obj error' });
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('obj error');
    });

    it('wraps null in Error with fallback message', () => {
      const result = toError(null);
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('An unexpected error occurred');
    });
  });
});
