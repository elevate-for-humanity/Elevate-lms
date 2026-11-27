vi.mock('@/components/communications/DashboardVideoCalls', () => ({ DashboardVideoCalls: () => null }));
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
beforeEach(() => {
  mock.handlers = {}; mock.unlock.mockClear(); mock.create.mockReset();
  mock.create.mockResolvedValue({ on: (event: string, callback: any) => { mock.handlers[event] = callback; },
    newCall: vi.fn().mockResolvedValue({ id: 'outbound-call' }),
    connect: async () => { mock.handlers.ready(); }, disconnect: vi.fn().mockResolvedValue(undefined) });
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) => {
    if (init?.method === 'POST') return Response.json({ provider: 'asterisk' });
    if (init?.method === 'PATCH') return Response.json({});
    return Response.json(data);
  }));
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); delete (document as any).visibilityState; });
async function connected() { render(<ProgramHolderPhone />); await screen.findByRole('button', { name: 'Disconnect' }); }
function showPage() {
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
}
describe('phone page ring recovery', () => {
  it('primes the shared audio context on connect and again on a manual reconnect', async () => {
    await connected();
    expect(mock.unlock).toHaveBeenCalled();
    mock.unlock.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }));
    await screen.findByText('Phone disconnected.');
    fireEvent.click(screen.getByRole('button', { name: 'Connect phone' }));
    await screen.findByRole('button', { name: 'Disconnect' });
    expect(mock.unlock).toHaveBeenCalled();
  });
  it('reconnects on its own about 30 seconds after the provider reports offline', async () => {
    vi.useFakeTimers();
    render(<ProgramHolderPhone />);
    await vi.waitFor(() => expect(mock.handlers.offline).toBeTypeOf('function'));
    await vi.waitFor(() => expect(screen.getByRole('button', { name: 'Disconnect' })).toBeTruthy());
    expect(mock.create).toHaveBeenCalledTimes(1);
    await act(async () => { mock.handlers.offline(); });
    expect(screen.getByRole('button', { name: 'Connect phone' })).toBeTruthy();
    await act(async () => { await vi.advanceTimersByTimeAsync(29_000); });
    expect(mock.create).toHaveBeenCalledTimes(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(1_000); });
    expect(mock.create).toHaveBeenCalledTimes(2);
    await vi.waitFor(() => expect(screen.getByRole('button', { name: 'Disconnect' })).toBeTruthy());
  });
  it('reconnects on its own about 30 seconds after the provider reports an error', async () => {
    vi.useFakeTimers();
    render(<ProgramHolderPhone />);
    await vi.waitFor(() => expect(mock.handlers.error).toBeTypeOf('function'));
    await vi.waitFor(() => expect(screen.getByRole('button', { name: 'Disconnect' })).toBeTruthy());
    expect(mock.create).toHaveBeenCalledTimes(1);
    await act(async () => { mock.handlers.error({ message: 'SIP registration rejected.' }); });
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    expect(mock.create).toHaveBeenCalledTimes(2);
  });
  it('does not schedule a reconnect while a call is active', async () => {
    vi.useFakeTimers();
    render(<ProgramHolderPhone />);
    await vi.waitFor(() => expect(mock.handlers.call).toBeTypeOf('function'));
    await act(async () => { mock.handlers.call({ call: { id: 'live', state: 'active', direction: 'inbound', stopRingtone: vi.fn() } }); });
    await act(async () => { mock.handlers.offline(); });
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
    expect(mock.create).toHaveBeenCalledTimes(1);
  });
  it('reconnects when the page becomes visible again after the registration lapsed', async () => {
    await connected();
    await act(async () => { mock.handlers.offline(); });
    expect(screen.getByRole('button', { name: 'Connect phone' })).toBeTruthy();
    await act(async () => { showPage(); });
    await waitFor(() => expect(mock.create).toHaveBeenCalledTimes(2));
    await screen.findByRole('button', { name: 'Disconnect' });
  });
  it('does not reconnect on visibility return after a deliberate disconnect', async () => {
    await connected();
    fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }));
    await screen.findByText('Phone disconnected.');
    await act(async () => { showPage(); });
    expect(mock.create).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Connect phone' })).toBeTruthy();
  });
  it('leaves a healthy registration alone when the page becomes visible', async () => {
    await connected();
    await act(async () => { showPage(); });
    expect(mock.create).toHaveBeenCalledTimes(1);
  });
});
