import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// jsdom has no WebAudio: stand in a context that behaves like a mobile
// browser's — it starts suspended and resume() only takes effect once a
// user gesture has "unlocked" it (allowResume).
class FakeGain {
  gain = { setValueAtTime: () => {}, linearRampToValueAtTime: () => {} };
  connect() { return this; }
  disconnect() {}
}
class FakeOscillator {
  type = '';
  frequency = { value: 0 };
  onended: (() => void) | null = null;
  connect() { return { connect: () => {} }; }
  start = vi.fn();
  stop = vi.fn();
  disconnect = vi.fn();
}
class FakeAudioContext {
  static instances: FakeAudioContext[] = [];
  state: 'suspended' | 'running' = 'suspended';
  currentTime = 0;
  destination = {};
  allowResume = false;
  oscillators: FakeOscillator[] = [];
  resume = vi.fn(async () => { if (this.allowResume) this.state = 'running'; });
  createOscillator() { const osc = new FakeOscillator(); this.oscillators.push(osc); return osc; }
  createGain() { return new FakeGain(); }
  constructor() { FakeAudioContext.instances.push(this); }
}
const flush = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };
beforeEach(() => {
  vi.useFakeTimers();
  vi.resetModules();
  FakeAudioContext.instances = [];
  vi.stubGlobal('AudioContext', FakeAudioContext);
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
describe('phone ringtone audio unlock retry', () => {
  it('keeps retrying resume on the ring cadence and sounds once a gesture unlocks audio', async () => {
    const { startRingtone, stopRingtone } = await import('@/lib/notifications/audio-unlock');
    startRingtone();
    await flush();
    const ctx = FakeAudioContext.instances[0];
    expect(ctx).toBeTruthy();
    expect(ctx.oscillators.length).toBe(0);
    expect(ctx.resume.mock.calls.length).toBeGreaterThanOrEqual(1);
    await vi.advanceTimersByTimeAsync(1500);
    await flush();
    expect(ctx.oscillators.length).toBe(0);
    expect(ctx.resume.mock.calls.length).toBeGreaterThanOrEqual(2);
    // The first user gesture lands mid-ring: the next retry must sound.
    ctx.allowResume = true;
    await vi.advanceTimersByTimeAsync(1500);
    await flush();
    expect(ctx.oscillators.length).toBeGreaterThanOrEqual(1);
    stopRingtone();
  });
  it('stays silent and leaves no timers when stopped before audio unlocks', async () => {
    const { startRingtone, stopRingtone } = await import('@/lib/notifications/audio-unlock');
    startRingtone();
    stopRingtone();
    await flush();
    await vi.advanceTimersByTimeAsync(10_000);
    await flush();
    const ctx = FakeAudioContext.instances[0];
    expect(ctx.oscillators.length).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('installs one-time gesture listeners that prime the shared context', async () => {
    const { installAudioUnlock, unlockAudio } = await import('@/lib/notifications/audio-unlock');
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const remove = installAudioUnlock();
    const events = addSpy.mock.calls.map(([name]) => name);
    expect(events).toEqual(expect.arrayContaining(['pointerdown', 'keydown', 'touchstart']));
    await unlockAudio();
    const ctx = FakeAudioContext.instances[0];
    expect(ctx).toBeTruthy();
    ctx.allowResume = true;
    window.dispatchEvent(new Event('pointerdown'));
    await flush();
    expect(ctx.state).toBe('running');
    expect(await unlockAudio()).toBe(true);
    remove();
    expect(removeSpy).toHaveBeenCalled();
  });
});
