import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source = (path) => readFileSync(new URL('../../'+path, import.meta.url),'utf8');

test('default HVAC links use the active EPA 608 course rather than retired course', () => {
  const ids=source('lib/courses/hvac-uuids.ts');
  assert.match(ids, /export const HVAC_COURSE_ID = 'd48c61c4-8880-4d9d-9ab5-fab4dd51b201'/);
  assert.match(ids, /export const LEGACY_HVAC_COURSE_ID = '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0'/);
});

test('runtime HVAC resolution must reject inactive, unpublished or unavailable replacements', () => {
  const resolver=source('lib/courses/resolvers.ts');
  const functionSource=resolver.slice(resolver.indexOf('export async function findPublishedHvacCourseId()'),resolver.indexOf('export async function resolveHvacProgramId()'));
  assert.match(functionSource, /\.eq\('slug', 'epa608-replacement-20261019'\)/);
  assert.match(functionSource, /\.eq\('is_active', true\)/);
  assert.match(functionSource, /\.eq\('status', 'published'\)/);
  assert.match(functionSource, /ACTIVE_HVAC_COURSE_NOT_AVAILABLE/);
  assert.doesNotMatch(functionSource, /0ba9a61c-1f1b-4019-be6f-90e92eba2bc0/);
});

test('the HVAC course landing uses the active runtime course resolver', () => {
  const page = source('apps/lms/app/programs/hvac-technician/course/page.tsx');
  assert.match(page, /await findPublishedHvacCourseId\(\)/);
  assert.match(page, /\.eq\('id', activeCourseId\)/);
  assert.doesNotMatch(page, /\.eq\('slug', 'hvac-technician'\)/);
});

test('the learner page checks sign-in, publication, and enrollment before loading course content', () => {
  const page = source('apps/lms/app/programs/hvac-technician/course/page.tsx');
  const firstContentQuery = page.indexOf(".from('course_modules')");
  assert.ok(firstContentQuery > 0);
  const guards = page.slice(0, firstContentQuery);
  assert.match(guards, /if \(!user\) redirect/);
  assert.match(guards, /if \(!course\)[\s\S]+HVAC course is not published yet/);
  assert.match(guards, /\.from\('course_enrollments'\)[\s\S]+\.eq\('student_id', user.id\)[\s\S]+\.eq\('course_id', course.id\)[\s\S]+\.in\('status', accessStatuses\)[\s\S]+\.is\('revoked_at', null\)/);
  assert.match(guards, /resolveCourseEnrollment\(user.id, course.id\)[\s\S]+notFound\(\)/);
});
