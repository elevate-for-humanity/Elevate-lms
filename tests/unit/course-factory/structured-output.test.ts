import { describe, expect, it } from 'vitest';
import { normalizeStructuredOutput } from '../../../lib/ai/providers/structured-output';
import type { ChatCompletionOptions } from '../../../lib/ai/types';

function options(user: string): ChatCompletionOptions {
  return {
    messages: [
      { role: 'system', content: 'Return ONLY valid JSON.' },
      { role: 'user', content: user },
    ],
  };
}

describe('normalizeStructuredOutput', () => {
  it('extracts a balanced JSON object from leading prose and markdown', () => {
    const raw = 'Here is a response:\n```json\n{"ok":true,"nested":{"value":1}}\n```\nExtra text';
    expect(normalizeStructuredOutput(raw, options('Return JSON only.'))).toBe(
      '{"ok":true,"nested":{"value":1}}',
    );
  });

  it('escapes literal control characters inside JSON strings', () => {
    const raw = '{"content":"Line one\nLine two\tTabbed","ok":true}';
    const normalized = normalizeStructuredOutput(raw, options('Return ONLY valid JSON.'));
    expect(() => JSON.parse(normalized)).not.toThrow();
    expect(JSON.parse(normalized).content).toBe('Line one\nLine two\tTabbed');
  });

  it('converts model-emitted backtick HTML values into JSON strings', () => {
    const raw = '{"objective":"Apply the concept","content":`\n<h1>Lesson</h1>\n<p>Apply evidence.</p>\n`,"ok":true}';
    const normalized = normalizeStructuredOutput(raw, options('Return ONLY valid JSON.'));
    expect(() => JSON.parse(normalized)).not.toThrow();
    expect(JSON.parse(normalized).content).toContain('<h1>Lesson</h1>');
  });

  it('does not rewrite ordinary non-JSON responses', () => {
    const raw = 'Use {braces} as an example in normal explanatory text.';
    const plainOptions: ChatCompletionOptions = {
      messages: [{ role: 'user', content: 'Explain this concept.' }],
    };
    expect(normalizeStructuredOutput(raw, plainOptions)).toBe(raw);
  });
});
