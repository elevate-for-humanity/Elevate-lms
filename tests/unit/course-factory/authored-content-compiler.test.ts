import { describe, expect, it } from 'vitest';
import {
  buildAuthoredCoursePackage,
  compileAuthoredLessonExperience,
} from '@/lib/course-factory/authored-content-compiler';
import { barberApprenticeshipBlueprint } from '@/lib/curriculum/blueprints/barber';

const questions = [
  {
    question: 'Which contact time must be followed for an EPA-registered disinfectant?',
    options: [
      'The product label time',
      'Ten seconds',
      'Until the surface looks dry',
      'Any time chosen by the operator',
    ],
    correctAnswer: 0,
    explanation: 'The product label supplies the approved contact time for that disinfectant.',
  },
  {
    question: 'What must happen before a nonporous implement is placed in disinfectant?',
    options: [
      'Visible debris must be removed',
      'It must be heated',
      'It must be stored overnight',
      'It must be wrapped in paper',
    ],
    correctAnswer: 0,
    explanation:
      'Cleaning removes visible soil so the disinfectant can contact the implement surface.',
  },
  {
    question: 'What is the correct response when a porous single-use item is contaminated?',
    options: [
      'Discard it',
      'Return it to storage',
      'Spray it and reuse it',
      'Share it with another station',
    ],
    correctAnswer: 0,
    explanation:
      'A contaminated porous single-use item cannot be disinfected for reuse and must be discarded.',
  },
];

const html = `
  <h2>Cleaning before disinfection</h2>
  <p>Barber implements must first be cleaned to remove hair, product residue, and other visible soil. The learner uses the approved cleaning method for the tool, rinses when the manufacturer directs it, and checks every surface before moving to disinfection. Skipping this step can shield microorganisms from the disinfectant and makes the later process unreliable.</p>
  <p>The workstation separates used tools from cleaned tools so contaminated items cannot be mistaken for ready-to-use equipment. The learner documents the completed cleaning step and follows the implement manufacturer's care instructions.</p>
  <h2>Label-directed disinfection</h2>
  <p>After cleaning, a compatible nonporous implement is fully exposed to an EPA-registered disinfectant for the contact time printed on that product's label. The solution is mixed, replaced, and stored according to the label. The learner never shortens the contact time because a station is busy and never combines chemicals unless the manufacturer expressly directs it.</p>
  <p>Gloves and other protective measures are selected from the product label and workplace safety procedure. Containers remain labeled and closed when required, and the learner records when a prepared solution must be replaced.</p>
  <h2>Storage and single-use controls</h2>
  <p>Once the disinfection process is complete, implements are dried or handled as the product and tool instructions require and then placed in clean, covered storage. Used implements stay physically separated from disinfected implements throughout the service cycle. Porous items intended for one client are discarded after use and are never returned to clean storage.</p>
  <p>The final station check confirms that containers are labeled, single-use waste is removed, clean tools are protected, and the next client will not encounter an item from the previous service. These observable checks provide evidence that the infection-control procedure was completed.</p>
`;

describe('authored content compiler', () => {
  it('compiles the complete 50-lesson Barber repository blueprint end to end', () => {
    const result = buildAuthoredCoursePackage(
      barberApprenticeshipBlueprint,
      'Prestige Elevation Barber Curriculum',
    );
    const lessons = result.modules.flatMap((courseModule) => courseModule.lessons ?? []);

    expect(result.modules).toHaveLength(8);
    expect(lessons).toHaveLength(50);
    for (const lesson of lessons) {
      const content = JSON.parse(String(lesson.content));
      expect(content.experience.readingGuide.sections.length).toBeGreaterThanOrEqual(3);
      expect(content.experience.flashcards.length).toBeGreaterThanOrEqual(6);
      expect(content.experience.quickClips).toHaveLength(2);
      expect(content.experience.knowledgeChecks).toHaveLength(3);
      expect(content.experience.narrationScript.length).toBeGreaterThan(200);
    }
  });

  it('builds the complete interactive contract from substantive authored lesson evidence', () => {
    const result = compileAuthoredLessonExperience({
      courseTitle: 'Prestige Elevation Barber Curriculum',
      moduleTitle: 'Infection Control & Safety',
      lessonTitle: 'Cleaning and Disinfecting Implements',
      lessonSlug: 'cleaning-disinfecting-implements',
      domainKey: 'infection_control',
      html,
      learningObjectives: [
        'Differentiate cleaning from disinfection.',
        'Apply label-directed contact time to nonporous implements.',
        'Demonstrate protected storage and single-use disposal controls.',
      ],
      quizQuestions: questions,
      keyTerms: [
        { term: 'Cleaning', definition: 'Removal of visible soil before disinfection.' },
        {
          term: 'Disinfection',
          definition: 'Use of an approved product according to its label on a compatible surface.',
        },
        {
          term: 'Contact time',
          definition: 'The label-directed time a surface remains exposed to disinfectant.',
        },
        {
          term: 'Single-use item',
          definition: 'An item intended for one client that is discarded after use.',
        },
      ],
    });

    expect(result.experience.readingGuide.sections).toHaveLength(3);
    expect(result.experience.flashcards.length).toBeGreaterThanOrEqual(6);
    expect(result.experience.quickClips).toHaveLength(2);
    expect(result.experience.knowledgeChecks).toHaveLength(3);
    expect(result.experience.narrationScript.length).toBeGreaterThan(200);
    expect(JSON.stringify(result.experience)).not.toMatch(
      /deterministic baseline|intentionally general/i,
    );
  });

  it('blocks generic fallback content instead of publishing it', () => {
    expect(() =>
      compileAuthoredLessonExperience({
        courseTitle: 'Course',
        moduleTitle: 'Module',
        lessonTitle: 'Generic Lesson',
        lessonSlug: 'generic-lesson',
        domainKey: 'generic',
        html: `<p>${'This deterministic baseline is intentionally general and uses a reusable decision process. '.repeat(20)}</p>`,
        learningObjectives: ['Apply one.', 'Apply two.', 'Apply three.'],
        quizQuestions: questions,
      }),
    ).toThrow(/generic baseline content is prohibited/i);
  });
});
