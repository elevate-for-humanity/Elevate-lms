import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, it, expect, vi } from 'vitest';
import Workspace from '@/components/studio/CloudBrowserWorkspace';
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
async function start(holdFirst = false) {
  const actions: any[] = [];
  let release = () => {};
  const response = (body: any) => ({
    ok: true,
    json: async () => body,
    text: async () => JSON.stringify(body),
  });
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, options: any = {}) => {
      if (url.endsWith('/config')) return response({});
      if (url.endsWith('/browser/session'))
        return response(
          options.method === 'POST'
            ? {
                id: 'test',
                token: 'fixture',
                publicUrl: 'https://worker.example',
                url: 'https://app.envato.com',
                viewport: { width: 390, height: 780 },
              }
            : { configured: true, ready: true },
        );
      if (url.endsWith('/actions')) {
        actions.push(JSON.parse(options.body));
        if (holdFirst && actions.length === 1)
          await new Promise<void>((r) => {
            release = r;
          });
        return response({});
      }
      return response({ events: [], downloads: [] });
    }),
  );
  render(<Workspace autoStart initialTarget="https://app.envato.com" />);
  await waitFor(() =>
    expect((screen.getByLabelText('Secure browser input') as HTMLInputElement).disabled).toBe(
      false,
    ),
  );
  return { actions, release: () => release() };
}
it('lets a touch user insert @ and replaces the selected field without retaining input', async () => {
  const { actions } = await start();
  const input = screen.getByLabelText('Secure browser input') as HTMLInputElement;
  expect(input.getAttribute('inputmode')).toBe('email');
  fireEvent.change(input, { target: { value: 'sampleexample.com' } });
  input.setSelectionRange(6, 6);
  fireEvent.click(screen.getByRole('button', { name: 'Insert at sign into secure input' }));
  expect(input.value).toBe('sample@example.com');
  fireEvent.click(screen.getByRole('button', { name: 'Type securely' }));
  await waitFor(() => expect(actions.length).toBe(1));
  expect(actions[0]).toEqual({
    actions: [
      { type: 'keypress', key: 'ControlOrMeta+A' },
      { type: 'type', text: 'sample@example.com' },
    ],
  });
  expect(input.value).toBe('');
  fireEvent.click(screen.getByRole('button', { name: 'Password input' }));
  expect(input.getAttribute('inputmode')).toBe('text');
  expect(input.type).toBe('password');
  expect(screen.queryByRole('button', { name: 'Insert at sign into secure input' })).toBeNull();
});
it('keeps a slow pointer click ahead of typing and Enter', async () => {
  const { actions, release } = await start(true);
  fireEvent.click(screen.getByAltText('Live isolated Chromium browser'), {
    clientX: 20,
    clientY: 20,
    detail: 1,
  });
  const input = screen.getByLabelText('Secure browser input');
  fireEvent.change(input, { target: { value: 'sample@example.com' } });
  fireEvent.click(screen.getByRole('button', { name: 'Type securely' }));
  await waitFor(() => expect(actions.length).toBe(1));
  expect(actions[0].type).toBe('pointer_click');
  await act(async () => {
    release();
  });
  await waitFor(() => expect(actions.length).toBe(2));
  expect(actions[1].actions[1]).toEqual({
    type: 'type',
    text: 'sample@example.com',
  });
});

it('retains the streamed image and secure input focus through repeated status updates', async () => {
  let poll: () => Promise<void> = async () => {};
  const interval = window.setInterval.bind(window);
  vi.spyOn(window, 'setInterval').mockImplementation(((callback: any, ms: any, ...args: any[]) => {
    if (ms === 3000) {
      poll = callback;
      return 123;
    }
    return interval(callback, ms, ...args);
  }) as any);
  await start();
  const input = screen.getByLabelText('Secure browser input') as HTMLInputElement;
  const image = screen.getByAltText('Live isolated Chromium browser');
  const src = image.getAttribute('src');
  input.focus();
  fireEvent.change(input, { target: { value: 'sample@example.com' } });
  for (let i = 0; i < 10; i++)
    await act(async () => {
      await poll();
    });
  expect(screen.getByAltText('Live isolated Chromium browser')).toBe(image);
  expect(image.getAttribute('src')).toBe(src);
  expect(document.activeElement).toBe(input);
  expect(input.value).toBe('sample@example.com');
});

it('switches mobile browser panels without resetting the session, stream or input draft', async () => {
  await start();
  const input = screen.getByLabelText('Secure browser input') as HTMLInputElement;
  const image = screen.getByRole('img', { name: 'Live isolated Chromium browser' });
  fireEvent.change(input, { target: { value: 'sample@example.com' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign-in & tools' }));
  expect(screen.getByRole('button', { name: 'Sign-in & tools' }).getAttribute('aria-pressed')).toBe('true');
  expect(screen.getByLabelText('Secure browser input')).toBe(input);
  fireEvent.click(screen.getByRole('button', { name: 'Browser', exact: true }));
  expect(screen.getByRole('img', { name: 'Live isolated Chromium browser' })).toBe(image);
  expect(input.value).toBe('sample@example.com');
});
