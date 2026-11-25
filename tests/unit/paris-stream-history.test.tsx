import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import ParisChat from '@/components/paris/ParisChat';

vi.mock('next/navigation', () => ({
  usePathname: () => '/store',
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock('@/components/voice/useNaturalVoice', () => ({ useNaturalVoice: () => ({}) }));

const storageKey = 'elevate:paris:conversation:store';

beforeEach(() => {
  window.sessionStorage.clear();
  vi.stubGlobal('fetch', vi.fn());
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function startReply() {
  let stream!: ReadableStreamDefaultController<Uint8Array>;
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      stream = controller;
    },
  });
  vi.mocked(fetch).mockResolvedValue(new Response(body, {
    headers: { 'Content-Type': 'text/event-stream' },
  }));
  const chat = render(<ParisChat surface="store" showHeader={false} voiceEnabled={false} />);
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Help me compare accounts' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
  const emit = (event: Record<string, unknown>) => act(() => {
    stream.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`));
  });
  return { chat, emit, close: () => act(() => stream.close()) };
}

it('shows streamed text immediately and persists only the completed response', async () => {
  const reply = startReply();
  reply.emit({ delta: 'Initial fragment' });
  expect(await screen.findByText('Initial fragment')).toBeInTheDocument();
  expect(window.sessionStorage.getItem(storageKey)).not.toContain('Initial fragment');
  reply.emit({ done: true, reply: 'Final verified response' });
  reply.close();
  expect(await screen.findByText('Final verified response')).toBeVisible();
  await waitFor(() => expect(window.sessionStorage.getItem(storageKey)).toContain('Final verified response'));
});

it('aborts on close, and a reopened chat contains no unfinished assistant reply', async () => {
  const reply = startReply();
  reply.emit({ delta: 'Initial fragment' });
  expect(await screen.findByText('Initial fragment')).toBeInTheDocument();
  reply.chat.unmount();
  expect(vi.mocked(fetch).mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
  reply.close();
  render(<ParisChat surface="store" showHeader={false} voiceEnabled={false} />);
  expect(await screen.findByText('Help me compare accounts')).toBeInTheDocument();
  expect(screen.queryByText('Initial fragment')).not.toBeInTheDocument();
});

it('uses the fallback when the stream closes without completion', async () => {
  const reply = startReply();
  reply.emit({ delta: 'Initial fragment' });
  reply.close();
  expect(await screen.findByText(/cannot reach the live advisor/i)).toBeInTheDocument();
  expect(window.sessionStorage.getItem(storageKey)).not.toContain('Initial fragment');
});
