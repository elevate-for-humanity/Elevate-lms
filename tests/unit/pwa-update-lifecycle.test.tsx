import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CanonicalPwaRegistration } from '@/components/pwa/CanonicalPwaRegistration';

vi.mock('@/components/pwa/PwaUpdateNotice', () => ({ PwaUpdateNotice: () => null }));

class Worker extends EventTarget {
  scriptURL = `${window.location.origin}/sw-lms.js`;
  state: ServiceWorkerState = 'installing';
}

class Registration extends EventTarget {
  active = new Worker();
  installing: Worker | null = null;
  waiting: Worker | null = null;
  update = vi.fn().mockResolvedValue(undefined);
  unregister = vi.fn().mockResolvedValue(true);
}

let registration: Registration;
let serviceWorker: EventTarget & {
  controller: Worker | null;
  getRegistrations: ReturnType<typeof vi.fn>;
  register: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'production');
  registration = new Registration();
  serviceWorker = Object.assign(new EventTarget(), {
    controller: registration.active,
    getRegistrations: vi.fn().mockResolvedValue([registration]),
    register: vi.fn().mockResolvedValue(registration),
  });
  vi.stubGlobal('navigator', { serviceWorker });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('PWA updates across dashboard applications', () => {
  it('keeps a healthy registration when an update check is offline', async () => {
    registration.update.mockRejectedValue(new TypeError('Network unavailable'));
    render(<CanonicalPwaRegistration application="lms" />);
    await waitFor(() => expect(registration.update).toHaveBeenCalled());
    expect(registration.unregister).not.toHaveBeenCalled();
  });

  it('removes worker listeners when the application unmounts', async () => {
    const ready = vi.fn();
    window.addEventListener('elevate-pwa-update-ready', ready);
    const { unmount } = render(<CanonicalPwaRegistration application="lms" />);
    await waitFor(() => expect(registration.update).toHaveBeenCalled());
    const worker = new Worker();
    act(() => {
      registration.installing = worker;
      registration.dispatchEvent(new Event('updatefound'));
    });
    unmount();
    worker.state = 'installed';
    worker.dispatchEvent(new Event('statechange'));
    expect(ready).not.toHaveBeenCalled();
    window.removeEventListener('elevate-pwa-update-ready', ready);
  });

  it('announces an installed update after the browser clears registration.installing', async () => {
    const ready = vi.fn();
    window.addEventListener('elevate-pwa-update-ready', ready);
    render(<CanonicalPwaRegistration application="lms" />);
    await waitFor(() => expect(registration.update).toHaveBeenCalled());
    const worker = new Worker();
    act(() => {
      registration.installing = worker;
      registration.dispatchEvent(new Event('updatefound'));
      registration.installing = null;
      registration.waiting = worker;
      worker.state = 'installed';
      worker.dispatchEvent(new Event('statechange'));
    });
    expect(ready).toHaveBeenCalledOnce();
    window.removeEventListener('elevate-pwa-update-ready', ready);
  });

  it('announces an update already waiting when a dashboard mounts', async () => {
    registration.waiting = new Worker();
    registration.waiting.state = 'installed';
    const ready = vi.fn();
    window.addEventListener('elevate-pwa-update-ready', ready);
    render(<CanonicalPwaRegistration application="lms" />);
    await waitFor(() => expect(registration.update).toHaveBeenCalled());
    expect(ready).toHaveBeenCalledOnce();
    window.removeEventListener('elevate-pwa-update-ready', ready);
  });

  it('does not announce first installation as an update', async () => {
    serviceWorker.controller = null;
    const changed = vi.fn();
    window.addEventListener('elevate-pwa-controller-changed', changed);
    render(<CanonicalPwaRegistration application="lms" />);
    await waitFor(() => expect(registration.update).toHaveBeenCalled());
    act(() => {
      serviceWorker.controller = registration.active;
      serviceWorker.dispatchEvent(new Event('controllerchange'));
    });
    expect(changed).not.toHaveBeenCalled();
    window.removeEventListener('elevate-pwa-controller-changed', changed);
  });
});
