import { describe, expect, it } from 'vitest';
import {
  getInstructorById,
  getInstructorForBlueprint,
  getInstructorForCourse,
} from '@/lib/ai-instructors';

describe('course instructor routing', () => {
  it('never routes cosmetology to the master barber', () => {
    const instructor = getInstructorForCourse('Indiana Cosmetology Apprenticeship');
    expect(instructor.id).toBe('avery-brooks');
    expect(instructor.title.toLowerCase()).not.toContain('barber');
  });

  it('keeps barbering routed to the barber instructor', () => {
    expect(getInstructorForCourse('Barber Apprenticeship').id).toBe('james-williams');
  });

  it('keeps the general fallback stable', () => {
    expect(getInstructorForCourse('Workplace Fundamentals').id).toBe('angela-thompson');
  });

  it('resolves a blueprint-governed instructor without a fallback', () => {
    expect(getInstructorById('avery-brooks').specialty).toContain('Cosmetology');
    expect(() => getInstructorById('missing-instructor')).toThrow('AI_INSTRUCTOR_MISSING');
  });

  it('uses the governed HVAC instructor when the credential title omits HVAC', () => {
    expect(
      getInstructorForBlueprint('EPA Section 608 Technician Certification', {
        instructorId: 'marcus-johnson',
        instructorName: 'Marcus Johnson',
      }).id,
    ).toBe('marcus-johnson');
  });
});
