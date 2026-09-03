import { describe, it, expect } from 'vitest';
import {
  randomCredentialCode,
  randomShareToken,
  sha256,
  randomString,
  secureCompare,
} from '../../lib/crypto-utils';

describe('crypto-utils', () => {
  describe('randomCredentialCode', () => {
    it('returns a string prefixed with crd_', () => {
      const code = randomCredentialCode();
      expect(code).toMatch(/^crd_[a-f0-9]{40}$/);
    });

    it('generates unique values', () => {
      const codes = new Set(Array.from({ length: 50 }, () => randomCredentialCode()));
      expect(codes.size).toBe(50);
    });
  });

  describe('randomShareToken', () => {
    it('returns a 64-char hex string', () => {
      const token = randomShareToken();
      expect(token).toMatch(/^[a-f0-9]{64}$/);
    });

    it('generates unique values', () => {
      const tokens = new Set(Array.from({ length: 50 }, () => randomShareToken()));
      expect(tokens.size).toBe(50);
    });
  });

  describe('sha256', () => {
    it('returns a 64-char hex digest', () => {
      const hash = sha256('hello');
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('is deterministic', () => {
      expect(sha256('test')).toBe(sha256('test'));
    });

    it('produces different hashes for different inputs', () => {
      expect(sha256('a')).not.toBe(sha256('b'));
    });

    it('matches known SHA-256 value', () => {
      // SHA-256 of empty string
      expect(sha256('')).toBe(
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      );
    });
  });

  describe('randomString', () => {
    it('defaults to 64-char hex (32 bytes)', () => {
      const s = randomString();
      expect(s).toMatch(/^[a-f0-9]{64}$/);
    });

    it('respects custom length', () => {
      const s = randomString(16);
      expect(s).toMatch(/^[a-f0-9]{32}$/);
    });
  });

  describe('secureCompare', () => {
    it('returns true for identical strings', () => {
      expect(secureCompare('abc', 'abc')).toBe(true);
    });

    it('returns false for different strings of same length', () => {
      expect(secureCompare('abc', 'abd')).toBe(false);
    });

    it('returns false for different lengths', () => {
      expect(secureCompare('abc', 'abcd')).toBe(false);
    });

    it('returns true for empty strings', () => {
      expect(secureCompare('', '')).toBe(true);
    });
  });
});
