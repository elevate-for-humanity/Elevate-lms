import { describe, it, expect, vi, afterEach } from 'vitest';
import { runCourseFactoryPipeline } from '@/components/admin/course-builder/runCourseFactoryPipeline';
afterEach(() => vi.unstubAllGlobals());
const input = { title: 'Safety', topic: 'Workplace safety', programId: 'program-id' };
describe('browser production handoff', () => {
  it('reads a saved asynchronous job without inventing completed lessons', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ ok: true, queued: true, courseId: 'course', buildId: 'build', jobId: 'job' }, { status: 202 })));
    const event = vi.fn();
    const result = await runCourseFactoryPipeline(input, event);
    expect(result).toMatchObject({ success: true, queued: true, courseId: 'course', buildId: 'build', jobId: 'job', lessonsGenerated: 0, completionState: 'media_pending' });
    expect(event).toHaveBeenCalledWith(expect.objectContaining({ stage: 'queued' }));
  });
  it('rejects a success body without a durable production job', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ ok: true, courseId: 'course' })));
    await expect(runCourseFactoryPipeline(input)).rejects.toThrow('saved production job');
  });
  it('surfaces a dispatch failure instead of reporting completion', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ ok: false, error: 'WORKER_UNAVAILABLE' }, { status: 503 })));
    await expect(runCourseFactoryPipeline(input)).rejects.toThrow('WORKER_UNAVAILABLE');
  });
  it('accepts a dry run without dispatch IDs', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ ok: true, dryRun: true })));
    expect(await runCourseFactoryPipeline({ ...input, dryRun: true })).toMatchObject({ dryRun: true, queued: false });
  });
});
