import test from 'node:test';
import assert from 'node:assert/strict';
import { CdpPage } from './cdp-browser.mjs';

function pageWith(send) {
  const page = new CdpPage({ options: {}, browser: { connection: { send } } },
    { targetId: 'target', url: 'about:blank' }, 'session');
  page.mainFrameId = 'main';
  page.frameMap.set('main', { loaderId: 'old' });
  return page;
}

test('commit admission returns a real new document without waiting for its blocked scripts', async () => {
  const page = pageWith(async () => {
    page.frameMap.set('main', { loaderId: 'new' });
    return { loaderId: 'new' };
  });
  page.waitForLoader = () => { throw Error('DOMContentLoaded is still blocked'); };
  await page.goto('https://provider.example/login', { waitUntil: 'commit' });
  assert.equal(page.frameMap.get('main').loaderId, 'new');
});

test('commit admission cannot accept the previous page or a failed navigation', async () => {
  const page = pageWith(async () => ({ loaderId: 'new' }));
  await assert.rejects(page.goto('https://provider.example/login', {
    waitUntil: 'commit', timeout: 10,
  }), { name: 'TimeoutError' });
  const failed = pageWith(async () => ({ errorText: 'net::ERR_CERT_AUTHORITY_INVALID' }));
  await assert.rejects(failed.goto('https://provider.example/login', {
    waitUntil: 'commit',
  }), /ERR_CERT_AUTHORITY_INVALID/);
});

test('default navigation still waits for the new document DOM', async () => {
  let waited;
  const page = pageWith(async () => ({ loaderId: 'new' }));
  page.waitForLoader = async loader => { waited = loader; };
  await page.goto('https://provider.example/login');
  assert.equal(waited, 'new');
});

test('the navigation command and document wait share one deadline', async t => {
  let now = 1000;
  t.mock.method(Date, 'now', () => now);
  const page = pageWith(async (_method, _params, _session, timeout) => {
    assert.equal(timeout, 100);
    now += 80;
    return { loaderId: 'new' };
  });
  page.waitForLoader = async (_loader, timeout) => { assert.equal(timeout, 20); };
  await page.goto('https://provider.example/login', { timeout: 100 });
});

test('same-document commits do not wait for a nonexistent new loader', async () => {
  const page = pageWith(async () => ({}));
  page.waitForLoadState = () => { throw Error('No new document'); };
  await page.goto('https://provider.example/login#form', { waitUntil: 'commit' });
});
