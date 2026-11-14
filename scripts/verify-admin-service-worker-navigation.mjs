import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const listeners = new Map();
const cached = new Map();
const downloads = [];
let offline = false;
const origin = 'https://admin.elevateforhumanity.org';
vm.runInNewContext(readFileSync(new URL('../public/sw-admin.js', import.meta.url), 'utf8'), {
  self: { location: { origin }, addEventListener: (type, listener) => listeners.set(type, listener) },
  URL, Headers, Response, console,
  caches: { open: async () => ({
    match: async (path) => cached.get(path)?.clone(),
    put: async (path, response) => cached.set(path, response),
  }) },
  fetch: async (path, options) => {
    if (offline) throw Error('offline');
    assert.equal(options.credentials, 'omit');
    assert.equal(options.redirect, 'error');
    downloads.push(path);
    const body = readFileSync(new URL('../apps/admin/public' + path, import.meta.url), 'utf8');
    const type = path.endsWith('.html') ? 'text/html' : path.endsWith('.js') ? 'text/javascript' : 'text/css';
    return new Response(body, { headers: { 'Content-Type': type } });
  },
});
const handle = listeners.get('fetch');
assert.equal(typeof handle, 'function', 'Admin worker must register a fetch handler');
let checked = 0;
for (const path of ['/studio', '/studio/courses', '/paris', '/install', '/dashboard', '/login', '/auth/callback?code=test', '/api/ping', '/_next/static/test.js']) {
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
let preparation;
let result;
listeners.get('message')({
  data: { type: 'PREPARE_WORKSPACE' },
  ports: [{ postMessage: (message) => { result = message.ready; } }],
  waitUntil: (promise) => { preparation = promise; },
});
await preparation;
assert.equal(result, true);
assert.equal(downloads.length, 4);
offline = true;
for (const slug of ['dev-studio', 'course-builder']) {
  let pending;
  handle({
    request: { url: origin + '/install/' + slug + '.html', method: 'GET', mode: 'navigate' },
    respondWith: (promise) => { pending = promise; },
  });
  const response = await pending;
  assert.equal(response.status, 200);
  assert.ok((await response.text()).includes('href="/manifest-' + slug + '.json"'));
  checked++;
}
assert.equal(downloads.length, 4);
console.log(`Admin service-worker behavior verified: ${checked} navigation/authentication cases.`);
