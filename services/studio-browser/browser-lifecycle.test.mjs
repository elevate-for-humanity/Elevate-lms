import assert from 'node:assert/strict';
import test from 'node:test';
import { createBrowserLifecycleManager } from './server.mjs';

function fakeBrowser() {
  let connected = true;
  return {
    isConnected: () => connected,
    on: () => undefined,
    close: async () => {
      connected = false;
    },
    newContext: async () => ({
      newPage: async () => ({ close: async () => undefined }),
      close: async () => undefined,
    }),
  };
}

test('heartbeat recovers a container after transient Chromium pre-warm failure', async () => {
  let launches = 0;
  const manager = createBrowserLifecycleManager({
    launch: async () => {
      launches += 1;
      if (launches === 1) throw new Error('transient launch failure');
      return fakeBrowser();
    },
  });

  await assert.rejects(manager.getBrowser(), /browser_unavailable/);
  assert.equal(manager.health().browserState, 'failed');
  assert.equal(await manager.heartbeat(), true);
  assert.equal(manager.health().browserState, 'ready');
  assert.equal(manager.health().browserConnected, true);
  assert.equal(launches, 2);
  await manager.shutdown();
});
