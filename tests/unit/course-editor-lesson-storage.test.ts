import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  writes: [] as Array<{ table: string; payload: Record<string, unknown> }>,
  filters: [] as Array<{ table: string; column: string; value: unknown }>,
  error: null as null | { message: string },
  moduleCourseId: '11111111-1111-4111-8111-111111111111' as string | null,
}));
const db = vi.hoisted(() => ({
  from: (table: string) => {
    const query: any = {
      insert: (payload: Record<string, unknown>) => { state.writes.push({ table, payload }); return query; },
      update: (payload: Record<string, unknown>) => { state.writes.push({ table, payload }); return query; },
      eq: (column: string, value: unknown) => { state.filters.push({ table, column, value }); return query; },
      select: () => query,
      maybeSingle: async () => ({ data: state.moduleCourseId ? { course_id: state.moduleCourseId } : null, error: state.error }),
      single: async () => ({ data: { id: 'saved-lesson' }, error: state.error }),
    };
    return query;
  },
}));
vi.mock('@/lib/course-builder/db', () => ({ getServiceDb: async () => db }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => db }));

import { saveCourseLesson, saveCourseModule } from '@/lib/course-builder/edit-service';

const input = {
  courseId: '11111111-1111-4111-8111-111111111111',
  moduleId: '22222222-2222-4222-8222-222222222222',
  slug: 'safety', title: 'Safety', orderIndex: 0, lessonType: 'practical', durationMinutes: 30,
  learningObjectives: ['Demonstrate safe operation'], content: { text: 'Safety procedure' },
  requiredArtifacts: ['video'], domainKey: 'safety', hourCategory: 'practical', evidenceType: 'video',
  deliveryMethod: 'in_person', requiresInstructorSignoff: true,
  instructorRequirement: { required: true, supervisionMethod: 'observation' },
  minimumSeatTimeMinutes: 25, fieldworkEligible: true,
};

beforeEach(() => { state.writes = []; state.filters = []; state.error = null; state.moduleCourseId = input.courseId; });

describe('manual lesson persistence uses the LMS schema', () => {
  it.each([undefined, '33333333-3333-4333-8333-333333333333'])('persists compliance fields on create/update (%s)', async (id) => {
    await saveCourseLesson({ ...input, id });
    expect(state.writes).toHaveLength(1);
    expect(state.writes[0].table).toBe('course_lessons');
    expect(state.writes[0].payload).toMatchObject({
      course_id: input.courseId, module_id: input.moduleId,
      required_artifacts: ['video'], domain_key: 'safety', hour_category: 'practical', evidence_type: 'video',
      delivery_method: 'in_person', requires_instructor_signoff: true,
      instructor_requirement: input.instructorRequirement, minimum_seat_time_minutes: 25, fieldwork_eligible: true,
    });
    expect(state.writes[0].payload).not.toHaveProperty('metadata');
    if (id) expect(state.filters).toContainEqual({ table: 'course_lessons', column: 'course_id', value: input.courseId });
  });

  it.each([null, '44444444-4444-4444-8444-444444444444'])('rejects a missing or mismatched parent module (%s)', async (moduleCourseId) => {
    state.moduleCourseId = moduleCourseId;
    await expect(saveCourseLesson(input)).rejects.toThrow('does not belong to this course');
    expect(state.writes).toHaveLength(0);
  });

  it('does not report a successful save after a database failure', async () => {
    state.error = { message: 'database unavailable' };
    await expect(saveCourseLesson(input)).rejects.toEqual(state.error);
  });

  it('scopes module edits to the selected course', async () => {
    await saveCourseModule({
      id: input.moduleId, courseId: input.courseId, title: 'Safety', slug: 'safety',
      orderIndex: 0, domainKey: 'safety', targetHours: 1, quizRequired: true, practicalRequired: true,
    });
    expect(state.filters).toContainEqual({ table: 'course_modules', column: 'course_id', value: input.courseId });
  });
});
