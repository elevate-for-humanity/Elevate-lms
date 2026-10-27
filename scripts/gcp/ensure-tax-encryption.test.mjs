import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ensureTaxEncryption } from './ensure-tax-encryption.mjs';
const policy = JSON.parse(
  readFileSync(new URL('../../config/google-runtime-policy.json', import.meta.url)),
);
function harness({
  existingKey,
  boundKey,
  boundName = 'TAX_DATA_ENCRYPTION_KEY',
  secretExists = false,
  denied = false,
  publicAccess = false,
} = {}) {
  const calls = [];
  const key = 'ab'.repeat(32);
  const run = (args, input) => {
    calls.push({ args, input });
    if (args[0] === 'run')
      return JSON.stringify({
        spec: {
          template: {
            spec: {
              serviceAccountName: policy.components.marketing.identity,
              containers: [{ env: boundKey ? [{ name: boundName, value: boundKey }] : [] }],
            },
          },
        },
      });
    if (args.includes('elevate-marketing-runtime-config'))
      return JSON.stringify({
        version: 1,
        component: 'marketing',
        runtimeEnvironment: existingKey ? { TAX_DATA_ENCRYPTION_KEY: existingKey } : {},
        volumes: [],
        runtimeFiles: {},
      });
    if (args[1] === 'describe' && !secretExists) {
      const e = new Error('safe');
      e.code = denied ? 'permission_denied' : 'not_found';
      throw e;
    }
    if (args[1] === 'get-iam-policy')
      return JSON.stringify({ bindings: publicAccess ? [{ members: ['allUsers'] }] : [] });
    if (args[1] === 'versions' && args[2] === 'list') return 'projects/test/secrets/key/versions/1';
    if (args[1] === 'versions' && args[2] === 'access') return key;
    return '{}';
  };
  return { run, calls, key };
}
test('preserves an existing bundled encryption key without rotating it', () => {
  const h = harness({ existingKey: 'ab'.repeat(32) });
  assert.deepEqual(ensureTaxEncryption({ run: h.run }), {
    configured: true,
    created: false,
    binding: '',
  });
  assert.equal(
    h.calls.some((c) => c.args[1] === 'create'),
    false,
  );
});
test('preserves a direct runtime key without reading unrelated configuration', () => {
  const h = harness({ boundKey: 'ab'.repeat(32) });
  ensureTaxEncryption({ run: h.run });
  assert.equal(h.calls.length, 1);
});
test('creates a missing key privately and grants only the expected runtime account access', () => {
  const h = harness();
  const result = ensureTaxEncryption({ run: h.run, generateKey: () => h.key });
  assert.equal(result.created, true);
  assert.equal(
    result.binding,
    'TAX_DATA_ENCRYPTION_KEY=elevate-marketing-tax-data-encryption-key:1',
  );
  assert.equal(JSON.stringify(result).includes(h.key), false);
  assert.equal(h.calls.find((c) => c.args[1] === 'create').input, h.key);
  assert.ok(
    h.calls
      .find((c) => c.args[1] === 'add-iam-policy-binding')
      .args.includes('--member=serviceAccount:' + policy.components.marketing.identity),
  );
});
test('does not treat permission denial as permission to replace a key', () => {
  const h = harness({ denied: true });
  assert.throws(() => ensureTaxEncryption({ run: h.run }), /safe/);
  assert.equal(
    h.calls.some((c) => c.args[1] === 'create'),
    false,
  );
});
test('refuses a key with public access instead of binding it to taxpayer storage', () => {
  const h = harness({ secretExists: true, publicAccess: true });
  assert.throws(() => ensureTaxEncryption({ run: h.run }), /public access/);
  assert.equal(
    h.calls.some((c) => c.args[1] === 'add-iam-policy-binding'),
    false,
  );
});

test('preserves a direct legacy SSN key used by existing taxpayer records', () => {
  const h = harness({ boundKey: 'ab'.repeat(32), boundName: 'SSN_ENCRYPTION_KEY' });
  assert.deepEqual(ensureTaxEncryption({ run: h.run }), {
    configured: true,
    created: false,
    binding: '',
  });
  assert.equal(h.calls.length, 1);
});
