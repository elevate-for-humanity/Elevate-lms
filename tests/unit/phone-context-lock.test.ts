import { afterEach, describe, expect, it, vi } from 'vitest';
import { claimPhoneContext } from '@/lib/phone/context-lock';

// A minimal Web Locks stand-in: one exclusive grant per name, released when
// the holder's callback settles, with a FIFO queue for waiters — the same
// semantics the phone clients rely on.
class FakeLocks {
  private held = new Set<string>();
  private waiters = new Map<string, Array<() => void>>();

  async request(
    name: string,
    optionsOrCallback: unknown,
    maybeCallback?: (lock: unknown) => Promise<unknown>,
  ) {
    const options =
      typeof optionsOrCallback === 'function' ? undefined : (optionsOrCallback as { ifAvailable?: boolean });
    const callback = (typeof optionsOrCallback === 'function'
      ? optionsOrCallback
      : maybeCallback) as (lock: unknown) => Promise<unknown>;
    if (this.held.has(name)) {
      if (options?.ifAvailable) return callback(null);
      await new Promise<void>((resolve) => {
        const queue = this.waiters.get(name) || [];
        queue.push(resolve);
        this.waiters.set(name, queue);
      });
    }
    this.held.add(name);
    try {
      return await callback({ name, mode: 'exclusive' });
    } finally {
      this.held.delete(name);
      const queue = this.waiters.get(name) || [];
      const next = queue.shift();
      if (next) next();
    }
  }
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('phone context leadership', () => {
  it('fails open as leader when Web Locks is unavailable', async () => {
    vi.stubGlobal('navigator', {});
    await expect(claimPhoneContext('device-1').acquired).resolves.toBe(true);
  });

  it('lets the first context lead and makes a second context defer', async () => {
    vi.stubGlobal('navigator', { locks: new FakeLocks() });
    const first = claimPhoneContext('device-2');
    const second = claimPhoneContext('device-2');
    await expect(first.acquired).resolves.toBe(true);
    await expect(second.acquired).resolves.toBe(false);
  });

  it('keeps different device identities independent', async () => {
    vi.stubGlobal('navigator', { locks: new FakeLocks() });
    const dialPad = claimPhoneContext('device-3');
    const receiver = claimPhoneContext('device-3_receiver');
    await expect(dialPad.acquired).resolves.toBe(true);
    await expect(receiver.acquired).resolves.toBe(true);
  });

  it('hands leadership to a waiting context when the leader releases', async () => {
    vi.stubGlobal('navigator', { locks: new FakeLocks() });
    const first = claimPhoneContext('device-4');
    const second = claimPhoneContext('device-4');
    const takeover = vi.fn();
    second.onTakeover(takeover);
    await expect(second.acquired).resolves.toBe(false);
    expect(takeover).not.toHaveBeenCalled();
    expect(first.isLeader()).toBe(true);
    expect(second.isLeader()).toBe(false);
    first.release();
    expect(first.isLeader()).toBe(false);
    await flush();
    expect(takeover).toHaveBeenCalledTimes(1);
    // Leadership is observable live, not only through the one-time
    // acquired promise: after a takeover the successor leads.
    expect(second.isLeader()).toBe(true);
    // The lock is not stuck afterwards: once the successor also releases,
    // a fresh context can lead immediately.
    second.release();
    await flush();
    await expect(claimPhoneContext('device-4').acquired).resolves.toBe(true);
  });
});
