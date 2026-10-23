import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
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

describe('silent dashboard and website updates', () => {
  it('detects a stale build without showing a prompt or discarding work', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ commit: 'new-build' }),
    } as Response);
    const onUpdateReady = vi.fn();
    window.addEventListener('elevate-build-update-ready', onUpdateReady);

    render(
      <>
        <input aria-label="Work in progress" defaultValue="Unsaved course draft" />
        <PwaUpdateNotice />
      </>,
    );

    await waitFor(() => expect(onUpdateReady).toHaveBeenCalledOnce());
    expect(screen.queryByRole('region', { name: 'Application update' })).toBeNull();
    expect(screen.getByLabelText('Work in progress')).toHaveValue('Unsaved course draft');
    window.removeEventListener('elevate-build-update-ready', onUpdateReady);
  });

  it('does not react to service-worker update events with a reload prompt', () => {
    const postMessage = vi.fn();
    render(
      <>
        <input aria-label="Draft" defaultValue="Unsaved Paris request" />
        <PwaUpdateNotice />
      </>,
    );

    act(() => {
      window.dispatchEvent(
        new CustomEvent('elevate-pwa-update-ready', {
          detail: { waiting: { state: 'installed', postMessage } },
        }),
      );
      window.dispatchEvent(new CustomEvent('elevate-pwa-controller-changed'));
      window.dispatchEvent(new CustomEvent('elevate-build-update-ready'));
    });

    expect(screen.queryByRole('region', { name: 'Application update' })).toBeNull();
    expect(screen.queryByRole('button', { name: /update|later/i })).toBeNull();
    expect(postMessage).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Draft')).toHaveValue('Unsaved Paris request');
  });

  it('keeps build-version polling after remount without restoring the prompt', async () => {
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
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
    expect(screen.queryByRole('region', { name: 'Application update' })).toBeNull();
    expect(screen.queryByRole('button', { name: /update|later/i })).toBeNull();
  });
});
