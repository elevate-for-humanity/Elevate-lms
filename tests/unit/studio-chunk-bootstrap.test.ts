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
  it('also recovers a deferred chunk rejection before components can mount', () => {
    const { listeners, replace } = boot();
    listeners.get('unhandledrejection')!({
      reason: new Error('ChunkLoadError: Loading chunk 7177 failed'),
    } as unknown as Event);
    expect(replace).toHaveBeenCalledTimes(1);
  });
});
