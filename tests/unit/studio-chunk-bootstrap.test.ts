import { beforeEach, describe, expect, it, vi } from 'vitest';
import { chunkRecoveryBootstrap } from '@/lib/browser/chunk-recovery-bootstrap';

describe('Admin recovery before React hydration', () => {
  beforeEach(() => sessionStorage.clear());
  function boot(href = 'https://admin.elevateforhumanity.org/studio') {
    const listeners = new Map<string, (event: Event) => void>();
    const replace = vi.fn();
    const browser = {
      sessionStorage,
      location: { href, replace },
      HTMLScriptElement,
      HTMLLinkElement,
      Element,
      addEventListener: (type: string, listener: (event: Event) => void) =>
        listeners.set(type, listener),
      removeEventListener: vi.fn(),
    };
    // Execute the actual serialized head script, without a React component.
    new Function('window', chunkRecoveryBootstrap())(browser);
    return { listeners, replace };
  }
  it('recovers a missing application asset once and preserves the Studio route', () => {
    const { listeners, replace } = boot();
    const script = document.createElement('script');
    script.src = 'https://admin.elevateforhumanity.org/_next/static/chunks/app/layout-missing.js';
    const event = new Event('error');
    Object.defineProperty(event, 'target', { value: script });
    listeners.get('error')!(event);
    listeners.get('error')!(event);
    expect(replace).toHaveBeenCalledTimes(1);
    expect(new URL(replace.mock.calls[0][0]).pathname).toBe('/studio');
    expect(new URL(replace.mock.calls[0][0]).searchParams.has('__elevate_reload')).toBe(true);
    // A reload installs another handler; the persisted bound still applies.
    const afterReload = boot();
    afterReload.listeners.get('error')!(event);
    expect(afterReload.replace).not.toHaveBeenCalled();
  });
  it('recovers Marketing startup CSS before hydration while preserving shared-link parameters', () => {
    const { listeners, replace } = boot('https://www.elevateforhumanity.org/?utm_source=shared');
    const link = document.createElement('link');
    link.href = 'https://www.elevateforhumanity.org/_next/static/css/missing.css';
    const event = new Event('error');
    Object.defineProperty(event, 'target', { value: link });
    listeners.get('error')!(event);
    const recovered = new URL(replace.mock.calls[0][0]);
    expect(recovered.origin).toBe('https://www.elevateforhumanity.org');
    expect(recovered.pathname).toBe('/');
    expect(recovered.searchParams.get('utm_source')).toBe('shared');
    expect(recovered.searchParams.has('__elevate_reload')).toBe(true);
  });
  it('does not reload for application bugs or failed third-party assets', () => {
    const { listeners, replace } = boot();
    const script = document.createElement('script');
    script.src = 'https://example.org/analytics.js';
    const event = new Event('error');
    Object.defineProperty(event, 'target', { value: script });
    listeners.get('error')!(event);
    listeners.get('unhandledrejection')!({
      reason: new Error('Database unavailable'),
    } as unknown as Event);
    expect(replace).not.toHaveBeenCalled();
  });
  it('recovers a Host Shop form chunk without losing its route or query parameters', () => {
    const { listeners, replace } = boot(
      'https://lms.elevateforhumanity.org/host-shop/onboarding/profile?error=required',
    );
    const script = document.createElement('script');
    script.src =
      'https://lms.elevateforhumanity.org/_next/static/chunks/app/host-shop/onboarding/profile/page-stale.js';
    const event = new Event('error');
    Object.defineProperty(event, 'target', { value: script });
    listeners.get('error')!(event);
    const recovered = new URL(replace.mock.calls[0][0]);
    expect(recovered.pathname).toBe('/host-shop/onboarding/profile');
    expect(recovered.searchParams.get('error')).toBe('required');
    listeners.get('error')!(event);
    expect(replace).toHaveBeenCalledTimes(1);
  });
  it('also recovers a deferred chunk rejection before components can mount', () => {
    const { listeners, replace } = boot();
    listeners.get('unhandledrejection')!({
      reason: new Error('ChunkLoadError: Loading chunk 7177 failed'),
    } as unknown as Event);
    expect(replace).toHaveBeenCalledTimes(1);
  });
  function navigate(
    listeners: Map<string, (event: Event) => void>,
    href: string,
    options: MouseEventInit = {},
  ) {
    const anchor = document.createElement('a');
    anchor.href = href;
    const event = new MouseEvent('click', { button: 0, ...options });
    Object.defineProperty(event, 'target', { value: anchor });
    listeners.get('click')!(event);
  }
  it('recovers the requested employer orientation when its chunk fails before history commits', () => {
    const { listeners, replace } = boot('https://lms.elevateforhumanity.org/employer/setup');
    navigate(listeners, 'https://lms.elevateforhumanity.org/employer/orientation?from=setup');
    listeners.get('unhandledrejection')!({
      reason: new Error('ChunkLoadError: Loading chunk 39189 failed'),
    } as unknown as Event);
    const recovered = new URL(replace.mock.calls[0][0]);
    expect(recovered.pathname).toBe('/employer/orientation');
    expect(recovered.searchParams.get('from')).toBe('setup');
    expect(recovered.searchParams.has('__elevate_reload')).toBe(true);
  });
  it('never follows third-party links or new-tab gestures during recovery', () => {
    const { listeners, replace } = boot('https://lms.elevateforhumanity.org/employer/setup');
    navigate(listeners, 'https://example.org/outside');
    navigate(listeners, 'https://lms.elevateforhumanity.org/employer/orientation', {
      metaKey: true,
    });
    listeners.get('unhandledrejection')!({
      reason: new Error('ChunkLoadError'),
    } as unknown as Event);
    expect(new URL(replace.mock.calls[0][0]).pathname).toBe('/employer/setup');
  });
  it('does not reuse an expired navigation hint', () => {
    const { listeners, replace } = boot('https://lms.elevateforhumanity.org/employer/documents');
    navigate(listeners, 'https://lms.elevateforhumanity.org/employer/orientation');
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 16000);
    listeners.get('unhandledrejection')!({
      reason: new Error('ChunkLoadError'),
    } as unknown as Event);
    expect(new URL(replace.mock.calls[0][0]).pathname).toBe('/employer/documents');
    vi.restoreAllMocks();
  });
  it('recovers a React-caught Course Builder chunk through the shared destination hint', () => {
    const { listeners, replace } = boot('https://admin.elevateforhumanity.org/dashboard');
    navigate(listeners, 'https://admin.elevateforhumanity.org/studio/courses?tab=ultimate');
    const caught = new CustomEvent('elevate:chunk-error', {
      detail: 'ChunkLoadError: Loading chunk 4321 failed',
      cancelable: true,
    });
    listeners.get('elevate:chunk-error')!(caught);
    expect(caught.defaultPrevented).toBe(true);
    expect(replace).toHaveBeenCalledTimes(1);
    const destination = new URL(replace.mock.calls[0][0]);
    expect(destination.pathname).toBe('/studio/courses');
    expect(destination.searchParams.get('tab')).toBe('ultimate');
  });
  it('does not let a React boundary start a second recovery after the early handler', () => {
    const { listeners, replace } = boot('https://admin.elevateforhumanity.org/dashboard');
    navigate(listeners, 'https://admin.elevateforhumanity.org/studio/courses');
    listeners.get('unhandledrejection')!({
      reason: new Error('ChunkLoadError: Loading chunk 1 failed'),
    } as unknown as Event);
    const caught = new CustomEvent('elevate:chunk-error', {
      detail: 'ChunkLoadError: Loading chunk 2 failed',
      cancelable: true,
    });
    listeners.get('elevate:chunk-error')!(caught);
    expect(caught.defaultPrevented).toBe(true);
    expect(replace).toHaveBeenCalledTimes(1);
    expect(new URL(replace.mock.calls[0][0]).pathname).toBe('/studio/courses');
  });
  it('does not acknowledge database or authentication failures as caught chunks', () => {
    const { listeners, replace } = boot();
    for (const detail of [
      'Database unavailable',
      'Fetch API cannot load auth/v1/user due to access control checks.',
    ]) {
      const caught = new CustomEvent('elevate:chunk-error', { detail, cancelable: true });
      listeners.get('elevate:chunk-error')!(caught);
      expect(caught.defaultPrevented).toBe(false);
    }
    expect(replace).not.toHaveBeenCalled();
  });
  it('lets an in-flight document navigation win over a late caught chunk failure', () => {
    const { listeners, replace } = boot('https://admin.elevateforhumanity.org/studio/courses');
    listeners.get('beforeunload')!(new Event('beforeunload'));
    const caught = new CustomEvent('elevate:chunk-error', {
      detail: 'ChunkLoadError',
      cancelable: true,
    });
    listeners.get('elevate:chunk-error')!(caught);
    expect(caught.defaultPrevented).toBe(true);
    expect(replace).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('elevate-chunk-reload')).toBeNull();
  });
  it('recovers the restored document without reusing its previous forward navigation', () => {
    const { listeners, replace } = boot();
    navigate(listeners, 'https://admin.elevateforhumanity.org/studio/courses');
    listeners.get('pagehide')!(new Event('pagehide'));
    listeners.get('pageshow')!(new Event('pageshow'));
    listeners.get('elevate:chunk-error')!(
      new CustomEvent('elevate:chunk-error', { detail: 'ChunkLoadError', cancelable: true }),
    );
    expect(replace).toHaveBeenCalledTimes(1);
    expect(new URL(replace.mock.calls[0][0]).pathname).toBe('/studio');
  });

});
