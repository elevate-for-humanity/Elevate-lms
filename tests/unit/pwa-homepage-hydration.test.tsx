import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
vi.mock('@/hooks/usePwaInstall', () => ({ usePwaInstall: () => ({ canInstall:true, isInstalled:false, promptInstall:vi.fn(), dismiss:vi.fn(), platform:'android' }) }));
import { PwaInstallBanner } from '@/components/pwa/PwaInstallBanner';
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });
describe('homepage PWA startup', () => {
  it('hydrates without an install overlay or mismatch, even when browser storage is blocked', async () => {
    vi.useFakeTimers();
    vi.spyOn(Storage.prototype,'getItem').mockImplementation(() => { throw new DOMException('Blocked','SecurityError'); });
    vi.spyOn(Storage.prototype,'setItem').mockImplementation(() => { throw new DOMException('Blocked','SecurityError'); });
    const recoverable = vi.fn();
    const container = document.createElement('div'); document.body.appendChild(container);
    container.innerHTML = renderToString(<PwaInstallBanner />);
    expect(container.innerHTML).toBe('');
    let root: ReturnType<typeof hydrateRoot>;
    await act(async () => { root = hydrateRoot(container,<PwaInstallBanner />, { onRecoverableError:recoverable }); });
    expect(container.querySelector('[aria-label="Install Elevate app"]')).toBeNull();
    await act(async () => { vi.advanceTimersByTime(8000); });
    expect(container.querySelector('[aria-label="Install Elevate app"]')).not.toBeNull();
    await act(async () => { (container.querySelector('[aria-label="Dismiss install prompt"]') as HTMLButtonElement).click(); });
    expect(container.querySelector('[aria-label="Install Elevate app"]')).toBeNull();
    expect(recoverable).not.toHaveBeenCalled();
    await act(async () => root!.unmount()); container.remove();
  });
});
