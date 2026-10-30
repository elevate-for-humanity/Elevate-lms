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
test('Google uploads require billing and identity while independent builds stay outside Google admission', () => {
  for (const [file, build, uploadName, independent = false] of [
    ['build-google-migration-images.yml', 'Build existing Dockerfile', 'Upload versioned image', true],
    ['deploy-google-marketing-trigger.yml', 'Install dependencies and validate', 'Push Marketing image'],
    ['deploy-google-course-worker.yml', 'Build existing CPU Course Builder image', 'Upload immutable worker image'],
    ['deploy-admin.yml', 'Build the Admin image', 'Upload tested Admin image', true],
    ['deploy-google-store-runtime.yml', 'Build shared commerce application for Store', 'Upload tested Store image', true],
  ]) {
    const source = readFileSync(new URL('../../.github/workflows/' + file, import.meta.url), 'utf8');
    const guard = source.indexOf('node scripts/gcp/preflight-billing.mjs');
    assert.ok(guard > 0 && guard < source.indexOf(uploadName), file);
    assert.ok(independent ? source.indexOf(build) < guard : guard < source.indexOf(build), file);
    assert.ok(source.indexOf('google-github-actions/auth@v3') < guard, file);
    const refresh = source.indexOf('Refresh Google credentials after build');
    assert.ok(refresh > source.indexOf(build) && refresh < source.indexOf(uploadName), file);
  }
  assert.match(readFileSync(new URL('../../.dockerignore', import.meta.url), 'utf8'), /^\*\*\/gha-creds-\*\.json$/m);
  const imageWorkflow=readFileSync(new URL('../../.github/workflows/build-google-migration-images.yml', import.meta.url), 'utf8');
  const imageConcurrency=imageWorkflow.slice(imageWorkflow.indexOf('concurrency:'),imageWorkflow.indexOf('jobs:'));
  assert.match(imageConcurrency, /group: google-image-/);
  assert.match(imageConcurrency, /cancel-in-progress: false/, 'new source must not cancel a built image during authenticated upload');
});
test('retired provider deletion jobs cannot run when changes reach main', () => {
  for (const file of ['purge-all-gpu-resources.yml', 'delete-stuck-gpu-volume.yml', 'delete-legacy-gpu-build-service.yml']) {
    const source = readFileSync(new URL('../../.github/workflows/' + file, import.meta.url), 'utf8');
    assert.match(source, /jobs:\n  [\w-]+:\n    #[^\n]+\n    if: \$\{\{ false \}\}/, file);
  }
  const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
  assert.equal(pkg.scripts['deploy:studio-browser'], 'node scripts/gcp/deploy-studio-browser.mjs');
});
