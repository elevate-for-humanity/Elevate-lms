import { describe, it, expect } from 'vitest';
import { isTargetedCourseJob } from '@/lib/ultimate-course-builder/worker/process-job';

describe('targeted production scope', () => {
  it.each([
    { competencyId: 'barber-a' },
    { lessonBuildId: 'saved-lesson' },
    { acceptance: true },
    { ownerPreview: true },
  ])('keeps an exact lesson request out of course coordination: %j', payload => {
    expect(isTargetedCourseJob({ parallelAutopilotStart: true, ...payload })).toBe(true);
  });
  it('allows an ordinary course coordinator to process the full plan', () => {
    expect(isTargetedCourseJob({ parallelAutopilotStart: true })).toBe(false);
  });
});
