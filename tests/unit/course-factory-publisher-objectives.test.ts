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

  it('persists a universal learning contract at the shared publisher boundary', () => {
    const modules = buildAtomicPayload(
      [
        {
          slug: 'skills',
          title: 'Skills',
          orderIndex: 1,
          domainKey: 'skills',
          competencies: [],
          lessons: [
            {
              slug: 'guided-service',
              title: 'Guided Service',
              order: 1,
              lessonType: 'lab',
              practicalRequired: true,
              content: '<p>Practice the service safely.</p>',
            },
          ],
        },
      ] as any,
      'Universal Skills Course',
    );

    const contract = modules[0].lessons[0].content_json.learning_experience;
    expect(contract.profile).toBe('hands_on_procedure');
    expect(contract.phases.map((item: { phase: string }) => item.phase)).toEqual(
      expect.arrayContaining([
        'full_demonstration',
        'step_microvideos',
        'guided_practice',
        'rubric',
        'evidence_submission',
      ]),
    );
    expect(contract.mediaPolicy).toMatchObject({
      stockFootageContextOnly: true,
      requireHumanTechnicalReview: true,
    });
  });
});
