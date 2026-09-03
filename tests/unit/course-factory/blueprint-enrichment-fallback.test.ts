import { describe, expect, it } from 'vitest';

import { hasGovernedBlueprintLessonFallback } from '@/lib/course-factory/factory';

describe('registered blueprint enrichment fallback', () => {
  it('preserves a complete governed lesson when optional AI enrichment fails', () => {
    expect(hasGovernedBlueprintLessonFallback({
      content: `<h2>Instruction</h2><p>${'Apply the governed safety procedure and document each verified step. '.repeat(25)}</p>`,
      quizQuestions: [{}, {}, {}],
    })).toBe(true);
  });

  it('rejects thin blueprint content as a fallback', () => {
    expect(hasGovernedBlueprintLessonFallback({
      content: '<p>Short placeholder.</p>',
      quizQuestions: [{}, {}, {}],
    })).toBe(false);
  });
});
