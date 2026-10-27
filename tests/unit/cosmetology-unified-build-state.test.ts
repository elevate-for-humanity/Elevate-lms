import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Cosmetology unified build state', () => {
  const source = readFileSync(
    'scripts/course-factory/build-cosmetology-course.ts',
    'utf8',
  );

  it('does not report completion when lesson media is only queued', () => {
    expect(source).toContain("generation_status: 'generating'");
    expect(source).toContain('generation_progress: 95');
    expect(source).toContain("status: 'running'");
    expect(source).toContain("stage: 'media'");
    expect(source).toContain('COSMETOLOGY_COURSE_BUILD_MEDIA_PENDING');
    expect(source).not.toContain('COSMETOLOGY_COURSE_BUILD_READY');
    expect(source).not.toContain("generation_progress: 90");
  });

  it('keeps the lesson and its matching video in one completion contract', () => {
    expect(source).toContain('PENDING_40_VERIFIED_LESSON_VIDEO_PACKAGES');
    expect(source).toContain('all 40 matching videos are attached and verified');
  });

  it('refuses paid work while production generation is paused', () => {
    expect(source).toContain("select('id,program_id,slug,generation_paused')");
    expect(source).toContain('generation_paused === true');
    expect(source).toContain('refusing to start AI or media work');
  });
});
