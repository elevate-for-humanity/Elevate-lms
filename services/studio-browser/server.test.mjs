import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import {
  auditPage,
  attachBrowserTabs,
  receiveBrowserUpload,
  isPrivateAddress,
  runActions,
  sessionRequiresAuthentication,
  snapshotPage,
} from './server.mjs';

test('blocks private IPv4 networks', () => {
  for (const address of ['127.0.0.1', '10.0.0.4', '172.16.1.2', '192.168.1.2', '169.254.1.1']) {
    assert.equal(isPrivateAddress(address), true, address);
  }
});

test('batches browser actions in order with one request', async () => {
  const calls = [];
  const session = {
    lastSeen: 0,
    page: {
      mouse: { click: async (x, y) => calls.push(['click', x, y]) },
      keyboard: { insertText: async (value) => calls.push(['type', value]) },
    },
  };
  const result = await runActions(session, {
    actions: [
      { type: 'click', x: 10, y: 20 },
      { type: 'type', text: 'fast' },
    ],
  });
  assert.equal(result.count, 2);
  assert.deepEqual(calls, [
    ['click', 10, 20],
    ['type', 'fast'],
  ]);
});

test('executes validated DOM-reference actions without arbitrary selectors', async () => {
  const calls = [];
  const locator = {
    first: () => locator,
    click: async () => calls.push(['click']),
    fill: async (value) => calls.push(['fill', value]),
    selectOption: async (value) => calls.push(['select', value]),
    press: async (key) => calls.push(['press', key]),
  };
  const session = {
    lastSeen: 0,
    page: {
      locator: (selector) => (calls.push(['locator', selector]), locator),
      keyboard: { press: async (key) => calls.push(['keyboard', key]) },
    },
  };
  await runActions(session, {
    actions: [
      { type: 'fill_ref', ref: 'e2', text: 'Elevate' },
      { type: 'press_ref', ref: 'e2', key: 'Enter' },
    ],
  });
  assert.deepEqual(calls, [
    ['locator', '[data-studio-ref="e2"]'],
    ['fill', 'Elevate'],
    ['locator', '[data-studio-ref="e2"]'],
    ['press', 'Enter'],
  ]);
  await assert.rejects(
    () => runActions(session, { type: 'click_ref', ref: 'body > *' }),
    /Invalid browser control reference/,
  );
});

test('returns a deterministic authentication signal when an Envato action fails after token refresh 401', async () => {
  const now = Date.now();
  const session = {
    lastSeen: 0,
    target: 'https://app.envato.com/workspaces/course-media',
    events: [
      {
        type: 'response',
        status: 401,
        url: 'https://account.envato.com/api/public/refresh_id_token',
        at: new Date(now - 500).toISOString(),
      },
    ],
    page: {
      url: () => 'https://app.envato.com/workspaces/course-media',
      keyboard: {
        insertText: async () => {
          throw new Error('page action aborted');
        },
      },
    },
  };

  assert.equal(sessionRequiresAuthentication(session, now), true);
  await assert.rejects(
    () => runActions(session, { type: 'type', text: 'search' }),
    (error) => error?.code === 'authentication_required' && error?.status === 409,
  );
});

test('does not reuse stale Envato 401 events after authentication succeeds', () => {
  const now = Date.now();
  assert.equal(
    sessionRequiresAuthentication(
      {
        target: 'https://app.envato.com/search',
        events: [
          {
            type: 'response',
            status: 401,
            url: 'https://account.envato.com/api/public/refresh_id_token',
            at: new Date(now - 30_000).toISOString(),
          },
        ],
        page: { url: () => 'https://app.envato.com/search' },
      },
      now,
    ),
    false,
  );
});

test('pauses signed-out Envato snapshots before planning or DOM evaluation', async () => {
  const session = {
    target: 'https://app.envato.com/',
    events: [{ type: 'response', status: 401, at: new Date().toISOString(), url: 'https://account.envato.com/api/public/refresh_id_token' }],
    page: {
      url: () => 'https://app.envato.com/',
      evaluate: () => { throw new Error('must not evaluate an unauthenticated page'); },
    },
  };
  await assert.rejects(() => snapshotPage(session), error => error.code === 'authentication_required' && error.status === 409);
});

test('returns the compact actionable page snapshot', async () => {
  const expected = {
    title: 'Elevate',
    url: 'https://www.elevateforhumanity.org/',
    visibleText: 'Career training',
    headings: [],
    controls: [],
  };
  const session = {
    lastSeen: 0,
    page: { waitForLoadState: async () => undefined, evaluate: async () => expected },
  };
  assert.deepEqual(await snapshotPage(session), expected);
});

test('allows public IPv4 networks', () => {
  assert.equal(isPrivateAddress('1.1.1.1'), false);
  assert.equal(isPrivateAddress('8.8.8.8'), false);
});

test('blocks loopback and private IPv6 networks', () => {
  assert.equal(isPrivateAddress('::1'), true);
  assert.equal(isPrivateAddress('fd00::1'), true);
  assert.equal(isPrivateAddress('fe80::1'), true);
});

test('returns measured browser events with document audit evidence', async () => {
  const expectedDocumentAudit = {
    title: 'Elevate',
    url: 'https://www.elevateforhumanity.org/',
    viewport: { width: 390, height: 844 },
    document: { width: 390, height: 2200 },
    horizontalOverflow: false,
    counts: { headings: 5, links: 12, controls: 14, images: 3, forms: 1 },
    accessibilityHeuristics: {
      missingAlt: [],
      unlabeledControls: [],
      emptyLinks: [],
      headingSkips: [],
    },
  };
  const session = {
    lastSeen: 0,
    events: [
      { type: 'console', level: 'log', text: 'loaded' },
      { type: 'console', level: 'error', text: 'boom' },
      { type: 'requestfailed', url: 'https://www.elevateforhumanity.org/missing.js' },
    ],
    page: {
      waitForLoadState: async () => undefined,
      evaluate: async () => expectedDocumentAudit,
    },
  };
  const result = await auditPage(session);
  assert.equal(result.horizontalOverflow, false);
  assert.equal(result.browserEvents.length, 2);
  assert.equal(result.browserEvents[0].level, 'error');
  assert.match(result.evidenceCapturedAt, /^\d{4}-\d{2}-\d{2}T/);
});


test('OAuth popup becomes the visible tab, checkpoints, and returns to opener on close', async () => {
  const listeners = new Map();
  const page = (url) => ({ url: () => url, on: (event, handler) => listeners.set(url + event, handler), isClosed: () => false, bringToFront: async () => {} });
  const opener = page('https://account.envato.com');
  const popup = page('https://accounts.google.com');
  let onPage;
  let saves = 0;
  const session = { page: opener, context: { on: (event, handler) => { assert.equal(event, 'page'); onPage = handler; } }, events: [] };
  const attached = [];
  attachBrowserTabs(session, p => attached.push(p), async () => { saves++; });
  const openerId = session.activeTabId;
  onPage(popup);
  assert.equal(session.page, popup);
  assert.equal(session.pages.size, 2);
  listeners.get('https://accounts.google.comdomcontentloaded')();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(saves, 1);
  await runActions(session, { type: 'switch_tab', tabId: openerId });
  assert.equal(session.page, opener);
  await assert.rejects(() => runActions(session, { type: 'switch_tab', tabId: 'another-owner-tab' }), error => error.code === 'tab_not_found');
  await runActions(session, { type: 'switch_tab', tabId: [...session.pages.keys()][1] });
  listeners.get('https://accounts.google.comclose')();
  assert.equal(session.page, opener);
  assert.equal(session.activeTabId, openerId);
  assert.deepEqual(attached, [opener, popup]);
});

test('back and forward actions use the active page history', async () => {
  const calls = [];
  await runActions({ page: { goBack: async () => calls.push('back'), goForward: async () => calls.push('forward') } }, { actions: [{ type: 'back' }, { type: 'forward' }] });
  assert.deepEqual(calls, ['back', 'forward']);
});


test('file picker uploads preserve bytes, stay in the session, and reject oversized files', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'studio-upload-test-'));
  const selected = [];
  const session = { downloadDir: directory, fileChooser: { isMultiple: () => true, setFiles: async files => selected.push(...files) } };
  const request = bytes => Object.assign(Readable.from([Buffer.from(bytes)]), { headers: { 'x-studio-file-name': '..%2Fexample.txt' } });
  try {
    const file = await receiveBrowserUpload(session, request('lesson source'));
    assert.equal(await fs.readFile(session.uploads.get(file.id), 'utf8'), 'lesson source');
    assert.equal(path.dirname(path.dirname(session.uploads.get(file.id))), directory);
    assert.equal(path.basename(session.uploads.get(file.id)), '..-example.txt');
    await assert.rejects(() => receiveBrowserUpload(session, request('too large'), 2), error => error.code === 'upload_too_large');
    assert.equal((await fs.readdir(directory)).length, 1);
    await assert.rejects(() => runActions(session, { type: 'choose_files', fileIds: ['other-session'] }), error => error.code === 'invalid_upload_selection');
    await runActions(session, { type: 'choose_files', fileIds: [file.id] });
    assert.deepEqual(selected, [session.uploads.get(file.id)]);
    assert.equal(session.fileChooser, undefined);
  } finally { await fs.rm(directory, { recursive: true, force: true }); }
});

test('dialogs require an explicit response and never affect another tab', async () => {
  const responses = [];
  const active = {};
  const session = { page: active, dialogPage: active, dialog: { accept: async text => responses.push(text), dismiss: async () => responses.push('dismiss') } };
  assert.deepEqual(responses, []);
  session.dialogPage = {};
  await assert.rejects(() => runActions(session, { type: 'dialog', accept: true }), error => error.code === 'dialog_not_found');
  session.dialogPage = active;
  await runActions(session, { type: 'dialog', accept: true, text: 'test response' });
  assert.deepEqual(responses, ['test response']);
  assert.equal(session.dialog, undefined);
});


test('iframe references resolve to their owning frame and cannot be reused after tab switch', async () => {
  const clicks = [];
  const snapshot = (title, offset) => ({title, url: 'https://www.elevateforhumanity.org', visibleText: title, headings: [], controls: [{ref: `e${offset + 1}`, role: 'button', name: title}]});
  const main = { evaluate: async (_, offset) => snapshot('Main', offset), locator: () => ({ first: () => ({click: async () => clicks.push('main')}) }) };
  const child = { evaluate: async (_, offset) => snapshot('Embedded form', offset), locator: () => ({ first: () => ({click: async () => clicks.push('frame'), press: async key => clicks.push(`frame:${key}`)}) }) };
  const page = { waitForLoadState: async () => {}, frames: () => [main, child], url: () => 'https://www.elevateforhumanity.org' };
  const session = {page};
  const result = await snapshotPage(session);
  assert.deepEqual(result.controls.map(control => control.ref), ['e1', 'e2']);
  await runActions(session, {type: 'click_ref', ref: 'e2'});
  await runActions(session, {type: 'press_ref', ref: 'e2', key: 'Enter'});
  assert.deepEqual(clicks, ['frame', 'frame:Enter']);
  session.page = {};
  await assert.rejects(() => runActions(session, {type: 'click_ref', ref: 'e2'}), error => error.code === 'stale_control');
});

test('dialog/file selection pauses planning before evaluating a blocked document', async () => {
  const page = {evaluate: async () => { throw new Error('must not evaluate'); }};
  await assert.rejects(() => snapshotPage({page, dialog: {}, dialogPage: page}), error => error.code === 'interaction_required');
  await assert.rejects(() => snapshotPage({page, fileChooser: {}, fileChooserPage: page}), error => error.code === 'interaction_required');
});


test('manual double click forwards exactly two pointer pairs without delayed focus', async () => {
  const calls = [];
  const mouse = {move: async () => {}, down: async options => calls.push(['down', options.clickCount]), up: async options => calls.push(['up', options.clickCount])};
  await runActions({page: {mouse}}, {actions: [{type: 'pointer_click', x: 10, y: 20, clickCount: 1}, {type: 'pointer_click', x: 10, y: 20, clickCount: 2}]});
  assert.deepEqual(calls, [['down', 1], ['up', 1], ['down', 2], ['up', 2]]);
});
