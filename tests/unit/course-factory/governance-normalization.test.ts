import { describe, expect, it } from 'vitest';
import { deriveLessonDurationMinutes, normalizeLearningObjectives } from '@/lib/course-factory/governance-normalization';

describe('course governance normalization', () => {
  it('repairs legacy scalar objectives without inventing content', () => {
    expect(normalizeLearningObjectives({
      learningObjectives: 'Sanitize tools safely',
      content: { learning_points: ['Identify disinfectants', 'Document the procedure'] },
    })).toEqual(['Sanitize tools safely', 'Identify disinfectants', 'Document the procedure']);
  });

  it('assigns a deterministic baseline when persisted duration is zero', () => {
    expect(deriveLessonDurationMinutes({ durationMinutes: 0, lessonType: 'lesson', script: 'short narration' })).toBe(30);
    expect(deriveLessonDurationMinutes({ durationMinutes: null, lessonType: 'quiz' })).toBe(20);
  });

  it('preserves an explicitly configured duration', () => {
    expect(deriveLessonDurationMinutes({ durationMinutes: 42, lessonType: 'lesson' })).toBe(42);
  });
});
