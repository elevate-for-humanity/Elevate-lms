import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { verifyBilling } from './preflight-billing.mjs';
const project = 'elegant-racer-299721';
test('active billing passes without revealing the billing account', () => {
  const result = verifyBilling(project, (cmd, args, opts) => {
    assert.equal(cmd, 'gcloud');
    assert.deepEqual(args, ['billing', 'projects', 'describe', project, '--format=json']);
    assert.equal(opts.timeout, 30000);
    return JSON.stringify({ projectId: project, billingEnabled: true, billingAccountName: 'billingAccounts/private' });
  });
  assert.deepEqual(result, { project, billingEnabled: true });
});
test('disabled, unlinked, malformed, or wrong-project billing blocks the build', () => {
  for (const info of [
    { projectId: project, billingEnabled: false, billingAccountName: 'billingAccounts/private' },
    { projectId: project, billingEnabled: true },
    { projectId: 'another-project', billingEnabled: true, billingAccountName: 'billingAccounts/private' }, {},
  ]) assert.throws(() => verifyBilling(project, () => JSON.stringify(info)), /not confirmed active/);
  assert.throws(() => verifyBilling(project, () => 'invalid'), /Cannot verify/);
});
test('CLI failures are redacted and invalid project IDs never run commands', () => {
  assert.throws(() => verifyBilling(project, () => { throw new Error('secret credential'); }), /Cannot verify/);
  assert.throws(() => verifyBilling('$(unsafe)', () => assert.fail('must not execute')), /valid Google project/);
});
test('paid build paths check billing before Docker and refresh credentials before upload', () => {
  for (const [file, build, uploadName] of [
    ['build-google-migration-images.yml', 'Build existing Dockerfile', 'Upload versioned image'],
    ['deploy-google-marketing-trigger.yml', 'Install dependencies and validate', 'Push Marketing image'],
    ['deploy-google-course-worker.yml', 'Build existing CPU Course Builder image', 'Upload immutable worker image'],
  ]) {
    const source = readFileSync(new URL('../../.github/workflows/' + file, import.meta.url), 'utf8');
    const guard = source.indexOf('node scripts/gcp/preflight-billing.mjs');
    assert.ok(guard > 0 && guard < source.indexOf(build), file);
    assert.ok(source.indexOf('google-github-actions/auth@v3') < guard, file);
    const refresh = source.indexOf('Refresh Google credentials after build');
    assert.ok(refresh > source.indexOf(build) && refresh < source.indexOf(uploadName), file);
  }
  assert.match(readFileSync(new URL('../../.dockerignore', import.meta.url), 'utf8'), /^\*\*\/gha-creds-\*\.json$/m);
  assert.match(readFileSync(new URL('../../.github/workflows/build-google-migration-images.yml', import.meta.url), 'utf8'), /cancel-in-progress: true/);
});
test('retired provider deletion jobs cannot run when changes reach main', () => {
  for (const file of ['purge-all-gpu-resources.yml', 'delete-stuck-gpu-volume.yml', 'delete-legacy-gpu-build-service.yml']) {
    const source = readFileSync(new URL('../../.github/workflows/' + file, import.meta.url), 'utf8');
    assert.match(source, /jobs:\n  [\w-]+:\n    #[^\n]+\n    if: \$\{\{ false \}\}/, file);
  }
  const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
  assert.equal(pkg.scripts['deploy:studio-browser'], 'node scripts/gcp/deploy-studio-browser.mjs');
});
