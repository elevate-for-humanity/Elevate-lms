import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PwaUpdateNotice } from '@/components/pwa/PwaUpdateNotice';

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('NEXT_PUBLIC_GIT_SHA', 'loaded-build');
  sessionStorage.clear();
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ commit: 'loaded-build' }),
    }),
  );
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('safe dashboard and website updates', () => {
  it('detects stale loaded code on the first poll without discarding work', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ commit: 'new-build' }),
    } as Response);
    render(
      <>
        <input aria-label="Work in progress" defaultValue="Unsaved course draft" />
        <PwaUpdateNotice />
      </>,
    );
    await screen.findByRole('button', { name: 'Update now' });
    expect(screen.getByLabelText('Work in progress')).toHaveValue('Unsaved course draft');
    expect(sessionStorage.getItem('elevate_build_version')).not.toBe('new-build');
  });

  it('shows a refresh option after an already active worker changes', async () => {
    render(<PwaUpdateNotice />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    act(() => window.dispatchEvent(new CustomEvent('elevate-pwa-controller-changed')));
    expect(screen.getByRole('button', { name: 'Update now' })).toBeEnabled();
  });

  it('waits for activation and offers a retry when activation stalls', async () => {
    render(<PwaUpdateNotice />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    vi.useFakeTimers();
    const postMessage = vi.fn();
    act(() =>
      window.dispatchEvent(
        new CustomEvent('elevate-pwa-update-ready', {
          detail: { waiting: { state: 'installed', postMessage } },
        }),
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Update now' }));
    expect(postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    expect(screen.getByRole('button', { name: 'Updating…' })).toBeDisabled();
    act(() => vi.advanceTimersByTime(15_000));
    expect(screen.getByRole('button', { name: 'Update now' })).toBeEnabled();
    expect(screen.getByRole('status')).toHaveTextContent('Please try again');
  });

  it('lets the user defer an update and keep editing without repeated notices', async () => {
    render(<><input aria-label="Draft" defaultValue="Unsaved Paris request" /><PwaUpdateNotice /></>);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    act(() => window.dispatchEvent(new CustomEvent('elevate-build-update-ready')));
    fireEvent.click(screen.getByRole('button', {name:'Later'}));
    expect(screen.queryByRole('region', {name:'Application update'})).toBeNull();
    act(() => window.dispatchEvent(new CustomEvent('elevate-build-update-ready')));
    expect(screen.queryByRole('button', {name:'Update now'})).toBeNull();
    expect(screen.getByRole('textbox', {name:'Draft'})).toHaveValue('Unsaved Paris request');
  });

  it('keeps polling after React remounts effects', async () => {
    const { unmount } = render(<PwaUpdateNotice />);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    unmount();
    render(<PwaUpdateNotice />);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ commit: 'new-build' }),
    } as Response);
    act(() => window.dispatchEvent(new Event('online')));
    await screen.findByRole('button', { name: 'Update now' });
  });
});
