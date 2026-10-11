import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const route = readFileSync('apps/admin/app/api/admin/dev-studio/course-agent/route.ts', 'utf8');

test('fresh Devian request creates a distinct draft instead of reusing an existing course', () => {
  assert.match(route, /freshRequested/);
  assert.match(route, /reference_course_id: reference\.id/);
  assert.match(route, /status: 'draft', is_active: false/);
  assert.match(route, /courseId = created\.id/);
  assert.match(route, /dispatchGoogleDeployment\('course-builder'\)/);
  assert.match(route, /executionVerified:false/);
});
test('Devian does not silently fall back to an old build for an unresolved fresh request', () => {
  assert.match(route, /No unambiguous reference course found/);
});
