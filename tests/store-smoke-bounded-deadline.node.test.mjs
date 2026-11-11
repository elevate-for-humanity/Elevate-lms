import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const smokeSource = readFileSync(new URL('../scripts/gcp/smoke-marketing-container.mjs', import.meta.url), 'utf8');
const helperUrl = new URL('../scripts/gcp/smoke-fetch.mjs', import.meta.url).href;

// A pending request whose only deadline is AbortSignal.timeout() is unbounded in
// practice: that timer is unref'ed, so when it is the last outstanding work Node
// drains the loop and exits 13 with "Detected unsettled top-level await" before
// the deadline fires. Release 42979357394 failed this way at
// smoke-marketing-container.mjs:40, so the shipped smoke must not rely on it.
function runChild(code) {
  return spawnSync(process.execPath, ['--input-type=module', '-e', code], { encoding: 'utf8', timeout: 15000 });
}

test('Store smoke never bounds a request with the unref\'ed AbortSignal.timeout deadline', () => {
  assert.doesNotMatch(smokeSource, /AbortSignal\.timeout/, 'smoke must not arm an unref\'ed deadline');
  assert.doesNotMatch(smokeSource, /\bawait\s+fetch\(/, 'smoke requests must go through the bounded helper');
  assert.match(smokeSource, /fetchSmoke\(root \+ '\/api\/ping'/);
  assert.match(smokeSource, /fetchSmoke\(root \+ path/);
});

test('the unref\'ed AbortSignal.timeout timer cannot enforce a request deadline', () => {
  // The only deadline is unref'ed, so this pending request never settles and the
  // process cannot report the intended timeout.
  const unrefd = runChild("AbortSignal.timeout(300); await new Promise(() => {});");
  assert.notEqual(unrefd.status, 0, 'an unref\'ed deadline must not look like a bounded request');
  assert.match(unrefd.stderr, /unsettled top-level await/);
});

test('bounded smoke helper rejects a request that never settles and exits cleanly', () => {
  const code = [
    `import { fetchSmoke } from ${JSON.stringify(helperUrl)};`,
    "try { await fetchSmoke('http://127.0.0.1:9/api/ping', {}, 300, 'json', () => new Promise(() => {})); process.exitCode = 7; }",
    "catch (error) { if (!/timed out after 300 ms/.test(error.message)) process.exitCode = 8; }",
  ].join(' ');
  const run = runChild(code);
  assert.equal(run.status, 0, `bounded helper must settle the await: ${run.stderr}`);
});

test('bounded smoke helper bounds a real request to a peer that never responds', async () => {
  const { createServer } = await import('node:net');
  const { fetchSmoke } = await import(helperUrl);
  // Accept the connection and never answer, as a container whose server has
  // bound the port but is still initializing.
  const peer = createServer(() => {});
  await new Promise(resolve => peer.listen(0, '127.0.0.1', resolve));
  const port = peer.address().port;
  const started = Date.now();
  try {
    await assert.rejects(
      fetchSmoke(`http://127.0.0.1:${port}/api/ping`, { redirect: 'manual' }, 500),
      /timed out after 500 ms/,
    );
    assert.ok(Date.now() - started < 10000, 'the referenced deadline must bound the wait');
  } finally {
    peer.close();
  }
});

test('bounded smoke helper preserves status, body and request host', async () => {
  let seenHost;
  const response = async (_url, options) => {
    seenHost = options.headers.host;
    return { status: 503, json: async () => ({ ready: false }) };
  };
  assert.deepEqual(
    await (await import(helperUrl)).fetchSmoke('http://localhost/api/health', { headers: { host: 'customer.example' } }, 1000, 'json', response),
    { status: 503, body: { ready: false } },
  );
  assert.equal(seenHost, 'customer.example');
});

test('bounded smoke helper rejects an out-of-range deadline and an unknown response type', async () => {
  const { fetchSmoke } = await import(helperUrl);
  await assert.rejects(fetchSmoke('http://localhost/', {}, 0), /1\.\.120000/);
  await assert.rejects(fetchSmoke('http://localhost/', {}, 1000, 'blob'), /Unsupported smoke response type/);
});
