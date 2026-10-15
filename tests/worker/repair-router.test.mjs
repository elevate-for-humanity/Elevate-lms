import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { test } from 'node:test';

const source = stripTypeScriptTypes(
  readFileSync(new URL('../../lib/ultimate-course-builder/core/repair-router.ts', import.meta.url), 'utf8'),
  { mode: 'transform' },
).replace(/^import[\s\S]*?from ['"][^'"]+['"];?\n/gm, '').replaceAll('export ', '');
const { isDurableExternalBlocker, routeSelectiveRepairs } =
  new Function(source + '\nreturn { isDurableExternalBlocker, routeSelectiveRepairs };')();

test('unchanged producer output is an internal repair failure, not an external blocker', () => {
  assert.equal(isDurableExternalBlocker({ code: 'REPAIR_PRODUCER_UNCHANGED' }), false);
  assert.equal(routeSelectiveRepairs([{ code: 'REPAIR_PRODUCER_UNCHANGED', message: 'unchanged' }]).length, 0);
});

test('license and authorization evidence remains an external blocker', () => {
  assert.equal(isDurableExternalBlocker({ code: 'MEDIA_LICENSE_REQUIRED' }), true);
  assert.equal(isDurableExternalBlocker({ code: 'PAID_INFERENCE_AUTHORIZATION_REQUIRED' }), true);
});

test('phone-size unreadable text routes to the scene producer', () => {
  assert.deepEqual(
    routeSelectiveRepairs([{ code: 'MEDIA_TEXT_UNREADABLE', message: 'MEDIA_TEXT_UNREADABLE:3:390' }]),
    [{ step: 'scene_construction', codes: ['MEDIA_TEXT_UNREADABLE'], rebuildOnlyThisStage: true }],
  );
});
