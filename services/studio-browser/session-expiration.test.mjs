import test from 'node:test';
import assert from 'node:assert/strict';
import { browserSessionExpired } from './session-expiration.mjs';
import { retireBrowserSession } from './session-retirement.mjs';

const now = 10_000_000;
const options = { now, ttlMs: 60 * 60_000 };
const fixture = (overrides = {}) => ({
  disposableQa: true, lastSeen: now - 60_001, streams: new Set(),
  downloads: new Map(), activeActions: 0, ...overrides,
});

test('cancelled QA releases disconnected idle capacity without shortening real users', () => {
  assert.equal(browserSessionExpired(fixture(), options), true);
  for (const disposableQa of [false, undefined, 'true']) {
    assert.equal(browserSessionExpired(fixture({ disposableQa }), options), false);
    assert.equal(browserSessionExpired(fixture({ disposableQa, lastSeen: now - options.ttlMs - 1 }), options), true);
  }
  assert.equal(browserSessionExpired(fixture({ lastSeen: now - 60_000 }), options), false);
});

test('connected, restoring, queued-input and transferring QA is never reclaimed', () => {
  for (const overrides of [
    { streams: new Set([{}]) }, { restoring: true }, { activeActions: 1 },
    ...['downloading', 'normalizing', 'uploading'].map(status => ({
      downloads: new Map([['media', { status, createdAt: new Date(now - 120_000).toISOString() }]]),
    })),
  ]) assert.equal(browserSessionExpired(fixture(overrides), options), false);
});

test('a reconnect during the awaited checkpoint prevents context retirement', async () => {
  const session = fixture(); let closed = false;
  await retireBrowserSession(session, {
    saveState: async () => { session.streams.add({}); },
    canRetire: () => browserSessionExpired(session, options),
    retire: async () => { closed = true; },
  });
  assert.equal(closed, false);
});

test('idle fixture cleanup preserves the browser on checkpoint failure', async () => {
  let closed = false;
  await assert.rejects(retireBrowserSession(fixture(), {
    saveState: async () => { throw new Error('unavailable'); },
    canRetire: () => true,
    retire: async () => { closed = true; },
  }), /SESSION_CHECKPOINT_FAILED/);
  assert.equal(closed, false);
});
