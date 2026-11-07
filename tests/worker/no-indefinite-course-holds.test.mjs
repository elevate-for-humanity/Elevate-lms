import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const runtimeFiles = [
  'scripts/gcp/paris-course-monitor.mjs',
  'scripts/gcp/dispatch-course-job.mjs',
  'scripts/gcp/resume-repaired-course-jobs.mjs',
  'scripts/gcp/dispatch-lesson-autopilots.mjs',
  'lib/ultimate-course-builder/worker/paris-monitor.mjs',
  'components/admin/course-builder/ParallelLessonAutopilots.tsx',
  'components/admin/course-builder/UnifiedCourseBuilder.tsx',
  'scripts/operations/paris-runtime-watch.mjs',
];

test('course builder runtime never parks or dispatches based on infinity timestamp sentinels', () => {
  for (const path of runtimeFiles) {
    const source=readFileSync(path,'utf8');
    assert.doesNotMatch(source, /available_at\s*(?:===|!==|==|!=)\s*['"]infinity['"]/,
      path+' must use canonical readiness and finite availability');
    assert.doesNotMatch(source, /available_at=eq\.infinity/,
      path+' must not query sentinel-held jobs');
    assert.doesNotMatch(source, /['"]infinity['"]::timestamptz/,
      path+' must not create indefinite holds');
  }
});
