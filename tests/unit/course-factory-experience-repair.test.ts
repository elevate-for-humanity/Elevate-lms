import { describe, expect, it } from 'vitest';

import { synchronizeLessonExperience } from '@/lib/course-factory/factory';
import { LearningIntelligenceSchema } from '@/lib/course-factory/learning-intelligence';

describe('Course Factory experience repair', () => {
  it('maps generated objective and learning points without empty remediation fields', () => {
    const lesson = {
      slug: 'cosmo-sanitation',
      title: 'Sanitation and Infection Control',
      domainKey: 'infection-control',
      objective: 'Apply Indiana sanitation requirements safely.',
      learningPoints: [
        'Identify contamination risks.',
        'Select the correct disinfectant.',
        'Document the sanitation procedure.',
      ],
      quizQuestions: Array.from({ length: 3 }, (_, index) => ({
        question: `Question ${index + 1}`,
        options: ['Correct', 'Incorrect A', 'Incorrect B', 'Incorrect C'],
        correctAnswer: 0,
        explanation: 'The correct response follows the sanitation procedure.',
      })),
      content: JSON.stringify({
        experience: {
          remediation: {
            passingScore: 80,
            reviewMessage: 'Review and retry.',
            objectiveMap: ['', '', ''],
            targetedActions: [{ objective: '', action: 'Review the lesson.' }],
          },
        },
      }),
    };

    synchronizeLessonExperience(lesson, {
      slug: 'infection-control',
      title: 'Infection Control',
      orderIndex: 1,
      minLessons: 1,
      maxLessons: 1,
      quizRequired: false,
      practicalRequired: false,
      isCritical: true,
      requiredLessonTypes: [],
      competencies: [],
      domainKey: 'infection-control',
      lessons: [],
    });

    const repaired = JSON.parse(lesson.content).experience;
    expect(repaired.remediation.objectiveMap).toHaveLength(3);
    expect(repaired.remediation.objectiveMap.every((value: string) => value.trim())).toBe(true);
    expect(LearningIntelligenceSchema.safeParse(repaired.intelligence).success).toBe(true);
  });
});
