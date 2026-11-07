import { describe, expect, it } from 'vitest';
import { speechSessionText } from '@/lib/browser/speech-recognition';
describe('live Studio dictation', () => {
  it('shows interim words immediately and replaces corrections without duplication', () => {
    const result = (text: string, isFinal: boolean) => ({ length: 1, 0: { isFinal, 0: { transcript: text } } });
    expect(speechSessionText('Please', result('build a core', false))).toBe('Please build a core');
    expect(speechSessionText('Please', result('build a course', true))).toBe('Please build a course');
  });
  it('preserves earlier final phrases while the next phrase is interim', () => {
    expect(speechSessionText('', { length: 2, 0: { isFinal: true, 0: { transcript: 'Build a course.' } }, 1: { isFinal: false, 0: { transcript: 'Add a lesson' } } })).toBe('Build a course. Add a lesson');
  });
});
