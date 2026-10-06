import test from 'node:test';
import assert from 'node:assert/strict';
import { verifySdk } from './verify-sdk.mjs';
test('accepts the verified maintained SDK and fails closed on an old or unknown CLI', () => {
  assert.equal(verifySdk('586.0.0').passed, true);
  assert.equal(verifySdk('587.0.1').passed, true);
  for (const version of ['585.0.0', undefined, 'latest', '586.0.0-beta', 'private-error']) assert.throws(() => verifySdk(version));
});
