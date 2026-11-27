vi.mock('@/components/communications/DashboardVideoCalls', () => ({ DashboardVideoCalls: () => null }));
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { claimPhoneContext } from '@/lib/phone/context-lock';
const mock = vi.hoisted(() => ({ create: vi.fn(), unlock: vi.fn().mockResolvedValue(true), handlers: {} as Record<string, (value?: any) => void> }));
vi.mock('@/lib/phone/browser-client', () => ({ createPhoneClient: mock.create, phoneDestination: (value: string) => value }));
vi.mock('@/lib/notifications/push-client', () => ({ getPushNotificationClient: vi.fn() }));
vi.mock('@/lib/notifications/audio-unlock', () => ({ installAudioUnlock: () => () => {}, onRingtoneStatusChange: () => () => {}, startRingtone: vi.fn(), stopRingtone: vi.fn(), unlockAudio: mock.unlock }));
vi.mock('@/components/program-holder/ProgramHolderPhoneIntroduction', () => ({ ProgramHolderPhoneIntroduction: () => null }));
import { ProgramHolderPhone } from '@/components/program-holder/ProgramHolderPhone';
const data = { readOnly: false, phoneNumber: '', system: { name: 'Isolated fixture', timezone: 'UTC', status: 'active' },
  notifications: { emailMissedCalls: false, smsMissedCalls: false, smsPhone: '' },
  extension: { id: 'extension', extension: '101', displayName: 'Test fixture', department: null, ringMode: 'ring',
    availabilitySource: 'manual', schedule: {}, ringSeconds: 20, voicemailGreeting: '', externalFallbackEnabled: false,
    externalFallbackNumber: '', presenceStatus: 'offline', provider: 'asterisk' }, inbox: [] };

// Same Web Locks semantics the context-lock unit tests pin, small enough to
// duplicate here: one exclusive grant per name, FIFO takeover queue.
class FakeLocks {
  private held = new Set<string>();
  private waiters = new Map<string, Array<() => void>>();
  async request(name: string, optionsOrCallback: unknown, maybeCallback?: (lock: unknown) => Promise<unknown>) {
    const options = typeof optionsOrCallback === 'function' ? undefined : (optionsOrCallback as { ifAvailable?: boolean });
    const callback = (typeof optionsOrCallback === 'function' ? optionsOrCallback : maybeCallback) as (lock: unknown) => Promise<unknown>;
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

let heartbeatReply: () => Response;
let tokenAttempts: number;
let failLaterTokens: boolean;
let heartbeatCount: number;
let deferLaterHeartbeats: boolean;
let lateHeartbeat: ((response: Response) => void) | null;

beforeEach(() => {
  mock.handlers = {}; mock.unlock.mockClear(); mock.create.mockReset();
  tokenAttempts = 0; failLaterTokens = false; heartbeatCount = 0; deferLaterHeartbeats = false; lateHeartbeat = null;
  heartbeatReply = () => Response.json({});
  mock.create.mockResolvedValue({ on: (event: string, callback: any) => { mock.handlers[event] = callback; },
    newCall: vi.fn().mockResolvedValue({ id: 'outbound-call' }),
    connect: async () => { mock.handlers.ready(); }, disconnect: vi.fn().mockResolvedValue(undefined) });
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) => {
    if (!init?.method) return Response.json(data);
    if (init.method === 'POST') {
      tokenAttempts += 1;
      return failLaterTokens && tokenAttempts > 1
        ? Response.json({ code: 'PHONE_CONTROL_AUTH_FAILED', error: 'The dashboard could not authenticate with the phone provisioning service.' }, { status: 502 })
        : Response.json({ provider: 'asterisk' });
    }
    const body = JSON.parse(String(init.body));
    if (body.action === 'heartbeat') {
      heartbeatCount += 1;
      if (deferLaterHeartbeats && heartbeatCount > 1) {
        return new Promise<Response>((resolve) => { lateHeartbeat = resolve; });
      }
      return heartbeatReply();
    }
    return Response.json({});
  }));
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); delete (document as any).visibilityState; });

async function connected() {
  render(<ProgramHolderPhone />);
  await vi.waitFor(() => expect(screen.getByRole('button', { name: 'Disconnect' })).toBeTruthy());
}

describe('dial pad heartbeat self-heal', () => {
  it('re-provisions about a second after the server reports the device lease is gone', async () => {
    vi.useFakeTimers();
    heartbeatReply = () => Response.json({ code: 'device_not_provisioned', error: 'The SIP registration is not currently reachable.' }, { status: 409 });
    render(<ProgramHolderPhone />);
    await vi.waitFor(() => expect(mock.create).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(tokenAttempts).toBe(1));
    // The first heartbeat (fired on registration) reports the lease gone;
    // the heal must not wait for the 30-second SIP reconnect cadence.
    heartbeatReply = () => Response.json({});
    await act(async () => { await vi.advanceTimersByTimeAsync(400); });
    expect(mock.create).toHaveBeenCalledTimes(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(2_100); });
    expect(mock.create).toHaveBeenCalledTimes(2);
    expect(tokenAttempts).toBe(2);
    await vi.waitFor(() => expect(screen.getByRole('button', { name: 'Disconnect' })).toBeTruthy());
  });

  it('backs off after a plain heartbeat failure instead of using the SIP cadence', async () => {
    vi.useFakeTimers();
    heartbeatReply = () => Response.json({ error: 'Asterisk registration could not be verified.' }, { status: 503 });
    render(<ProgramHolderPhone />);
    await vi.waitFor(() => expect(mock.create).toHaveBeenCalledTimes(1));
    heartbeatReply = () => Response.json({});
    await act(async () => { await vi.advanceTimersByTimeAsync(2_500); });
    expect(mock.create).toHaveBeenCalledTimes(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(5_500); });
    expect(mock.create).toHaveBeenCalledTimes(2);
  });

  it('does not loop reconnects when the recovery attempt itself fails', async () => {
    vi.useFakeTimers();
    heartbeatReply = () => Response.json({ error: 'Asterisk registration could not be verified.' }, { status: 503 });
    failLaterTokens = true;
    render(<ProgramHolderPhone />);
    await vi.waitFor(() => expect(tokenAttempts).toBe(1));
    await act(async () => { await vi.advanceTimersByTimeAsync(8_000); });
    expect(tokenAttempts).toBe(2);
    await vi.waitFor(() => expect(screen.getByText('The dashboard could not authenticate with the phone provisioning service.')).toBeTruthy());
    // Minutes pass: no heartbeat remains to fail, and nothing retries on
    // its own — the failure surfaces to the user instead of spinning.
    await act(async () => { await vi.advanceTimersByTimeAsync(180_000); });
    expect(tokenAttempts).toBe(2);
    expect(mock.create).toHaveBeenCalledTimes(1);
  });

  it('does not heal a heartbeat failure that lands after a deliberate disconnect', async () => {
    deferLaterHeartbeats = true;
    await connected();
    // A second registration report starts another heartbeat, which stays in
    // flight while the user deliberately disconnects.
    await act(async () => { mock.handlers.ready(); });
    await vi.waitFor(() => expect(lateHeartbeat).toBeTypeOf('function'));
    fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }));
    await screen.findByText('Phone disconnected.');
    await act(async () => {
      lateHeartbeat!(Response.json({ code: 'device_not_provisioned', error: 'The SIP registration is not currently reachable.' }, { status: 409 }));
    });
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)); });
    expect(mock.create).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Connect phone' })).toBeTruthy();
  });
});

describe('dial pad single-context leadership', () => {
  it('defers to an earlier live context and connects when that context goes away', async () => {
    const device = 'abcdef0123456789abcdef0123456789';
    window.localStorage.setItem('elevate-program-holder-phone-device', device);
    Object.defineProperty(window.navigator, 'locks', { value: new FakeLocks(), configurable: true });
    try {
      const leader = claimPhoneContext(device);
      await expect(leader.acquired).resolves.toBe(true);
      render(<ProgramHolderPhone />);
      // Auto-connect defers: no token request, no client, and the user is
      // told the phone is open elsewhere instead of silently flapping.
      await screen.findByText(/already open in another tab or app window/);
      expect(mock.create).not.toHaveBeenCalled();
      expect(tokenAttempts).toBe(0);
      leader.release();
      await vi.waitFor(() => expect(mock.create).toHaveBeenCalledTimes(1));
      await vi.waitFor(() => expect(screen.getByRole('button', { name: 'Disconnect' })).toBeTruthy());
    } finally {
      delete (window.navigator as any).locks;
      window.localStorage.removeItem('elevate-program-holder-phone-device');
    }
  });
});
