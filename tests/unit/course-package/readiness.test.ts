import { describe, expect, it } from 'vitest';
import { evaluateCourseReadiness } from '@/lib/course-package/readiness';
import type { CoursePackage } from '@/lib/course-package/contract';

describe('evaluateCourseReadiness', () => {
  it('blocks incomplete generated assets from publication', () => {
    const course = {
      schemaVersion: '1.0', id: 'course', slug: 'course', title: 'Course', description: null,
      status: 'draft', version: 1,
      credential: { profileKey: null, governingBody: null, standardVersion: null },
      evidence: { accessibility: null, learnerPreview: null },
      modules: [{ id: 'module', slug: 'module', title: 'Module', description: null, domainKey: null, order: 1, required: true, lessons: [{
        id: 'lesson', slug: 'lesson', title: 'Lesson', type: 'lesson', order: 1, durationMinutes: 10,
        objectives: [], competencies: [], html: '', videoUrl: null, experience: null, storyboard: [], timeline: null,
        questions: [], completion: { required: true, minimumSeatTimeSeconds: 0, requiredWatchPercent: 0, requiredInteractionIds: [], passingScore: 80, instructorSignoffRequired: false, evidenceRequired: false },
        published: false, approved: false,
      }] }],
      generatedAt: '2026-09-08T00:00:00.000Z',
    } satisfies CoursePackage;
    const result = evaluateCourseReadiness(course);
    expect(result.pass).toBe(false);
    expect(result.gates.storyboard).toBe(false);
    expect(result.gates.practice_exam).toBe(false);
    expect(result.gates.credential_alignment).toBe(false);
  });
});
