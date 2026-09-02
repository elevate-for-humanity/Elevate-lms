import { describe, expect, it } from 'vitest';
import { generatedBlueprintSchema } from '@/lib/course-factory/ai-contracts';

describe('AI blueprint contract normalization', () => {
  it('normalizes rich provider keys before strict canonical validation', () => {
    const parsed = generatedBlueprintSchema.parse({
      title: 'Workforce Course',
      description: 'A complete workforce course.',
      modules: [{
        title: 'Foundations',
        description: 'Core skills.',
        content: [{ title: 'Core lesson', slug: 'core-lesson', stepType: 'content', extra: true }],
        appliedPractice: { title: 'Applied practice', slug: 'applied-practice', stepType: 'practical' },
        checkpoint: { title: 'Module checkpoint', slug: 'module-checkpoint', stepType: 'checkpoint' },
        finalExam: { title: 'Final exam', slug: 'final-exam', stepType: 'finalExam' },
      }],
    });

    expect(parsed.modules[0].lessons.map((lesson) => lesson.stepType)).toEqual([
      'lesson', 'lab', 'checkpoint', 'exam',
    ]);
    expect(parsed.modules[0]).toEqual({
      title: 'Foundations',
      description: 'Core skills.',
      lessons: parsed.modules[0].lessons,
    });
  });

  it('keeps malformed empty modules blocked', () => {
    expect(() => generatedBlueprintSchema.parse({
      title: 'Incomplete',
      description: 'Incomplete blueprint.',
      modules: [{ title: 'Empty', description: 'No learner steps.' }],
    })).toThrow();
  });
});
