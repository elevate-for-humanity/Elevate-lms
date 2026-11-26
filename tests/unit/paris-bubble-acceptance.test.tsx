import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ParisFloatingButton } from '@/components/paris/ParisFloatingButton';

// jsdom does not implement scrollIntoView (the repo setup file polyfills it).
Element.prototype.scrollIntoView = () => {};

function sseResponse(chunks: string[], hang = false) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      if (!hang) controller.close();
    },
  });
  return {
    ok: true,
    status: 200,
    headers: { get: (name: string) => (name === 'content-type' ? 'text/event-stream' : null) },
    body: stream,
    json: async () => ({}),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  window.sessionStorage.clear();
  document.body.innerHTML = '';
});

it('public bubble: chip tap streams a text answer and there is no voice control', async () => {
  const fetchMock = vi.fn(async () =>
    sseResponse([
      `data: ${JSON.stringify({ delta: 'Healthcare programs include ' })}\n\n`,
      `data: ${JSON.stringify({ delta: 'CNA and phlebotomy.' })}\n\n`,
      `data: ${JSON.stringify({ done: true, mode: 'ai', liveAiAvailable: true, reply: 'Healthcare programs include CNA and phlebotomy.' })}\n\n`,
    ]),
  );
  vi.stubGlobal('fetch', fetchMock);

  render(<ParisFloatingButton surface="public" />);
  fireEvent.click(screen.getByRole('button', { name: 'Open PARIS Career Assistant' }));
  // No speaker / hear-PARIS control exists in the public bubble.
  expect(screen.queryByRole('button', { name: /Hear PARIS|Stop PARIS voice/i })).toBeNull();

  fireEvent.click(await screen.findByRole('button', { name: /Healthcare/i }));
  await waitFor(() =>
    expect(screen.getByText(/Healthcare programs include CNA and phlebotomy\./)).toBeTruthy(),
  );
  expect(fetchMock).toHaveBeenCalledWith('/api/ai-chat', expect.objectContaining({ method: 'POST' }));
});

it('public bubble: Close works mid-request and aborts the in-flight request', async () => {
  let capturedSignal: AbortSignal | undefined;
  const fetchMock = vi.fn((_url: string, init: RequestInit) => {
    capturedSignal = init.signal ?? undefined;
    return new Promise((resolve, reject) => {
      init.signal?.addEventListener('abort', () =>
        reject(new DOMException('The operation was aborted.', 'AbortError')),
      );
    });
  });
  vi.stubGlobal('fetch', fetchMock);

  render(<ParisFloatingButton surface="public" />);
  fireEvent.click(screen.getByRole('button', { name: 'Open PARIS Career Assistant' }));
  fireEvent.click(await screen.findByRole('button', { name: /Healthcare/i }));

  // The request is in flight and the working indicator is showing.
  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  expect(screen.getByText(/Working on your request/i)).toBeTruthy();
  expect(capturedSignal?.aborted).toBe(false);

  fireEvent.click(screen.getByRole('button', { name: 'Close PARIS' }));
  expect(screen.queryByRole('dialog')).toBeNull();
  await waitFor(() => expect(capturedSignal?.aborted).toBe(true));
});
