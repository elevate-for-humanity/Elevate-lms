import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveMainRelease } from './resolve-main-release.mjs';
const current = 'a'.repeat(40),
  latest = 'b'.repeat(40);
const input = { ref: 'refs/heads/main', current, requested: current, latest: current };
test('current main is eligible for exact revision verification', () => {
  assert.deepEqual(resolveMainRelease(input), { ready: true, successor: null });
});
test('superseded main hands off without authorizing stale deployment', () => {
  assert.deepEqual(resolveMainRelease({ ...input, latest }), { ready: false, successor: latest });
});
test('manual dispatch can omit requested SHA', () => {
  assert.equal(resolveMainRelease({ ...input, requested: '' }).ready, true);
});
test('a delayed request hands off even when the workflow already sees newer main', () => {
  assert.deepEqual(resolveMainRelease({ ...input, requested: latest }), { ready: false, successor: current });
});
test('non-main and malformed requests remain blocked', () => {
  for (const patch of [
    { ref: 'refs/heads/fix' },
    { current: 'unknown' },
    { latest: '' },
    { requested: 'invalid' },
  ]) {
    assert.throws(() => resolveMainRelease({ ...input, ...patch }));
  }
});
