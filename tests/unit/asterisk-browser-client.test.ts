// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createPhoneClient, phoneDestination } from '@/lib/phone/browser-client';

const state = vi.hoisted(() => ({ options: null as any, manager: null as any }));
vi.mock('sip.js/lib/platform/web', () => ({
  SessionManager: class {
    connect = vi.fn().mockResolvedValue(undefined);
    register = vi.fn().mockResolvedValue(undefined);
    unregister = vi.fn().mockResolvedValue(undefined);
    disconnect = vi.fn().mockResolvedValue(undefined);
    call = vi.fn().mockImplementation(async () => ({
      id: 'test-session',
      remoteIdentity: { uri: { user: '102' } },
    }));
    constructor(_server: string, options: any) {
      state.options = options;
      state.manager = this;
    }
  },
}));
const credential = {
  provider: 'asterisk' as const,
  sipUsername: 'pwa-test',
  sipPassword: 'test-only',
  sipDomain: 'phone.elevateforhumanity.org',
  wsUrl: 'wss://phone.elevateforhumanity.org/ws',
  iceServers: [],
};
afterEach(() => vi.useRealTimers());

describe('Asterisk browser registration', () => {
  it('does not report ready when transport opens or a REGISTER is merely sent', async () => {
    const client = await createPhoneClient(credential, document.createElement('audio'));
    const ready = vi.fn();
    client.on('ready', ready);
    let connected = false;
    const attempt = client.connect().then(() => {
      connected = true;
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(connected).toBe(false);
    expect(ready).not.toHaveBeenCalled();
    state.options.delegate.onRegistered();
    await attempt;
    expect(connected).toBe(true);
    expect(ready).toHaveBeenCalledOnce();
    expect(state.options.userAgentOptions.logBuiltinEnabled).toBe(false);
  });

  it('clears online state on lost registration and disallows calls before reconnect', async () => {
    const client = await createPhoneClient(credential, document.createElement('audio'));
    const offline = vi.fn();
    client.on('offline', offline);
    const attempt = client.connect();
    state.options.delegate.onRegistered();
    await attempt;
    state.options.delegate.onUnregistered();
    expect(offline).toHaveBeenCalledOnce();
    await expect(
      client.newCall({
        destinationNumber: '102',
        audio: true,
        remoteElement: document.createElement('audio'),
      }),
    ).rejects.toThrow('Connect the phone');
    expect(state.manager.call).not.toHaveBeenCalled();
  });

  it('disconnects the WebSocket even when SIP deregistration fails', async () => {
    const client = await createPhoneClient(credential, document.createElement('audio'));
    state.manager.unregister.mockRejectedValue(new Error('network lost'));
    await expect(client.disconnect()).rejects.toThrow('network lost');
    expect(state.manager.disconnect).toHaveBeenCalledOnce();
  });

  it('restricts pilot destinations to internal extensions and preserves carrier number normalization', () => {
    expect(phoneDestination('0', 'asterisk')).toBe('0');
    expect(phoneDestination('102', 'asterisk')).toBe('102');
    expect(phoneDestination('+13175550100', 'asterisk')).toBeNull();
    expect(phoneDestination('102@untrusted.example', 'asterisk')).toBeNull();
    expect(phoneDestination('(317) 555-0100', 'telnyx')).toBe('+13175550100');
  });
});
