import { describe, expect, it } from 'vitest';

import { hasGovernedBlueprintLessonFallback } from '@/lib/course-factory/factory';

describe('registered blueprint enrichment fallback', () => {
  it('rejects legacy HTML that lacks the complete governed experience contract', () => {
    expect(hasGovernedBlueprintLessonFallback({
      content: `<h2>Instruction</h2><p>${'Apply the governed safety procedure and document each verified step. '.repeat(25)}</p>`,
      quizQuestions: [{}, {}, {}],
    })).toBe(false);
  });

  it('rejects thin blueprint content as a fallback', () => {
    expect(hasGovernedBlueprintLessonFallback({
      content: '<p>Short placeholder.</p>',
      quizQuestions: [{}, {}, {}],
    })).toBe(false);
  });
});
