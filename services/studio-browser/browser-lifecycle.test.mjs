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

test('disconnect invalidates once, failed restart stays observable and heartbeat recovers', async () => {
  const { EventEmitter } = await import('node:events');
  const first = Object.assign(new EventEmitter(), fakeBrowser());
  first.on = EventEmitter.prototype.on;
  let launches = 0, invalidations = 0;
  const manager = createBrowserLifecycleManager({
    launch: async () => {
      launches++;
      if (launches === 1) return first;
      if (launches === 2) throw new Error('restart unavailable');
      return fakeBrowser();
    },
    onUnavailable: async () => { invalidations++; },
  });
  await manager.getBrowser();
  first.emit('disconnected');
  for (let i=0; i<100 && manager.health().recycling; i++) await new Promise(resolve => setTimeout(resolve, 1));
  assert.equal(invalidations, 1);
  assert.equal(manager.health().browserState, 'failed');
  assert.equal(manager.health().browserConnected, false);
  assert.equal(await manager.heartbeat(), true);
  assert.equal(launches, 3);
  await manager.shutdown();
});

test('invalidation failure closes browser and remains recoverable', async () => {
  const first = fakeBrowser();
  const manager = createBrowserLifecycleManager({
    launch: async () => first.isConnected() ? first : fakeBrowser(),
    onUnavailable: async () => { throw new Error('invalidation failed'); },
  });
  await manager.getBrowser();
  await assert.rejects(manager.recycleBrowser(), /invalidation failed/);
  assert.equal(first.isConnected(), false);
  assert.equal(manager.health().browserState, 'failed');
  assert.equal(await manager.heartbeat(), true);
  await manager.shutdown();
});

test('shutdown during launch closes candidate and cannot restore ready state', async () => {
  const candidate = fakeBrowser();
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const manager = createBrowserLifecycleManager({ launch: async () => { await gate; return candidate; } });
  const pending = assert.rejects(manager.getBrowser(), /browser_unavailable/);
  const shutting = manager.shutdown();
  release();
  await Promise.all([pending, shutting]);
  assert.equal(candidate.isConnected(), false);
  assert.equal(manager.health().browserState, 'shutting_down');
  assert.equal(await manager.heartbeat(), false);
});
