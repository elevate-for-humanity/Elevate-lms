import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const workflow = () =>
  readFileSync(new URL('../../.github/workflows/deploy-admin.yml', import.meta.url), 'utf8');
test('Admin Docker build precedes Google identity and billing admission', () => {
  const s = workflow(),
    build = s.indexOf('      - name: Build the Admin image');
  assert.ok(build >= 0);
  assert.ok(
    build < s.indexOf('uses: google-github-actions/auth@'),
    'Google identity must not gate the independent Docker build',
  );
  assert.ok(
    build < s.indexOf('      - name: Verify project billing'),
    'Google billing must not gate the independent Docker build',
  );
});
test('Google upload retains authenticated SDK and billing checks', () => {
  const s = workflow(),
    auth = s.indexOf('uses: google-github-actions/auth@'),
    sdk = s.indexOf('      - name: Verify Google SDK'),
    billing = s.indexOf('      - name: Verify project billing'),
    upload = s.indexOf('      - name: Upload tested Admin image');
  assert.ok(auth >= 0 && auth < sdk && sdk < billing && billing < upload);
});

for (const [file, buildLabel, uploadLabel] of [
  [
    'build-google-migration-images.yml',
    'Build existing Dockerfile without server secrets',
    'Upload versioned image',
  ],
  [
    'deploy-google-store-runtime.yml',
    'Build shared commerce application for Store',
    'Upload tested Store image',
  ],
])
  test(file + ' builds before Google authentication and keeps billing before upload', () => {
    const s = readFileSync(new URL('../../.github/workflows/' + file, import.meta.url), 'utf8');
    const build = s.indexOf('      - name: ' + buildLabel),
      auth = s.indexOf('uses: google-github-actions/auth@');
    const billing = s.indexOf('run: node scripts/gcp/preflight-billing.mjs'),
      upload = s.indexOf('      - name: ' + uploadLabel);
    assert.ok(build >= 0 && build < auth, 'Google identity must not gate image building');
    assert.ok(auth < billing && billing < upload, 'Google upload must retain billing admission');
  });

test('ordinary Admin releases retain the current browser workspace binding until a verified cutover', () => {
  const s = workflow();
  assert.ok(!s.includes('STUDIO_BROWSER_ENV='));
  const update = s.slice(
    s.indexOf('gcloud run services update elevate-admin-migration'),
    s.indexOf('      - name: Health-check and activate'),
  );
  assert.ok(update.includes('--update-env-vars=AI_NARRATION_PROVIDER=kokoro'));
  assert.ok(s.includes('node scripts/gcp/github-runtime-binding.mjs'));
  assert.ok(!s.includes('paris-engineer-github-private-key'));
  assert.ok(!s.includes('PARIS_GITHUB_APP_SECRET'));
  assert.ok(update.includes('"${GITHUB_RUNTIME_FLAGS[@]}"'));
  assert.ok(!update.includes('STUDIO_BROWSER_URL='));
  assert.ok(!update.includes('STUDIO_BROWSER_PUBLIC_URL='));
});

test('Admin compilation does not hold the shared production runtime lock', () => {
  const s = workflow();
  const build = s.slice(s.indexOf('  build-admin:'), s.indexOf('  deploy-admin:'));
  const deploy = s.slice(s.indexOf('  deploy-admin:'), s.indexOf('  acceptance:'));
  assert.ok(build.includes('docker build -f Dockerfile.admin'));
  assert.ok(!build.includes('google-runtime-us-central1'));
  assert.ok(!build.includes('gcloud run services update'));
  assert.ok(deploy.includes('needs: build-admin'));
  assert.ok(deploy.includes('group: google-runtime-us-central1'));
  assert.ok(deploy.includes('queue: max'));
  assert.ok(deploy.includes('test "$DIGEST" = "$IMAGE_DIGEST"'));
  assert.ok(deploy.includes('preflight-web-rollout.mjs'));
  assert.ok(deploy.includes('activate-tested-public-revision.mjs'));
  assert.ok(deploy.includes('verify-admin-revision.mjs'));
});

test('new requests queue behind active Admin image builds without cancelling their upload', () => {
  const s = workflow();
  const build = s.slice(s.indexOf('  build-admin:'), s.indexOf('  deploy-admin:'));
  const policy = build.slice(build.indexOf('    concurrency:'), build.indexOf('    name:'));
  assert.match(policy, /group: google-admin-build-main/);
  assert.match(policy, /cancel-in-progress: false/);
  assert.match(policy, /queue: max/);
  assert.ok(build.includes('Reject superseded deployment requests before building'));
  assert.ok(build.includes('Upload tested Admin image'));
});

for (const [component, filename, buildLabel] of [
  ['store', 'deploy-google-store-runtime.yml', 'Build shared commerce application for Store'],
  ['marketing', 'deploy-google-marketing-trigger.yml', 'Build Marketing image'],
])
  test(
    component +
      ' compilation releases the shared runtime slot and hands off only its tested digest',
    () => {
      const s = readFileSync(
        new URL('../../.github/workflows/' + filename, import.meta.url),
        'utf8',
      );
      const build = s.slice(s.indexOf('  build-' + component + ':'), s.indexOf('  deploy:'));
      const deploy = s.slice(s.indexOf('  deploy:'), s.indexOf('  acceptance:'));
      assert.ok(build.includes('group: google-' + component + '-build-main'));
      assert.ok(build.includes('cancel-in-progress: false') && build.includes('queue: max'));
      assert.ok(!build.includes('google-runtime-us-central1'));
      assert.ok(build.includes('      - name: ' + buildLabel));
      assert.ok(build.includes('smoke-marketing-container.mjs'));
      assert.ok(build.includes('digest: ${{ steps.upload.outputs.digest }}'));
      assert.ok(!build.includes('gcloud run services update'));
      assert.ok(!deploy.includes('docker build'));
      assert.ok(deploy.includes('group: google-runtime-us-central1'));
      assert.ok(deploy.includes('needs.build-' + component + '.outputs.digest'));
      assert.ok(deploy.includes('test "$DIGEST" = "$IMAGE_DIGEST"'));
      assert.ok(deploy.includes('preflight-web-rollout.mjs'));
      assert.ok(deploy.includes('activate-tested-public-revision.mjs'));
      assert.ok(s.includes('needs: deploy'));
      if (component === 'marketing') {
        assert.ok(!build.includes('ensure-tax-encryption.mjs'));
        assert.ok(deploy.includes('ensure-tax-encryption.mjs'));
      }
    },
  );
