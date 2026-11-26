import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ProgramHolderPhoneReceiver } from '@/components/program-holder/ProgramHolderPhoneReceiver';
const mock = vi.hoisted(() => ({ path: '/host-shop/dashboard/apprentices', create: vi.fn(), install: vi.fn(), handlers: {} as Record<string, (...args: any[]) => void> }));
vi.mock('next/navigation', () => ({ usePathname: () => mock.path }));
vi.mock('@/components/communications/DashboardVideoCalls', () => ({ DashboardVideoCalls: () => null }));
vi.mock('@/lib/phone/browser-client', () => ({ createPhoneClient: mock.create }));
vi.mock('@/lib/notifications/audio-unlock', () => ({ installAudioUnlock: mock.install }));
let cleanupUnlock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  mock.path = '/host-shop/dashboard/apprentices'; mock.handlers = {};
  cleanupUnlock = vi.fn();
  mock.install.mockReset(); mock.install.mockReturnValue(cleanupUnlock);
  mock.create.mockReset();
  mock.create.mockResolvedValue({ on: (event: string, callback: any) => { mock.handlers[event] = callback; }, connect: async () => mock.handlers.ready(), disconnect: vi.fn().mockResolvedValue(undefined) });
  localStorage.setItem('elevate-program-holder-phone-device', '12345678901234567890123456789012');
  vi.stubGlobal('fetch', vi.fn(async (_url, options) => Response.json(options?.method === 'POST' ? { provider: 'asterisk' } : { readOnly: false, extension: { ringMode: 'ring' } })));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it('installs gesture audio unlock so a first incoming call can sound, and removes it on unmount', () => {
  const view = render(<ProgramHolderPhoneReceiver phoneHref="/host-shop/dashboard/phone" />);
  expect(mock.install).toHaveBeenCalledTimes(1);
  view.unmount();
  expect(cleanupUnlock).toHaveBeenCalledTimes(1);
});
