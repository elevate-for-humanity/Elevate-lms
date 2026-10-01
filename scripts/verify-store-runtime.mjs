#!/usr/bin/env node

const baseUrl = String(process.argv[2] || '').replace(/\/$/, '');
const expectedSha = String(process.argv[3] || '').trim();

if (!/^https:\/\//.test(baseUrl)) {
  console.error('Usage: node scripts/verify-store-runtime.mjs https://store-runtime.example <40-char-sha>');
  process.exit(2);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(path, init) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: 'follow',
    signal: AbortSignal.timeout(30_000),
    ...init,
  });
  return response;
}

async function json(path, init) {
  const response = await request(path, init);
  const body = await response.json().catch(() => null);
  return { response, body };
}

try {
  const version = await json('/version.json', { headers: { 'cache-control': 'no-cache' } });
  assert(version.response.ok, `version.json returned ${version.response.status}`);
  if (expectedSha) {
    assert(version.body?.commit === expectedSha, `Store SHA ${version.body?.commit || 'missing'} != ${expectedSha}`);
  }

  for (const path of ['/store', '/store/proof', '/store/apps/website-builder']) {
    const response = await request(path, { headers: { 'cache-control': 'no-cache' } });
    const body = await response.text();
    assert(response.ok, `${path} returned ${response.status}`);
    assert(body.length > 1_000, `${path} returned an unexpectedly small page`);
  }

  const build = await json('/api/store/website-builder/paris', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      mode: 'builder',
      message: 'Build a modern dental website called Runtime Proof Dental in Indianapolis with booking.',
      current: {},
    }),
  });
  assert(build.response.ok, `public Website Builder demo returned ${build.response.status}`);
  assert(build.body?.actions?.generated === true, 'public Website Builder demo did not generate a site state');
  assert(
    typeof build.body?.actions?.heroHeadline === 'string' && build.body.actions.heroHeadline.length > 5,
    'public Website Builder demo did not generate visible website content',
  );

  const publish = await json('/api/store/website-builder/paris', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      mode: 'builder',
      message: 'Publish it',
      current: build.body.actions,
    }),
  });
  assert(publish.response.ok, `public Website Builder publish demo returned ${publish.response.status}`);
  assert(publish.body?.actions?.published === true, 'public Website Builder demo did not accept publish intent');

  const protectedCreate = await json('/api/apps/website-builder/sites', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ siteName: 'Unauthorized runtime probe' }),
  });
  assert(protectedCreate.response.status === 401, 'production Website Builder creation is not protected by authentication');
  assert(protectedCreate.body?.error === 'Authentication required', 'production Website Builder returned the wrong anonymous-access contract');

  console.log('[store-runtime] PASS');
  console.log(`Store ${version.body?.commit || 'unknown'} serves the proof index and Website Builder product.`);
  console.log('Public Builder generated visible site content and accepted publish intent; production site creation rejected anonymous access.');
} catch (error) {
  console.error(`[store-runtime] FAILED: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
