import test from 'node:test';
import assert from 'node:assert/strict';
import { auditPage, isPrivateAddress, runActions, snapshotPage } from './server.mjs';

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
