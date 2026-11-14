import { describe, it, expect } from 'vitest';
import { extractJSON } from '../../lib/extract-json';

describe('extractJSON', () => {
  it('parses a plain JSON object', () => {
    expect(extractJSON('{"key": "value"}')).toEqual({ key: 'value' });
  });

  it('parses a plain JSON array', () => {
    expect(extractJSON('[1, 2, 3]')).toEqual([1, 2, 3]);
  });

  it('extracts JSON from markdown fences', () => {
    const input = 'Here is the result:\n```json\n{"name": "test"}\n```\nDone.';
    expect(extractJSON(input)).toEqual({ name: 'test' });
  });

  it('extracts JSON from prose preamble', () => {
    const input = 'Sure! Here is your data: {"count": 42, "items": []}. Hope that helps!';
    expect(extractJSON(input)).toEqual({ count: 42, items: [] });
  });

  it('handles nested objects correctly', () => {
    const input = '{"a": {"b": {"c": true}}}';
    expect(extractJSON(input)).toEqual({ a: { b: { c: true } } });
  });

  it('handles strings with braces inside', () => {
    const input = '{"msg": "use { and } in text"}';
    expect(extractJSON(input)).toEqual({ msg: 'use { and } in text' });
  });

  it('handles escaped quotes in strings', () => {
    const input = '{"escaped": "she said \\"hello\\""}';
    expect(extractJSON(input)).toEqual({ escaped: 'she said "hello"' });
  });

  it('picks array when it appears first', () => {
    const input = 'Result: [{"id": 1}] end';
    expect(extractJSON(input)).toEqual([{ id: 1 }]);
  });

  it('throws when no JSON structure found', () => {
    expect(() => extractJSON('no json here')).toThrow('No JSON structure found');
  });

  it('throws on incomplete JSON', () => {
    expect(() => extractJSON('{"key": "value"')).toThrow('Incomplete JSON structure');
  });
});
