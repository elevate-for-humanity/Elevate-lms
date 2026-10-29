import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source = readFileSync(new URL('../../.github/workflows/deploy-google-store-runtime.yml', import.meta.url), 'utf8');
test('Store collects the exact attempted revision after startup, activation, or live verification failure', () => {
  const diagnostics = source.indexOf('      - name: Collect exact failed Store revision logs');
  assert.ok(diagnostics > source.indexOf('      - name: Verify Store identity, dependencies, storefront and traffic'));
  const block = source.slice(diagnostics, source.indexOf('      - uses: actions/upload-artifact', diagnostics));
  assert.match(block, /failure\(\) && steps\.deploy\.outputs\.revision != ''/);
  assert.doesNotMatch(block, /steps\.deploy\.outcome == 'failure'/);
  assert.match(block, /FAILED_SERVICE: elevate-store-migration/);
  assert.match(block, /FAILED_REVISION: \$\{\{ steps\.deploy\.outputs\.revision \}\}/);
});
test('exact Store diagnostic artifacts survive activation failures', () => {
  const artifact = source.slice(source.lastIndexOf('      - uses:', source.indexOf('name: store-revision-')));
  assert.match(artifact, /failure\(\) && steps\.deploy\.outputs\.revision != ''/);
  assert.doesNotMatch(artifact.slice(0, 140), /steps\.deploy\.outcome == 'failure'/);
});
