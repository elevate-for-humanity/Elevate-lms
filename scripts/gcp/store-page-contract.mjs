import assert from 'node:assert/strict';

// Shared by the packaged-image smoke test and real server-rendered chrome tests.
export function assertStorePageChrome(html, path) {
  assert.match(html, /data-header-owner="store-root"/, `${path} must use Store chrome`);
  assert.ok(
    html.includes('href="https://store.elevateforhumanity.org/login?redirect=%2Fstore"'),
    `${path} must keep sign-in on Store`,
  );
  assert.match(html, /aria-label="Store policies"/, `${path} must expose Store policies`);
}
