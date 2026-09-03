import { describe, it, expect } from 'vitest';
import { sanitizeToText } from '../../lib/sanitize';

describe('sanitizeToText', () => {
  it('strips all HTML tags', () => {
    expect(sanitizeToText('<p>Hello <b>world</b></p>')).toBe('Hello world');
  });

  it('handles self-closing tags', () => {
    expect(sanitizeToText('line1<br/>line2')).toBe('line1line2');
  });

  it('strips script tags and their content markers', () => {
    expect(sanitizeToText('<script>alert("xss")</script>')).toBe('alert("xss")');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeToText('')).toBe('');
  });

  it('trims whitespace', () => {
    expect(sanitizeToText('  <p> hello </p>  ')).toBe('hello');
  });

  it('handles nested tags', () => {
    expect(sanitizeToText('<div><p><span>nested</span></p></div>')).toBe('nested');
  });

  it('preserves text without tags', () => {
    expect(sanitizeToText('plain text')).toBe('plain text');
  });
});
