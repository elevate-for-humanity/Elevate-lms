import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PwaUpdateNotice } from '@/components/pwa/PwaUpdateNotice';

const buildResponse = (commit: string) => ({
  ok: true,
  status: 200,
  json: async () => ({ commit }),
}) as Response;

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('NEXT_PUBLIC_GIT_SHA', 'loaded-build');
  sessionStorage.clear();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(buildResponse('loaded-build')));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('safe dashboard and website updates without interrupting active work', () => {
  it('detects a new server build but never shows an ineffective reload prompt or discards a draft', async () => {
    vi.mocked(fetch).mockResolvedValue(buildResponse('new-build'));
    const updateReady = vi.fn();
    window.addEventListener('elevate-build-update-ready', updateReady);
    try {
      render(<><input aria-label="Work in progress" defaultValue="Unsaved course draft" /><PwaUpdateNotice /></>);
      await waitFor(() => expect(updateReady).toHaveBeenCalled());
      expect(screen.getByLabelText('Work in progress')).toHaveValue('Unsaved course draft');
      expect(screen.queryByRole('button', { name: 'Update now' })).toBeNull();
      expect(screen.queryByRole('region', { name: 'Application update' })).toBeNull();
      expect(sessionStorage.getItem('elevate_build_version')).not.toBe('new-build');
    } finally {
      window.removeEventListener('elevate-build-update-ready', updateReady);
    }
  });

  it('keeps the update banner absent when a service worker changes', async () => {
    render(<PwaUpdateNotice />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    act(() => window.dispatchEvent(new CustomEvent('elevate-pwa-controller-changed')));
    expect(screen.queryByRole('button', { name: 'Update now' })).toBeNull();
  });

  it('never offers an unsafe manual activation prompt when a new worker is waiting', async () => {
    render(<PwaUpdateNotice />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    const postMessage = vi.fn();
    act(() => window.dispatchEvent(new CustomEvent('elevate-pwa-update-ready', {
      detail: { waiting: { state: 'installed', postMessage } },
    })));
    expect(screen.queryByRole('button', { name: 'Update now' })).toBeNull();
    expect(postMessage).not.toHaveBeenCalled();
  });

  it('preserves unsaved Paris text across update-ready events', async () => {
    render(<><input aria-label="Draft" defaultValue="Unsaved Paris request" /><PwaUpdateNotice /></>);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    act(() => window.dispatchEvent(new CustomEvent('elevate-build-update-ready')));
    expect(screen.queryByRole('button', { name: 'Later' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Update now' })).toBeNull();
    expect(screen.getByRole('textbox', { name: 'Draft' })).toHaveValue('Unsaved Paris request');
  });

  it('continues build checks after React remount and online events', async () => {
    const { unmount } = render(<PwaUpdateNotice />);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    unmount();
    render(<PwaUpdateNotice />);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    vi.mocked(fetch).mockResolvedValue(buildResponse('new-build'));
    const updateReady = vi.fn();
    window.addEventListener('elevate-build-update-ready', updateReady);
    try {
      act(() => window.dispatchEvent(new Event('online')));
      await waitFor(() => expect(updateReady).toHaveBeenCalled());
      expect(screen.queryByRole('button', { name: 'Update now' })).toBeNull();
    } finally {
      window.removeEventListener('elevate-build-update-ready', updateReady);
    }
  });
});
