import { describe, expect, it } from 'vitest';
import {
  evaluatePublishChecklist,
  lessonHasRequiredWork,
  missingPublishItems,
} from '@/lib/course-builder/publish-checklist';
import type { BuilderLesson, ProgramBuilderTemplate } from '@/lib/course-builder/schema';

const lesson = (overrides: Partial<BuilderLesson>): BuilderLesson =>
  ({
    title: 'Intro Lesson',
    slug: 'intro-lesson',
    lessonType: 'reading',
    ...overrides,
  }) as BuilderLesson;

const template = (overrides: Partial<ProgramBuilderTemplate>): ProgramBuilderTemplate =>
  ({
    title: 'HVAC Technician',
    slug: 'hvac-technician',
    credentialTarget: 'FEDERAL',
    minimumHours: 144,
    requiresFinalExam: true,
    finalExam: { required: true },
    certificateRequirements: {
      includeHours: true,
      includeCompetencies: true,
      includeInstructorVerification: true,
      includeCompletionDate: true,
      includeVerificationUrl: true,
    },
    modules: [{ title: 'Core', slug: 'core', lessons: [lesson({})] }],
    regulatory: {
      complianceProfileKey: 'custom_regulated',
      credentialTarget: 'FEDERAL',
      governingBody: 'U.S. Environmental Protection Agency',
      governingStandardVersion: 'EPA 608 Core + Types I, II, III',
    },
    socCode: '49-9021.00',
    cipCode: '47.0201',
    tuition: { costDollars: 5000 },
    workbook: { workbookId: 'wb-hvac', slug: 'hvac-workbook', title: 'HVAC Workbook' },
    ...overrides,
  }) as ProgramBuilderTemplate;

describe('publish checklist — build standard', () => {
  it('a lesson with a required activity satisfies the required-work item', () => {
    const withWork = template({
      modules: [
        {
          title: 'Core',
          slug: 'core',
          lessons: [
            lesson({ activities: [{ type: 'worksheet', label: 'Worksheet', required: true }] }),
          ],
        },
      ],
    });
    expect(lessonHasRequiredWork(withWork.modules[0].lessons[0])).toBe(true);
    expect(missingPublishItems(withWork)).toEqual([]);
  });

  it('an assessed lesson (quiz) counts its own assessment as required work', () => {
    const quiz = template({
      modules: [{ title: 'Core', slug: 'core', lessons: [lesson({ lessonType: 'quiz' })] }],
    });
    expect(missingPublishItems(quiz)).toEqual([]);
  });

  it('names every missing alignment field, itemized', () => {
    const bare = template({
      regulatory: { complianceProfileKey: '', credentialTarget: 'FEDERAL' } as any,
      credentialTarget: '' as any,
      socCode: null,
      cipCode: null,
      tuition: null,
      workbook: null,
    });
    const keys = missingPublishItems(bare).map((item) => item.key);
    expect(keys).toContain('alignment.governing-body');
    expect(keys).toContain('alignment.governing-standard');
    expect(keys).toContain('alignment.compliance-profile');
    expect(keys).toContain('alignment.credential');
    expect(keys).toContain('alignment.tuition');
    expect(keys).toContain('alignment.soc-code');
    expect(keys).toContain('alignment.cip-code');
    expect(keys).toContain('workbook.attached');
  });

  it('flags a lesson with no required activity or assignment, with a fix target', () => {
    const missing = missingPublishItems(template({}));
    const item = missing.find((i) => i.key === 'lesson-work.intro-lesson');
    expect(item).toBeTruthy();
    expect(item?.fix).toEqual({ section: 'lessons', lessonSlug: 'intro-lesson' });
  });

  it('a required assignment satisfies the lesson', () => {
    const withAssignment = template({
      modules: [
        {
          title: 'Core',
          slug: 'core',
          lessons: [lesson({ assignments: [{ title: 'Lab report', required: true }] })],
        },
      ],
    });
    expect(missingPublishItems(withAssignment)).toEqual([]);
  });

  it('an optional assignment alone does not satisfy the lesson', () => {
    const optionalOnly = template({
      modules: [
        {
          title: 'Core',
          slug: 'core',
          lessons: [lesson({ assignments: [{ title: 'Extra reading', required: false }] })],
        },
      ],
    });
    expect(missingPublishItems(optionalOnly).map((i) => i.key)).toContain(
      'lesson-work.intro-lesson',
    );
  });

  it('tuition: explicit free satisfies; $0 without the free flag does not', () => {
    expect(
      missingPublishItems(template({ tuition: { isFree: true } })).map((i) => i.key),
    ).not.toContain('alignment.tuition');
    expect(
      missingPublishItems(template({ tuition: { costDollars: 0 } })).map((i) => i.key),
    ).toContain('alignment.tuition');
  });

  it('hands-on trades require a simulation activity; others do not', () => {
    const tradeNoSim = template({
      handsOnTrade: true,
      modules: [
        {
          title: 'Core',
          slug: 'core',
          lessons: [
            lesson({ activities: [{ type: 'worksheet', label: 'Worksheet', required: true }] }),
          ],
        },
      ],
    });
    expect(missingPublishItems(tradeNoSim).map((i) => i.key)).toContain('simulation.attached');

    const tradeWithSim = template({
      handsOnTrade: true,
      modules: [
        {
          title: 'Core',
          slug: 'core',
          lessons: [
            lesson({
              activities: [
                {
                  type: 'simulation',
                  label: 'Equipment sim',
                  required: true,
                  simulationId: 'hvac-equipment-simulation',
                },
              ],
            }),
          ],
        },
      ],
    });
    expect(missingPublishItems(tradeWithSim)).toEqual([]);

    const nonTrade = evaluatePublishChecklist(template({ handsOnTrade: false }));
    expect(nonTrade.map((i) => i.key)).not.toContain('simulation.attached');
  });
});
