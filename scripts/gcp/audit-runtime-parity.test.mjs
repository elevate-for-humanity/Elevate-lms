import test from 'node:test';
import assert from 'node:assert/strict';
import { compareEnvironments, runtimeContainer, healthPassed, targets } from './audit-runtime-parity.mjs';

test('reports missing, changed and unresolved inherited credentials without disclosing values', () => {
  const report = compareEnvironments({ GOOD: 'same', MISSING: 'private-one', CHANGED: 'private-two', REF: 'private-three', TEMPLATE: '${secret}' },
    [{ name: 'GOOD', value: 'same' }, { name: 'CHANGED', value: 'replacement-secret' }, { name: 'REF', valueFrom: { secretKeyRef: { name: 'credential', key: '1' } } }], 'service');
  assert.equal(report.passed, false);
  assert.deepEqual(report.missing, ['MISSING']);
  assert.deepEqual(report.different, ['CHANGED']);
  assert.deepEqual(report.secretReferences, ['REF']);
  assert.deepEqual(report.unresolved, ['TEMPLATE']);
  assert.equal(/private-|\$\{secret\}|replacement-secret/.test(JSON.stringify(report)), false);
});
test('preserves exact multiline values and permits only declared Google adaptations', () => {
  const report = compareEnvironments({ PORT: '3000', HOSTNAME: 'localhost', MULTILINE: 'a\nb,c', AI_NARRATION_PROVIDER: 'cloudflare', ULTIMATE_WORKER_ID: 'old' },
    [{ name: 'HOSTNAME', value: '0.0.0.0' }, { name: 'MULTILINE', value: 'a\nb,c' }, { name: 'AI_NARRATION_PROVIDER', value: 'kokoro' }], 'job');
  assert.equal(report.passed, true);
  assert.equal(report.matched, 1);
  assert.equal(compareEnvironments({ TOKEN: 'old' }, [{ name: 'TOKEN', value: 'new' }], 'job').passed, false);
});
test('does not assume a healthy page means dependencies and executor are ready', () => {
  assert.equal(healthPassed('admin', '/api/ready', 200, { service: 'admin', ready: true }), false);
  assert.equal(healthPassed('lms', '/api/health', 200, { service: 'lms', ready: true, healthy: true }), false);
  assert.equal(healthPassed('lms', '/api/health', 503, { service: 'lms', ready: true, healthy: true, dependencies: { supabase: { ok: true } } }), false);
  assert.equal(healthPassed('lms', '/api/health', 200, { service: 'lms', ready: true, healthy: true, dependencies: { supabase: { ok: true } } }), true);
});
test('all six source services have explicit mappings; malformed runtime cannot pass', () => {
  assert.equal(Object.keys(targets).length, 6);
  assert.throws(() => runtimeContainer({ spec: { template: { spec: { containers: [{}, {}] } } } }, 'service'), /topology/);
  assert.throws(() => compareEnvironments(null, [], 'service'), /unavailable/);
});
