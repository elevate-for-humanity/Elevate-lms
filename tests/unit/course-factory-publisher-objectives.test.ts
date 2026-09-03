import { describe, expect, it } from 'vitest';

import { buildAtomicPayload } from '@/lib/course-factory/publisher';

describe('Course Factory publisher objectives', () => {
  it('persists the generated objective and learning points', () => {
    const modules = buildAtomicPayload(
      [
        {
          slug: 'infection-control',
          title: 'Infection Control',
          orderIndex: 1,
          domainKey: 'infection-control',
          competencies: [],
          lessons: [
            {
              slug: 'cosmo-sanitation-procedures',
              title: 'Sanitation Procedures',
              order: 1,
              objective: 'Apply sanitation procedures safely.',
              content: JSON.stringify({
                html: '<p>Lesson</p>',
                learning_points: [
                  'Identify contamination risks.',
                  'Select the correct disinfectant.',
                  'Document the sanitation procedure.',
                ],
              }),
            },
          ],
        },
      ] as any,
      'Cosmetology Apprenticeship',
    );

    expect(modules[0].lessons[0].learning_objectives).toEqual([
      'Apply sanitation procedures safely.',
      'Identify contamination risks.',
      'Select the correct disinfectant.',
      'Document the sanitation procedure.',
    ]);
  });
});
