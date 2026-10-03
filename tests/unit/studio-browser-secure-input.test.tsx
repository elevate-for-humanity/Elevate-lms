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
  expect(input.type).toBe('text');
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

it('opens a readable sign-in view on the existing session and keeps the draft', async () => {
  const { actions } = await start();
  const image = screen.getByAltText('Live isolated Chromium browser');
  const input = screen.getByLabelText('Secure browser input') as HTMLInputElement;
  fireEvent.change(input, { target: { value: 'sample@example.com' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in', exact: true }));
  await waitFor(() => expect(actions).toContainEqual({ type: 'viewport', width: 390, height: 780 }));
  expect(screen.getByAltText('Live isolated Chromium browser')).toBe(image);
  expect(input.value).toBe('sample@example.com');
  expect(screen.getByRole('button', { name: 'Sign in', exact: true }).getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: 'Exit sign-in view' }));
  expect(screen.getByAltText('Live isolated Chromium browser')).toBe(image);
  expect(input.value).toBe('sample@example.com');
});

it('offers a literal @ for the general browser keyboard without relying on the phone keyboard', async () => {
  const { actions } = await start();
  fireEvent.click(screen.getByRole('button', { name: 'Insert at sign into browser keyboard input' }));
  expect((screen.getByLabelText('Browser keyboard input') as HTMLInputElement).value).toBe('@');
  fireEvent.click(screen.getByRole('button', { name: 'Type', exact: true }));
  await waitFor(() => expect(actions).toContainEqual({ type: 'type', text: '@' }));
});

it('binds each sign-in label to its own field when Studio mounts multiple browser panels', async () => {
  await start();
  render(<Workspace initialTarget="https://app.envato.com" />);
  const inputs = screen.getAllByLabelText('Secure browser input') as HTMLInputElement[];
  expect(inputs).toHaveLength(2);
  expect(inputs[0].id).not.toBe(inputs[1].id);
  for (const input of inputs) {
    expect(input.labels).toHaveLength(1);
    expect(input.labels![0].control).toBe(input);
  }
});

it('zooms the existing stream without recreating the browser session', async () => {
  const { actions } = await start();
  const image = screen.getByAltText('Live isolated Chromium browser');
  fireEvent.click(screen.getByRole('button', { name: 'Zoom browser in' }));
  expect(screen.getByLabelText('Browser zoom').textContent).toBe('150%');
  expect(image.style.width).toBe('150%');
  expect(image.style.touchAction).toBe('pan-x pan-y pinch-zoom');
  expect(screen.getByAltText('Live isolated Chromium browser')).toBe(image);
  fireEvent.click(screen.getByRole('button', { name: 'Zoom browser out' }));
  expect(screen.getByLabelText('Browser zoom').textContent).toBe('100%');
  expect(actions).toEqual([]);
});
it('provides explicit website scrolling while touch panning stays local', async () => {
  const { actions } = await start();
  const image = screen.getByAltText('Live isolated Chromium browser');
  const down = new Event('pointerdown', { bubbles: true });
  Object.defineProperty(down, 'pointerType', { value: 'touch' });
  fireEvent(image, down);
  const viewport = image.parentElement!;
  Object.defineProperty(viewport, 'scrollHeight', { value: 1000, configurable: true });
  Object.defineProperty(viewport, 'clientHeight', { value: 400, configurable: true });
  fireEvent.wheel(image, { deltaY: 200 });
  await act(async () => {});
  expect(actions).toEqual([]);
  fireEvent.click(screen.getByRole('button', { name: 'Scroll website down' }));
  fireEvent.click(screen.getByRole('button', { name: 'Scroll website up' }));
  await waitFor(() => expect(actions.length).toBe(2));
  expect(actions).toEqual([
    { type: 'scroll', deltaX: 0, deltaY: 400 },
    { type: 'scroll', deltaX: 0, deltaY: -400 },
  ]);
});

it('shrinks below 100 percent to 25 percent and restores without recreating the session', async () => {
  const { actions } = await start();
  const image = screen.getByAltText('Live isolated Chromium browser');
  for (const percent of ['75%', '50%', '25%']) {
    fireEvent.click(screen.getByRole('button', { name: 'Zoom browser out' }));
    expect(screen.getByLabelText('Browser zoom').textContent).toBe(percent);
    expect(image.style.width).toBe(percent);
  }
  expect((screen.getByRole('button', { name: 'Zoom browser out' }) as HTMLButtonElement).disabled).toBe(true);
  for (let i = 0; i < 3; i++) fireEvent.click(screen.getByRole('button', { name: 'Zoom browser in' }));
  expect(image.style.width).toBe('100%');
  expect(actions).toEqual([]);
});
it('fits the compact frame to available height and places secure input first', async () => {
  await start();
  const image = screen.getByAltText('Live isolated Chromium browser');
  fireEvent.click(screen.getByRole('button', { name: 'Sign in', exact: true }));
  Object.defineProperty(image, 'naturalWidth', { value: 390, configurable: true });
  Object.defineProperty(image, 'naturalHeight', { value: 780, configurable: true });
  Object.defineProperty(image.parentElement, 'clientWidth', { value: 1000, configurable: true });
  Object.defineProperty(image.parentElement, 'clientHeight', { value: 400, configurable: true });
  fireEvent.click(screen.getByRole('button', { name: 'Fit screen' }));
  expect(parseFloat(image.style.maxWidth)).toBeCloseTo(200);
  const input = screen.getByLabelText('Secure browser input');
  expect(input.closest('aside')!.firstElementChild!.contains(input)).toBe(true);
});
it('focuses the desktop page for direct typing after selecting a website field', async () => {
  const { actions } = await start();
  const image = screen.getByAltText('Live isolated Chromium browser');
  fireEvent.click(image, { clientX: 20, clientY: 20, detail: 1 });
  expect(document.activeElement).toBe(image);
  fireEvent.keyDown(image, { key: '@', shiftKey: true });
  await waitFor(() => expect(actions.length).toBe(2));
  expect(actions[0].type).toBe('pointer_click');
  expect(actions[1]).toEqual({ type: 'type', text: '@' });
});
