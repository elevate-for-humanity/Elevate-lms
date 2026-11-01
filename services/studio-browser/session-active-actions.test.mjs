import test from 'node:test';
import assert from 'node:assert/strict';
import { runActions } from './server.mjs';
import { browserSessionExpired } from './session-expiration.mjs';

test('long queued actions protect disconnected QA until the last action finishes', async () => {
  let release, started;
  const beginning = new Promise(resolve => { started = resolve; });
  const session = {
    disposableQa: true, lastSeen: Date.now() - 120_000,
    streams: new Set(), downloads: new Map(),
    page: { keyboard: { insertText: async () => {
      started(); await new Promise(resolve => { release = resolve; });
    } } },
  };
  const action = runActions(session, { type: 'type', text: 'fixture' });
  await beginning;
  assert.equal(browserSessionExpired(session, { ttlMs: 3_600_000 }), false);
  release(); await action;
  assert.equal(session.activeActions, 0);
  assert.equal(browserSessionExpired(session, { ttlMs: 3_600_000 }), false);
});

test('failed actions release their activity reservation', async () => {
  const session = { page: { keyboard: { insertText: async () => { throw Error('fixture failure'); } } } };
  await assert.rejects(runActions(session, { type: 'type', text: 'fixture' }), /fixture failure/);
  assert.equal(session.activeActions, 0);
});
