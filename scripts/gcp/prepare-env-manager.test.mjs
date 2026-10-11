import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareEnvManager } from './prepare-env-manager.mjs';

function harness(options = {}) {
  const calls = [];
  function run(args) {
    calls.push(args);
    if (args[0] === 'auth') return options.loggedOut ? '' : 'synthetic-account';
    if (args[0] === 'run' && args[1] === 'services' && args[2] === 'describe') return JSON.stringify({ spec: { template: { spec: { serviceAccountName: options.wrongIdentity ? 'wrong-identity' : 'elevate-admin-runtime@elegant-racer-299721.iam.gserviceaccount.com' } } } });
    if (args[0] === 'iam' && args[1] === 'roles' && args[2] === 'list') return JSON.stringify(options.roleMismatch ? [{ name: 'existing' }] : []);
    if (args[0] === 'iam' && args[1] === 'roles' && args[2] === 'describe') return JSON.stringify({ includedPermissions: ['secretmanager.versions.access'] });
    if (args[0] === 'secrets' && args[1] === 'list') {
      if (options.inventoryDenied) { const error = new Error('Google operation failed'); error.code = 'permission_denied'; throw error; }
      if (options.wrongSecret) return JSON.stringify([{ name: args[args.indexOf('--filter') + 1].replace('name:/', 'projects/example/secrets/'), labels: { elevate_component: 'marketing' } }]);
      return '[]';
    }
    return '';
  }
  return { calls, run };
}
test('prepares per-service resources without credential transfer, runtime deployment or project-wide access', () => {
  const h = harness();
  const result = prepareEnvManager('admin', h.run);
  assert.ok(result.preparedSecrets > 0);
  assert.equal(result.payloadsTransferred, 0);
  assert.equal(result.runtimeChanged, false);
  assert.equal(result.projectWideSecretAccess, false);
  assert.equal(h.calls.some(args => args.includes('versions') || args.includes('deploy') || args[0] === 'projects'), false);
  const customRole = h.calls.find(args => args.includes('elevateRuntimeSecretWriterV1') && args[2] === 'create');
  assert.equal(customRole[customRole.indexOf('--permissions') + 1].includes('secretmanager.versions.access'), false);
  const accessors = h.calls.filter(args => args.includes('roles/secretmanager.secretAccessor'));
  assert.equal(accessors.length, result.preparedSecrets);
  assert.ok(accessors.every(args => args[0] === 'secrets' && args.includes('serviceAccount:elevate-admin-runtime@elegant-racer-299721.iam.gserviceaccount.com')));
  assert.equal(h.calls.some(args => args.some(arg => /STRIPE_|NORTHFLANK_|OPENAI_API_KEY/.test(arg))), false);
});
test('requires an active administrator login before mutation', () => {
  const h = harness({ loggedOut: true });
  assert.throws(() => prepareEnvManager('admin', h.run), /gcloud auth login/);
  assert.equal(h.calls.length, 1);
});
test('does not substitute a shared runtime identity or create a replacement runtime', () => {
  const h = harness({ wrongIdentity: true });
  assert.throws(() => prepareEnvManager('admin', h.run), /dedicated runtime identity/);
  assert.equal(h.calls.some(args => args.includes('create') || args.includes('add-iam-policy-binding') || args.includes('enable')), false);
});
test('refuses an existing role with broader secret-payload privileges', () => {
  const h = harness({ roleMismatch: true });
  assert.throws(() => prepareEnvManager('admin', h.run), /confined permission/);
  assert.equal(h.calls.some(args => args.includes('add-iam-policy-binding')), false);
});
test('does not treat denied secret inventory as an empty destination', () => {
  const h = harness({ inventoryDenied: true });
  assert.throws(() => prepareEnvManager('admin', h.run), /Google operation failed/);
  assert.equal(h.calls.some(args => args[0] === 'secrets' && args[1] === 'create'), false);
});
test('refuses a secret whose ownership belongs to another component', () => {
  const h = harness({ wrongSecret: true });
  assert.throws(() => prepareEnvManager('admin', h.run), /different ownership/);
  assert.equal(h.calls.some(args => args.includes('add-iam-policy-binding')), false);
});
