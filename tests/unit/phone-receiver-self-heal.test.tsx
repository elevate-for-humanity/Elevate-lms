import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ProgramHolderPhoneReceiver } from '@/components/program-holder/ProgramHolderPhoneReceiver';
const mock = vi.hoisted(() => ({ create: vi.fn(), handlers: {} as Record<string, (...args: any[]) => void> }));
vi.mock('next/navigation', () => ({ usePathname: () => '/host-shop/dashboard/apprentices' }));
vi.mock('@/components/communications/DashboardVideoCalls', () => ({ DashboardVideoCalls: () => null }));
vi.mock('@/lib/phone/browser-client', () => ({ createPhoneClient: mock.create }));

let heartbeatReply: () => Response;
let heartbeatCount: number;
let disconnectPatches: number;

beforeEach(() => {
  mock.handlers = {}; mock.create.mockReset();
  heartbeatCount = 0; disconnectPatches = 0;
  heartbeatReply = () => Response.json({});
  localStorage.setItem('elevate-program-holder-phone-device', '12345678901234567890123456789012');
  mock.create.mockResolvedValue({ on: (event: string, callback: any) => { mock.handlers[event] = callback; }, connect: async () => mock.handlers.ready(), disconnect: vi.fn().mockResolvedValue(undefined) });
  vi.stubGlobal('fetch', vi.fn(async (_url: string, options?: RequestInit) => {
    if (options?.method === 'POST') return Response.json({ provider: 'asterisk' });
    if (options?.method === 'PATCH') {
      const body = JSON.parse(String(options.body));
      if (body.action === 'disconnect') { disconnectPatches += 1; return Response.json({}); }
      heartbeatCount += 1;
      return heartbeatReply();
    }
    return Response.json({ readOnly: false, extension: { ringMode: 'ring' } });
  }));
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); delete (document as any).visibilityState; });

function showPage() {
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
}

it('re-provisions about a second after a heartbeat reports the lease is gone', async () => {
  vi.useFakeTimers();
  heartbeatReply = () => Response.json({ code: 'device_not_provisioned', error: 'The SIP registration is not currently reachable.' }, { status: 409 });
  render(<ProgramHolderPhoneReceiver phoneHref="/host-shop/dashboard/phone" />);
  await vi.waitFor(() => expect(mock.create).toHaveBeenCalledTimes(1));
  await vi.waitFor(() => expect(heartbeatCount).toBe(1));
  heartbeatReply = () => Response.json({});
  await act(async () => { await vi.advanceTimersByTimeAsync(400); });
  expect(mock.create).toHaveBeenCalledTimes(1);
  await act(async () => { await vi.advanceTimersByTimeAsync(2_100); });
  // recover() ran: it cleared the dead device's presence and started over,
  // including a fresh token request (a full re-provision).
  expect(disconnectPatches).toBeGreaterThanOrEqual(1);
  await vi.waitFor(() => expect(mock.create).toHaveBeenCalledTimes(2));
});

it('backs off across repeated heartbeat failures instead of spinning recoveries', async () => {
  vi.useFakeTimers();
  heartbeatReply = () => Response.json({ error: 'Asterisk registration could not be verified.' }, { status: 503 });
  render(<ProgramHolderPhoneReceiver phoneHref="/host-shop/dashboard/phone" />);
  await vi.waitFor(() => expect(mock.create).toHaveBeenCalledTimes(1));
  // First failure heals after ~5s, the next after ~15s, then every ~30s:
  // over 100 seconds of continuous failure the receiver recovers only a
  // handful of times rather than looping every heartbeat.
  await act(async () => { await vi.advanceTimersByTimeAsync(100_000); });
  expect(mock.create.mock.calls.length).toBeLessThanOrEqual(6);
  expect(mock.create.mock.calls.length).toBeGreaterThanOrEqual(4);
});

it('reconnects immediately when the page becomes visible after the registration lapsed', async () => {
  render(<ProgramHolderPhoneReceiver phoneHref="/host-shop/dashboard/phone" />);
  expect(await screen.findByRole('link', { name: 'Work phone online' })).toBeTruthy();
  await act(async () => { mock.handlers.offline(); });
  expect(screen.queryByText('Work phone online')).toBeNull();
  // Without the lifecycle heal this would wait for the 30s timer.
  await act(async () => { showPage(); });
  await vi.waitFor(() => expect(mock.create).toHaveBeenCalledTimes(2));
  expect(await screen.findByRole('link', { name: 'Work phone online' })).toBeTruthy();
});

it('reconnects on the window online event after a drop', async () => {
  render(<ProgramHolderPhoneReceiver phoneHref="/host-shop/dashboard/phone" />);
  expect(await screen.findByRole('link', { name: 'Work phone online' })).toBeTruthy();
  await act(async () => { mock.handlers.offline(); });
  await act(async () => { window.dispatchEvent(new Event('online')); });
  await vi.waitFor(() => expect(mock.create).toHaveBeenCalledTimes(2));
});

it('only re-verifies with a heartbeat when the page becomes visible while registered', async () => {
  render(<ProgramHolderPhoneReceiver phoneHref="/host-shop/dashboard/phone" />);
  expect(await screen.findByRole('link', { name: 'Work phone online' })).toBeTruthy();
  const before = heartbeatCount;
  await act(async () => { showPage(); });
  await vi.waitFor(() => expect(heartbeatCount).toBe(before + 1));
  expect(mock.create).toHaveBeenCalledTimes(1);
});
