import { describe, it, expect } from 'vitest';
import {
  emailSchema,
  nameSchema,
  phoneSchema,
  uuidSchema,
  slugSchema,
  userSchemas,
  sanitizeInput,
  sanitizeObject,
  validateAndSanitize,
} from '../../lib/input-validation';

describe('input-validation schemas', () => {
  describe('emailSchema', () => {
    it('accepts valid emails', () => {
      expect(emailSchema.safeParse('user@example.com').success).toBe(true);
      expect(emailSchema.safeParse('a.b+c@domain.co').success).toBe(true);
    });

    it('rejects invalid emails', () => {
      expect(emailSchema.safeParse('not-an-email').success).toBe(false);
      expect(emailSchema.safeParse('').success).toBe(false);
    });

    it('rejects emails over 255 chars', () => {
      const longEmail = 'a'.repeat(250) + '@b.com';
      expect(emailSchema.safeParse(longEmail).success).toBe(false);
    });
  });

  describe('nameSchema', () => {
    it('accepts valid names', () => {
      expect(nameSchema.safeParse('John Doe').success).toBe(true);
      expect(nameSchema.safeParse("O'Brien").success).toBe(true);
      expect(nameSchema.safeParse('Mary-Jane').success).toBe(true);
    });

    it('rejects names with numbers or special chars', () => {
      expect(nameSchema.safeParse('John123').success).toBe(false);
      expect(nameSchema.safeParse('A@B').success).toBe(false);
    });

    it('rejects names that are too short or too long', () => {
      expect(nameSchema.safeParse('A').success).toBe(false);
      expect(nameSchema.safeParse('A'.repeat(101)).success).toBe(false);
    });
  });

  describe('phoneSchema', () => {
    it('accepts valid E.164 phone numbers', () => {
      expect(phoneSchema.safeParse('+14155552671').success).toBe(true);
      expect(phoneSchema.safeParse('14155552671').success).toBe(true);
    });

    it('rejects invalid phone formats', () => {
      expect(phoneSchema.safeParse('abc').success).toBe(false);
      expect(phoneSchema.safeParse('0000').success).toBe(false);
    });

    it('allows undefined (optional)', () => {
      expect(phoneSchema.safeParse(undefined).success).toBe(true);
    });
  });

  describe('uuidSchema', () => {
    it('accepts valid UUIDs', () => {
      expect(uuidSchema.safeParse('550e8400-e29b-41d4-a716-446655440000').success).toBe(true);
    });

    it('rejects non-UUID strings', () => {
      expect(uuidSchema.safeParse('not-a-uuid').success).toBe(false);
    });
  });

  describe('slugSchema', () => {
    it('accepts valid slugs', () => {
      expect(slugSchema.safeParse('my-slug-123').success).toBe(true);
    });

    it('rejects uppercase or special chars', () => {
      expect(slugSchema.safeParse('My_Slug').success).toBe(false);
      expect(slugSchema.safeParse('has spaces').success).toBe(false);
    });
  });
});

describe('sanitizeInput', () => {
  it('trims whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
  });

  it('strips angle brackets', () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
  });

  it('truncates to 10000 chars', () => {
    const long = 'a'.repeat(20000);
    expect(sanitizeInput(long).length).toBe(10000);
  });
});

describe('sanitizeObject', () => {
  it('sanitizes string values recursively', () => {
    const result = sanitizeObject({ name: '  <b>Test</b>  ', age: 25 });
    expect(result.name).toBe('bTest/b');
    expect(result.age).toBe(25);
  });

  it('handles nested objects', () => {
    const result = sanitizeObject({ user: { name: '  <em>Jo</em>  ' } });
    expect(result.user.name).toBe('emJo/em');
  });
});

describe('validateAndSanitize', () => {
  it('parses and sanitizes valid data', () => {
    const result = validateAndSanitize(userSchemas.createUser, {
      email: 'test@example.com',
      name: 'Jane Doe',
    });
    expect(result.email).toBe('test@example.com');
    expect(result.name).toBe('Jane Doe');
  });

  it('throws on invalid data', () => {
    expect(() =>
      validateAndSanitize(userSchemas.createUser, { email: 'invalid', name: 'X' }),
    ).toThrow();
  });
});
