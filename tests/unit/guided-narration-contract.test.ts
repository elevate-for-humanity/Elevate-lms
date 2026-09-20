import { describe, expect, it } from 'vitest';
import { buildGuidedNarration } from '@/lib/narration/guided-script';

describe('guided narration contract', () => {
  it('teaches one idea, allows reflection, and closes with one action', () => {
    const narration = buildGuidedNarration({
      welcome: 'Let us work through this together.',
      concept: 'First, understand the reason for the process.',
      example: 'For example, practice the step with a supervisor.',
      reflection: 'Pause and connect this idea to your own goal.',
      nextStep: 'Next, open the lesson and complete the first activity.',
    });

    expect(narration).toBe(
      'Let us work through this together. First, understand the reason for the process. For example, practice the step with a supervisor. Pause and connect this idea to your own goal. Next, open the lesson and complete the first activity.',
    );
  });

  it('includes a learner pause when a page author does not provide one', () => {
    const narration = buildGuidedNarration({
      welcome: 'Welcome.',
      concept: 'This is the idea.',
      nextStep: 'Open the first lesson.',
    });

    expect(narration).toContain('Take a moment to think about how that fits your goal.');
  });
});
