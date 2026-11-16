import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

const source = stripTypeScriptTypes(readFileSync(new URL('../../lib/admin/course-preview.ts', import.meta.url), 'utf8'))
  .replace(/^import[^\n]*\n/gm, '')
  .replace(/^export /gm, '');

function fixture({ userId = null, authError = null, handoff = null, portalActor = null,
  role = 'admin', suspended = false, active = true, enrolled = true, enrollmentError = null, assignedCourse = null } = {}) {
  const reads = [], subjects = [], assignments = [];
  const db = { from(table) {
    reads.push(table);
    const q = { select() { return q; }, eq() { return q; }, is() { return q; },
      async maybeSingle() { return table === 'profiles'
        ? { data: { role, suspended, is_active: active } }
        : { data: enrolled ? { id: 'enrollment' } : null, error: enrollmentError }; } };
    return q;
  } };
  const dependencies = {
    cookies: async () => ({ get: () => ({ value: 'cookie' }) }),
    createClient: async () => ({ auth: { getUser: async () => ({ data: { user: userId ? { id: userId } : null }, error: authError }) } }),
    requireAdminClient: async () => db,
    resolveApprenticeshipRuntimeContext: async (client, options) => {
      assert.equal(client, db);
      assignments.push(options);
      return assignedCourse ? { enrollment: { course_id: assignedCourse } } : null;
    },
    verifyPortalPreviewHandoff: () => handoff,
    resolvePortalPreviewSubject: async (_, authenticatedId) => {
      subjects.push(authenticatedId);
      const previewing = Boolean(portalActor && (!authenticatedId || authenticatedId === portalActor));
      return { userId: previewing ? 'selected-learner' : authenticatedId, previewing };
    },
  };
  return { reads, subjects, assignments, resolve: new Function(...Object.keys(dependencies), `${source}; return resolveCoursePreview;`)(...Object.values(dependencies)) };
}

for (const userId of ['amanda', 'other-apprentice', 'student', 'host-shop', 'program-holder']) {
  test(`retained course preview cannot override signed-in ${userId}`, async () => {
    const f = fixture({ userId, handoff: { actorId: 'admin', targetId: 'course' } });
    assert.equal((await f.resolve('course')).active, false);
    assert.deepEqual(f.reads, []);
  });
  test(`retained portal preview cannot override signed-in ${userId}`, async () => {
    const f = fixture({ userId, portalActor: 'admin' });
    assert.equal((await f.resolve('course')).active, false);
    assert.deepEqual(f.subjects, [userId]);
    assert.ok(!f.reads.includes('course_enrollments'));
  });
}
test('matching authenticated administrator retains course review', async () => {
  const f = fixture({ userId: 'admin', handoff: { actorId: 'admin', targetId: 'course' } });
  assert.equal((await f.resolve('course')).active, true);
});
test('signed cross-service review still works without a local session', async () => {
  const f = fixture({ authError: { name: 'AuthSessionMissingError' }, handoff: { actorId: 'admin', targetId: 'course' } });
  assert.equal((await f.resolve('course')).active, true);
});
test('auth service failures cannot fall back to cookie-only review', async () => {
  const f = fixture({ authError: { name: 'AuthRetryableFetchError' }, handoff: { actorId: 'admin', targetId: 'course' } });
  assert.equal((await f.resolve('course')).active, false);
  assert.deepEqual(f.reads, []);
});
for (const options of [{ role: 'student' }, { suspended: true }, { active: false }]) {
  test(`administrator role and account checks remain enforced: ${JSON.stringify(options)}`, async () => {
    const f = fixture({ ...options, handoff: { actorId: 'admin', targetId: 'course' } });
    assert.equal((await f.resolve('course')).active, false);
  });
}
test('another course cannot reuse the course review token', async () => {
  const f = fixture({ userId: 'admin', handoff: { actorId: 'admin', targetId: 'other-course' } });
  assert.equal((await f.resolve('course')).active, false);
});
for (const options of [{ enrolled: false }, { enrollmentError: Error('unavailable') }]) {
  test('portal preview denies missing enrollment without assignment or failed enrollment lookup', async () => {
    const f = fixture({ ...options, userId: 'admin', portalActor: 'admin' });
    assert.equal((await f.resolve('course')).active, false);
  });
}
test('valid portal preview uses the authenticated administrator identity', async () => {
  const f = fixture({ userId: 'admin', portalActor: 'admin' });
  assert.equal((await f.resolve('course')).active, true);
  assert.deepEqual(f.subjects, ['admin']);
});

test('verified portal preview can inspect only its exact assigned draft course', async () => {
  const f = fixture({ userId: 'admin', portalActor: 'admin', enrolled: false, assignedCourse: 'draft-course' });
  assert.equal((await f.resolve('draft-course')).active, true);
  assert.deepEqual(f.assignments, [{ userId: 'selected-learner', requireRegisteredStandard: false }]);
  assert.equal((await f.resolve('unrelated-course')).active, false);
});
test('operational assignment cannot bypass failed enrollment lookup or ordinary learner authorization', async () => {
  const unavailable = fixture({ userId: 'admin', portalActor: 'admin', enrolled: false, assignedCourse: 'course', enrollmentError: Error('unavailable') });
  assert.equal((await unavailable.resolve('course')).active, false);
  assert.deepEqual(unavailable.assignments, []);
  const learner = fixture({ userId: 'student', portalActor: 'admin', enrolled: false, assignedCourse: 'course' });
  assert.equal((await learner.resolve('course')).active, false);
  assert.deepEqual(learner.assignments, []);
});
