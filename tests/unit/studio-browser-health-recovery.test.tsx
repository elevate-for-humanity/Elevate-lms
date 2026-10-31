import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import CloudBrowserWorkspace from '@/components/studio/CloudBrowserWorkspace';
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
function setup(failures: number, status = 200) {
  let healthCalls = 0;
  let retry: (() => void) | undefined;
  const original = setTimeout;
  vi.spyOn(globalThis, 'setTimeout').mockImplementation(((
    callback: TimerHandler,
    ms?: number,
    ...args: unknown[]
  ) => {
    if (ms === 3000) {
      retry = callback as () => void;
      return 123 as unknown as ReturnType<typeof setTimeout>;
    }
    return original(callback, ms, ...args);
  }) as typeof setTimeout);
  const fetcher = vi.fn(async (url: string, options: RequestInit = {}) => {
    if (url.endsWith('/config')) return Response.json({ defaultPreviewUrl: 'https://example.org' });
    expect(options.method ?? 'GET').toBe('GET');
    healthCalls++;
    return healthCalls <= failures
      ? Response.json(
          { configured: true, ready: false, error: 'Temporary startup delay' },
          { status },
        )
      : Response.json({ configured: true, ready: true });
  });
  vi.stubGlobal('fetch', fetcher);
  render(<CloudBrowserWorkspace initialTarget="https://example.org" />);
  return { fetcher, retry: () => retry?.(), calls: () => healthCalls };
}
it('recovers from a transient offline check without creating a browser session or replaying work', async () => {
  const f = setup(1);
  await screen.findByText('Temporary startup delay');
  await act(async () => {
    f.retry();
  });
  expect(await screen.findByText('Ready to start')).toBeInTheDocument();
  expect(screen.queryByText('Temporary startup delay')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Start Chromium' })).toBeEnabled();
  expect(f.calls()).toBe(2);
  expect(f.fetcher.mock.calls.every(([, o]) => (o?.method ?? 'GET') === 'GET')).toBe(true);
});
it('bounds automatic reads and offers explicit reconnection after exhaustion', async () => {
  const f = setup(3);
  await screen.findByText('Temporary startup delay');
  await act(async () => {
    f.retry();
  });
  await act(async () => {
    f.retry();
  });
  expect(f.calls()).toBe(3);
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Reconnect runtime' }));
  });
  expect(await screen.findByText('Ready to start')).toBeInTheDocument();
  expect(f.calls()).toBe(4);
});
it('never retries rejected Admin authorization', async () => {
  const f = setup(1, 401);
  await screen.findByText('Temporary startup delay');
  await act(async () => {
    f.retry();
  });
  expect(f.calls()).toBe(1);
});
