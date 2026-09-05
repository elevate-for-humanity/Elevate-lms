// @vitest-environment node

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { isPausedSettingValue } from '@/lib/course-builder/generation-control';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exists = (relativePath: string) => fs.existsSync(path.join(root, relativePath));

describe('single Course Builder authority', () => {
  it('recognizes both canonical pause-setting representations', () => {
    expect(isPausedSettingValue(true)).toBe(true);
    expect(isPausedSettingValue({ paused: true })).toBe(true);
    expect(isPausedSettingValue(false)).toBe(false);
    expect(isPausedSettingValue({ paused: false })).toBe(false);
  });

  it('removes the legacy independent generated_* writer', () => {
    expect(exists('lib/ai/course-generation-worker.ts')).toBe(false);
    expect(exists('lib/ai/course-builder-cron.ts')).toBe(false);
    expect(exists('lib/ai/course-generator.ts')).toBe(false);
    expect(exists('lib/autopilot/ai-course-builder.ts')).toBe(false);
    expect(exists('scripts/build-course-pipeline.ts')).toBe(false);
  });

  it('retires direct ingestion persistence while retaining preview-only source analysis', () => {
    const route = read('apps/admin/app/api/admin/courses/ingest/route.ts');
    expect(route).toContain('PARALLEL_COURSE_PERSISTENCE_RETIRED');
    expect(route).toContain('COURSE_BUILDER_GENERATION_PAUSED');
    expect(route).not.toContain('saveCourseBlueprint');
    expect(route).not.toContain('queueCourseMedia');
  });

  it('retires the parallel integrated POST builder', () => {
    const route = read('apps/admin/app/api/admin/course-builder/integrated/route.ts');
    expect(exists('lib/course-builder/integration.ts')).toBe(false);
    expect(route).toContain('PARALLEL_COURSE_BUILDER_RETIRED');
    expect(route).toContain('status: 410');
    expect(route).not.toContain('buildIntegratedCourse');
  });

  it('places the global pause at every production execution boundary', () => {
    const boundaries = [
      'lib/course-builder/orchestrator.ts',
      'lib/course-factory/media-service.ts',
      'lib/jobs/handlers/course-build.ts',
      'apps/admin/app/api/admin/course-builder/route.ts',
      'apps/admin/app/api/cron/process-course-builder-jobs/route.ts',
      'apps/admin/app/api/internal/videos/process-queue/route.ts',
    ];
    for (const boundary of boundaries) {
      expect(read(boundary), boundary).toMatch(
        /CourseBuilderGenerationPaused|CourseBuilderGenerationEnabled/,
      );
    }
  });

  it('keeps content persistence below completion and reserves 100 for the finalizer', () => {
    expect(read('lib/course-factory/publisher.ts')).toContain('generation_progress: 70');
    expect(read('lib/course-factory/post-generation-governance.ts')).not.toContain(
      "generation_status: 'completed'",
    );
    const lifecycle = read('lib/course-builder/build-lifecycle.ts');
    expect(lifecycle).toContain("generation_status: 'completed'");
    expect(lifecycle).toContain('generation_progress: 100');
    expect(lifecycle).toContain('media.completePackage');
  });

  it('enforces lesson and course media completion in the database', () => {
    const migration = read(
      'supabase/migrations/20260905120000_enforce_unified_course_completion.sql',
    );
    expect(migration).toContain('enforce_unified_lesson_completion_trigger');
    expect(migration).toContain('enforce_unified_course_completion_trigger');
    expect(migration).toContain("job.review_status = 'approved'");
    expect(migration).toContain("lesson.media_origin = 'generated'");
    expect(migration).toContain("'course_builder_generation_paused'");
  });

  it('keeps alternate production build workflows manual-only', () => {
    const workflows = [
      'build-cosmetology-course.yml',
      'build-esb-acceptance.yml',
      'build-registered-beauty-courses.yml',
      'business-draft-bootstrap.yml',
      'dev-studio-course-builder.yml',
      'esb-video-recovery-test.yml',
      'purge-esb-course-media.yml',
      'regenerate-barber-cosmetology.yml',
      'upgrade-authored-course.yml',
      'video-worker-smoke.yml',
    ];
    for (const workflow of workflows) {
      const triggerBlock = read(`.github/workflows/${workflow}`).split(/^permissions:/m)[0];
      expect(triggerBlock, workflow).toContain('workflow_dispatch:');
      expect(triggerBlock, workflow).not.toMatch(/\bschedule:/);
      expect(triggerBlock, workflow).not.toMatch(/\bissues:/);
      expect(triggerBlock, workflow).not.toMatch(/\bpush:/);
    }
  });
});
