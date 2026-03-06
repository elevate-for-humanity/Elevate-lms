import { describe, it, expect } from 'vitest';
import { validatePassword } from '@/lib/auth/password-validation';

describe('validatePassword', () => {
  describe('length check', () => {
    it('rejects passwords shorter than 8 characters', () => {
      const result = validatePassword('abc123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters.');
    });

    it('accepts passwords of exactly 8 characters', () => {
      const result = validatePassword('Tr0ub4dor');
      expect(result.valid).toBe(true);
    });

    it('accepts long passwords', () => {
      const result = validatePassword('correct-horse-battery-staple-2024');
      expect(result.valid).toBe(true);
    });
  });

  describe('common password list', () => {
    it('rejects passwords on the common list', () => {
      expect(validatePassword('password').valid).toBe(false);
      expect(validatePassword('admin123').valid).toBe(false);
      expect(validatePassword('student1').valid).toBe(false);
    });

    it('is case-insensitive for common password check', () => {
      expect(validatePassword('PASSWORD').valid).toBe(false);
      expect(validatePassword('Admin123').valid).toBe(false);
    });
  });

  describe('repeated character check', () => {
    it('rejects passwords that are all the same character', () => {
      expect(validatePassword('aaaaaaaa').valid).toBe(false);
      expect(validatePassword('11111111').valid).toBe(false);
    });

    it('accepts passwords with some repeated characters', () => {
      // "aabbccdd" has repeats but is not ALL the same character
      const result = validatePassword('aabbccdd');
      expect(result.errors).not.toContain('Password cannot be all the same character.');
    });
  });

  describe('sequential run check', () => {
    // These were NOT caught by the old regex (^ anchor bug)
    it('rejects passwords containing an embedded numeric sequence', () => {
      expect(validatePassword('my1234pass').valid).toBe(false);
      expect(validatePassword('pass1234!!').valid).toBe(false);
    });

    it('rejects passwords containing an embedded alpha sequence', () => {
      expect(validatePassword('myabcdpass').valid).toBe(false);
      expect(validatePassword('xyzabcdef!').valid).toBe(false);
    });

    it('rejects passwords containing a keyboard row sequence', () => {
      expect(validatePassword('myqwerty!!').valid).toBe(false);
      expect(validatePassword('asdfghjkl1').valid).toBe(false);
    });

    it('rejects passwords that are purely a sequence', () => {
      expect(validatePassword('12345678').valid).toBe(false);
      expect(validatePassword('abcdefgh').valid).toBe(false);
      expect(validatePassword('qwertyui').valid).toBe(false);
    });

    it('rejects descending sequences', () => {
      expect(validatePassword('my9876pass').valid).toBe(false);
      expect(validatePassword('myzyxwpass').valid).toBe(false);
    });

    it('accepts passwords without sequential runs', () => {
      const result = validatePassword('Tr0ub4dor!');
      expect(result.errors.some(e => e.includes('sequence'))).toBe(false);
    });

    it('accepts passwords where no 4-char run appears in a known sequence', () => {
      // "bdfh" skips letters — not a sequential run
      const result = validatePassword('bdfhjlnp!!');
      expect(result.errors.some(e => e.includes('sequence'))).toBe(false);
    });
  });

  describe('valid passwords', () => {
    it('accepts a strong passphrase', () => {
      expect(validatePassword('correct-horse-battery').valid).toBe(true);
    });

    it('accepts a mixed-character password without sequences', () => {
      expect(validatePassword('Tr0ub4dor!').valid).toBe(true);
    });

    it('returns no errors for a valid password', () => {
      const result = validatePassword('Wh!teN0ise');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
