import { describe, it, expect } from 'vitest';
import { validateCourse } from '../../lib/course-validation';

describe('validateCourse', () => {
  it('returns ok:true for valid course JSON with title', () => {
    const json = JSON.stringify({ title: 'HVAC Fundamentals', modules: [] });
    const result = validateCourse(json);
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ title: 'HVAC Fundamentals', modules: [] });
  });

  it('returns ok:false when title is missing', () => {
    const json = JSON.stringify({ modules: [] });
    const result = validateCourse(json);
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Operation failed');
  });

  it('returns ok:false for invalid JSON', () => {
    const result = validateCourse('not valid json');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Operation failed');
  });

  it('returns ok:false for empty string', () => {
    const result = validateCourse('');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Operation failed');
  });

  it('handles title with empty string (falsy)', () => {
    const json = JSON.stringify({ title: '' });
    const result = validateCourse(json);
    expect(result.ok).toBe(false);
  });

  it('accepts title with any truthy value', () => {
    const json = JSON.stringify({ title: 'A' });
    const result = validateCourse(json);
    expect(result.ok).toBe(true);
  });
});
