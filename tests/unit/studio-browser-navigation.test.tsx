import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import CloudBrowserWorkspace from '@/components/studio/CloudBrowserWorkspace';
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('keeps a typed destination through event polling and navigates the worker to that destination', async () => {
  let poll: () => Promise<void> = async () => {};
  const originalInterval = window.setInterval.bind(window);
  vi.spyOn(window, 'setInterval').mockImplementation(((callback: any, ms: number, ...args: any[]) => {
    // Capture only worker polling. Testing Library also uses setInterval to retry assertions.
    if (ms === 3000) { poll = callback; return 123; }
    return originalInterval(callback, ms, ...args);
  }) as typeof window.setInterval);
  const requested: any[] = [];
  let workerUrl = 'https://www.elevateforhumanity.org/';
  const response = (body: unknown) => ({
    ok: true,
    json: async () => body,
    text: async () => JSON.stringify(body),
  });
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, options: any = {}) => {
      if (url.endsWith('/config')) return response({ defaultPreviewUrl: workerUrl });
      if (url.endsWith('/browser/session') && options.method === 'POST')
        return response({
          id: 'session',
          token: 'test-token',
          publicUrl: 'https://worker.example.org',
          url: workerUrl,
          viewport: { width: 1440, height: 900 },
        });
      if (url.endsWith('/browser/session')) return response({ configured: true, ready: true });
      if (url.endsWith('/events')) return response({ events: [], url: workerUrl });
      if (url.endsWith('/downloads')) return response({ downloads: [] });
      if (url.endsWith('/browser/action')) {
        const body = JSON.parse(options.body);
        requested.push(body);
        workerUrl = body.action.url;
        return response({ url: workerUrl });
      }
      return response({});
    }),
  );
  render(<CloudBrowserWorkspace initialTarget={workerUrl} />);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Start Chromium' })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name: 'Start Chromium' }));
  await screen.findByRole('button', { name: 'Go', exact: true });
  const address = screen.getByRole('textbox', { name: 'Browser URL' });
  fireEvent.change(address, { target: { value: 'https://app.envato.com/workspaces' } });
  await act(async () => {
    await poll();
  });
  expect(address).toHaveValue('https://app.envato.com/workspaces');
  fireEvent.click(screen.getByRole('button', { name: 'Go', exact: true }));
  await waitFor(() =>
    expect(requested).toEqual([{
      sessionId: 'session',
      sessionToken: 'test-token',
      action: { type: 'navigate', url: 'https://app.envato.com/workspaces', actor: 'human' },
    }]),
  );
  await act(async () => {
    await poll();
  });
  expect(address).toHaveValue('https://app.envato.com/workspaces');
});
