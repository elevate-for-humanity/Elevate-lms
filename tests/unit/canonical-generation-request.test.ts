import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
const start = vi.hoisted(() => vi.fn());
vi.mock('@/lib/ultimate-course-builder/core/generation-control', () => ({ assertCourseBuilderGenerationEnabled: vi.fn() }));
vi.mock('@/lib/ultimate-course-builder/core/start-course', () => ({ startCanonicalCourse: start }));
import { requestCanonicalGeneration } from '@/lib/ultimate-course-builder/core/generation-request';
import type { CredentialBlueprint } from '@/lib/curriculum/blueprints/types';

function database(result: { data: unknown; error: unknown }) {
  const query = {
    eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue(result),
    select: vi.fn().mockReturnThis(), insert: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue(result),
  };
  const from = vi.fn().mockReturnValue(query);
  return { db: { from } as unknown as SupabaseClient, from, query };
}
const course = { id: 'course-id', title: 'Safety', slug: 'safety', status: 'draft' };
beforeEach(() => start.mockReset());
describe('canonical generation handoff', () => {
  it('uses the existing course identity and the sole production starter', async () => {
    const { db, query } = database({ data: course, error: null });
    start.mockResolvedValue(Response.json({ ok: true, buildId: 'build', dispatched: true }, { status: 202 }));
    const result = await requestCanonicalGeneration(db, { courseId: course.id }, 'actor');
    expect(query.insert).not.toHaveBeenCalled();
    expect(start).toHaveBeenCalledWith(db, expect.objectContaining({ courseId: course.id }), 'actor');
    expect(result).toMatchObject({ ok: true, authority: 'ultimate-course-builder', buildId: 'build', completionState: 'media_pending' });
  });
  it('does not report a failed worker dispatch as successful generation', async () => {
    const { db } = database({ data: course, error: null });
    start.mockResolvedValue(Response.json({ ok: false, error: 'WORKER_UNAVAILABLE' }, { status: 503 }));
    const result = await requestCanonicalGeneration(db, { courseId: course.id }, 'actor');
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('WORKER_UNAVAILABLE');
  });
  it('does not generate or write during a dry-run', async () => {
    const { db, query } = database({ data: course, error: null });
    const result = await requestCanonicalGeneration(db, { courseId: course.id, dryRun: true }, 'actor');
    expect(result.dryRun).toBe(true);
    expect(start).not.toHaveBeenCalled();
    expect(query.insert).not.toHaveBeenCalled();
  });
  it('does not treat a database error as a missing course to recreate', async () => {
    const error = new Error('DATABASE_OFFLINE');
    const { db, query } = database({ data: null, error });
    await expect(requestCanonicalGeneration(db, { courseId: course.id }, 'actor')).rejects.toBe(error);
    expect(query.insert).not.toHaveBeenCalled();
    expect(start).not.toHaveBeenCalled();
  });
  it('keeps a single-lesson draft separate from the full registered program', async () => {
    const { db, query } = database({ data: null, error: null });
    query.single.mockResolvedValue({ data: { ...course, slug: 'barber-apprenticeship-safe-tools-draft' }, error: null });
    const blueprint = { programSlug: 'barber-apprenticeship', title: 'Barber', modules: [{ title: 'Tools', lessons: [
      { title: 'Tool safety', objective: 'Handle tools safely', content: 'Inspect each tool before use.' },
      { title: 'Cleaning', objective: 'Clean tools', content: 'Follow the approved disinfection procedure.' },
    ] }] } as unknown as CredentialBlueprint;
    start.mockResolvedValue(Response.json({ ok: true, buildId: 'build', dispatched: true }, { status: 202 }));
    await requestCanonicalGeneration(db, { blueprint, buildScope: 'lesson', title: 'Safe tools' }, 'actor');
    expect(query.insert).toHaveBeenCalledWith(expect.objectContaining({ program_id: null, slug: 'barber-apprenticeship-safe-tools-draft' }));
    const request = start.mock.calls[0][1];
    expect(request.programSlug).toBe('barber-apprenticeship-safe-tools-draft');
    expect(request.syllabusPlan.modules).toHaveLength(1);
    expect(request.syllabusPlan.modules[0].lessons).toHaveLength(1);
  });
  it('rejects invalid curriculum limits before writing or dispatching', async () => {
    const { db, query } = database({ data: course, error: null });
    await expect(requestCanonicalGeneration(db, { courseId: course.id, moduleCount: -1 }, 'actor')).rejects.toThrow('INVALID_REQUESTED_CURRICULUM_SIZE');
    expect(query.insert).not.toHaveBeenCalled();
    expect(start).not.toHaveBeenCalled();
  });
});
