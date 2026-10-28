import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import CloudBrowserWorkspace from '@/components/studio/CloudBrowserWorkspace';
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
async function setup() {
  let poll: (() => Promise<void>) | undefined;
  let resolveEvents!: (response: Response) => void;
  const events = new Promise<Response>((resolve) => {
    resolveEvents = resolve;
  });
  const original = window.setInterval.bind(window);
  vi.spyOn(window, 'setInterval').mockImplementation(((
    callback: TimerHandler,
    ms?: number,
    ...args: unknown[]
  ) => {
    if (ms === 3000) {
      poll = callback as () => Promise<void>;
      return 123;
    }
    return original(callback, ms, ...args);
  }) as typeof window.setInterval);
  const fetcher = vi.fn(async (url: string, options: RequestInit = {}) => {
    if (url.includes('resource=events')) return events;
    if (url.includes('resource=downloads')) return Response.json({ downloads: [] });
    if (url.endsWith('/config')) return Response.json({ defaultPreviewUrl: 'https://example.org' });
    if (url.endsWith('/browser/session') && options.method === 'POST')
      return Response.json({
        id: 'fixture',
        token: 'fixture',
        publicUrl: 'https://worker.example',
        url: 'https://example.org',
        viewport: { width: 1280, height: 900 },
      });
    if (url.endsWith('/browser/session')) return Response.json({ configured: true, ready: true });
    return Response.json({});
  });
  vi.stubGlobal('fetch', fetcher);
  render(<CloudBrowserWorkspace initialTarget="https://example.org" />);
  await screen.findByRole('button', { name: 'Start Chromium' });
  await act(async () => {});
  fireEvent.click(screen.getByRole('button', { name: 'Start Chromium' }));
  await screen.findByRole('button', { name: 'Go', exact: true });
  // A visible session can commit before its polling effect runs under concurrent rendering.
  await waitFor(() => expect(poll).toBeTypeOf('function'));
  return { poll: () => poll!(), resolveEvents, fetcher };
}
it('does not overlap a slow status request or its download request', async () => {
  const fixture = await setup();
  let pending!: Promise<void>;
  await act(async () => {
    pending = fixture.poll();
    await fixture.poll();
    await fixture.poll();
  });
  expect(
    fixture.fetcher.mock.calls.filter(([url]) => url.includes('resource=events')),
  ).toHaveLength(1);
  await act(async () => {
    fixture.resolveEvents(Response.json({ events: [] }));
    await pending;
  });
  expect(
    fixture.fetcher.mock.calls.filter(([url]) => url.includes('resource=downloads')),
  ).toHaveLength(1);
});
it('stops background polling after authorization fails instead of hammering the session', async () => {
  const fixture = await setup();
  await act(async () => {
    fixture.resolveEvents(Response.json({ error: 'Unauthorized' }, { status: 401 }));
    await fixture.poll();
    await fixture.poll();
  });
  expect(screen.getByText('Studio sign-in required')).toBeInTheDocument();
  expect(
    fixture.fetcher.mock.calls.filter(([url]) => url.includes('resource=events')),
  ).toHaveLength(1);
  expect(fixture.fetcher.mock.calls.some(([url]) => url.includes('resource=downloads'))).toBe(
    false,
  );
});
it('fits browser content to readable width without starting another session', async () => {
  const fixture = await setup();
  fireEvent.click(screen.getByRole('button', { name: 'Zoom browser out' }));
  expect(screen.getByLabelText('Browser zoom')).toHaveTextContent('75%');
  fireEvent.click(screen.getByRole('button', { name: 'Fit width' }));
  expect(screen.getByAltText('Live isolated Chromium browser').style.width).toBe('100%');
  expect(
    fixture.fetcher.mock.calls.filter(
      ([url, options]) => url.endsWith('/browser/session') && options.method === 'POST',
    ),
  ).toHaveLength(1);
});
it('stops polling when download authorization expires after events succeeded', async () => {
  const fixture = await setup();
  fixture.fetcher.mockResolvedValueOnce(Response.json({ events: [] }));
  fixture.fetcher.mockResolvedValueOnce(Response.json({ error: 'Unauthorized' }, { status: 403 }));
  await act(async () => {
    await fixture.poll();
    await fixture.poll();
  });
  expect(screen.getByText('Studio sign-in required')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Sign in to Studio' })).toHaveAttribute(
    'href',
    '/login?redirect=%2Fstudio',
  );
  expect(
    fixture.fetcher.mock.calls.filter(([url]) => url.includes('resource=events')),
  ).toHaveLength(1);
});
it('surfaces an unreadable status response without an unhandled polling rejection', async () => {
  const fixture = await setup();
  await act(async () => {
    fixture.resolveEvents(new Response('upstream error', { status: 200 }));
    await fixture.poll();
  });
  expect(await screen.findByText('Browser controls interrupted')).toBeInTheDocument();
  expect(fixture.fetcher.mock.calls.some(([url]) => url.includes('resource=downloads'))).toBe(
    false,
  );
});
