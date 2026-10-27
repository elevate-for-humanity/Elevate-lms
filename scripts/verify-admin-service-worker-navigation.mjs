import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const listeners = new Map();
const origin = 'https://admin.elevateforhumanity.org';
vm.runInNewContext(readFileSync(new URL('../public/sw-admin.js', import.meta.url), 'utf8'), {
  self: { location: { origin }, addEventListener: (type, listener) => listeners.set(type, listener) },
  URL, Headers, console,
  fetch: () => Promise.resolve({ ok: true, status: 200 }),
});
const handle = listeners.get('fetch');
assert.equal(typeof handle, 'function', 'Admin worker must register a fetch handler');
let checked = 0;
for (const path of ['/studio', '/dashboard', '/login', '/auth/callback?code=test', '/api/ping', '/_next/static/test.js']) {
  for (const method of ['GET', 'POST']) {
    let intercepted = false;
    handle({
      request: { url: origin + path, method, mode: 'navigate' },
      respondWith: () => { intercepted = true; },
    });
    assert.equal(intercepted, false, `Browser must own navigation: ${method} ${path}`);
    checked++;
  }
}
for (const path of ['/api/admin/dev-studio/chat', '/login', '/_next/data/build/studio.json?_rsc=1']) {
  let intercepted = false;
  handle({
    request: { url: origin + path, method: 'GET', mode: 'cors', headers: new Headers() },
    respondWith: () => { intercepted = true; },
  });
  assert.equal(intercepted, false, `Worker must bypass authenticated requests: ${path}`);
  checked++;
}
console.log(`Admin service-worker behavior verified: ${checked} navigation/authentication cases.`);
