import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

/**
 * Behavioral test for the Admin service worker's call-wake handling: the
 * worker file is evaluated with a mocked SW global scope, then push and
 * notificationclick events are dispatched at the captured listeners.
 */
function loadWorker(windowClients: Array<Record<string, unknown>> = []) {
  const source = readFileSync(path.resolve('public/sw-admin.js'), 'utf8');
  const listeners = new Map<string, Array<(event: any) => void>>();
  const showNotification = vi.fn(async () => undefined);
  const openWindow = vi.fn(async () => null);
  const sandbox: Record<string, unknown> = {
    console,
    URL,
    Request: class {},
    Response: class {},
    fetch: vi.fn(),
    caches: { open: vi.fn(async () => ({ match: vi.fn(), put: vi.fn(), keys: vi.fn(async () => []) })), keys: vi.fn(async () => []), delete: vi.fn(async () => true) },
    location: { origin: 'https://admin.elevateforhumanity.org' },
    registration: { showNotification },
    clients: {
      matchAll: vi.fn(async () => windowClients),
      openWindow,
      claim: vi.fn(async () => undefined),
    },
    skipWaiting: vi.fn(),
    addEventListener: (type: string, handler: (event: any) => void) => {
      listeners.set(type, [...(listeners.get(type) || []), handler]);
    },
  };
  sandbox.self = sandbox;
  vm.createContext(sandbox);
  new vm.Script(source).runInContext(sandbox);
  return { listeners, showNotification, openWindow };
}

function dispatch(listeners: Map<string, Array<(event: any) => void>>, type: string, event: any) {
  for (const handler of listeners.get(type) || []) handler(event);
}

function pushEvent(payload: unknown) {
  let waited: Promise<unknown> | undefined;
  return {
    event: {
      data: { json: () => payload, text: () => JSON.stringify(payload) },
      waitUntil: (promise: Promise<unknown>) => {
        waited = promise;
      },
    },
    waited: () => waited,
  };
}

const WAKE_PAYLOAD = {
  title: 'Incoming call — Jane Doe',
  body: 'Extension 100 is ringing now. Tap to open your phone and answer.',
  url: '/phone/dial-pad?wake=1&call=call-1&from=%2B13175550142',
  tag: 'incoming-call-call-1',
  requireInteraction: true,
  vibrate: [400, 200, 400],
  data: { type: 'incoming_call', callId: 'call-1', extension: '100', caller: '+13175550142' },
};

describe('Admin service worker call wake', () => {
  it('shows a persistent, buzzing incoming-call notification for a wake push', async () => {
    const { listeners, showNotification } = loadWorker();
    const push = pushEvent(WAKE_PAYLOAD);
    dispatch(listeners, 'push', push.event);
    await push.waited();
    expect(showNotification).toHaveBeenCalledTimes(1);
    const [title, options] = showNotification.mock.calls[0];
    expect(title).toBe('Incoming call — Jane Doe');
    expect(options.requireInteraction).toBe(true);
    expect(options.vibrate).toEqual([400, 200, 400]);
    expect(options.tag).toBe('incoming-call-call-1');
    expect(options.data).toMatchObject({
      type: 'incoming_call',
      callId: 'call-1',
      url: WAKE_PAYLOAD.url,
    });
  });

  it('keeps ordinary pushes on the generic notification path', async () => {
    const { listeners, showNotification } = loadWorker();
    const push = pushEvent({ title: 'New voicemail', body: 'Extension 100: a caller left a voicemail.', url: '/phone/inbox', tag: 'vm-1' });
    dispatch(listeners, 'push', push.event);
    await push.waited();
    expect(showNotification).toHaveBeenCalledTimes(1);
    const [title, options] = showNotification.mock.calls[0];
    expect(title).toBe('New voicemail');
    expect(options.tag).toBe('vm-1');
    expect(options.data).toEqual({ url: '/phone/inbox', type: undefined });
  });

  it('focuses and navigates an already-open app window instead of opening a new one', async () => {
    const focus = vi.fn(async () => undefined);
    const navigate = vi.fn(async () => undefined);
    const existing = { url: 'https://admin.elevateforhumanity.org/dashboard', focus, navigate };
    const { listeners, openWindow } = loadWorker([existing]);
    let waited: Promise<unknown> | undefined;
    dispatch(listeners, 'notificationclick', {
      notification: { close: vi.fn(), data: { url: WAKE_PAYLOAD.url, type: 'incoming_call' } },
      waitUntil: (promise: Promise<unknown>) => {
        waited = promise;
      },
    });
    await waited;
    expect(focus).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(
      `https://admin.elevateforhumanity.org${WAKE_PAYLOAD.url}`,
    );
    expect(openWindow).not.toHaveBeenCalled();
  });

  it('opens a new window on the wake URL when no app window exists', async () => {
    const { listeners, openWindow } = loadWorker([]);
    let waited: Promise<unknown> | undefined;
    dispatch(listeners, 'notificationclick', {
      notification: { close: vi.fn(), data: { url: WAKE_PAYLOAD.url, type: 'incoming_call' } },
      waitUntil: (promise: Promise<unknown>) => {
        waited = promise;
      },
    });
    await waited;
    expect(openWindow).toHaveBeenCalledWith(`https://admin.elevateforhumanity.org${WAKE_PAYLOAD.url}`);
  });
});
