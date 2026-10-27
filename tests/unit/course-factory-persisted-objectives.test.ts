import { describe, expect, it } from 'vitest';

import { normalizePersistedLessonObjectives } from '@/lib/course-factory/generation-checkpoints';

describe('persisted Course Factory objective repair', () => {
  it('reconstructs objectives from existing generated content without inventing data', () => {
    expect(
      normalizePersistedLessonObjectives({
        objective: 'Apply sanitation procedures safely.',
        learningObjectives: null,
        content: {
          learning_points: [
            'Identify contamination risks.',
            'Select the correct disinfectant.',
            'Document the sanitation procedure.',
          ],
        },
      }),
    ).toEqual([
      'Apply sanitation procedures safely.',
      'Identify contamination risks.',
      'Select the correct disinfectant.',
      'Document the sanitation procedure.',
    ]);
  });

  it('trims and deduplicates persisted objectives', () => {
    expect(
      normalizePersistedLessonObjectives({
        objective: ' Apply sanitation procedures safely. ',
        learningObjectives: ['Apply sanitation procedures safely.'],
        content: { learning_points: ['Identify contamination risks.'] },
      }),
    ).toEqual(['Apply sanitation procedures safely.', 'Identify contamination risks.']);
  });
});
