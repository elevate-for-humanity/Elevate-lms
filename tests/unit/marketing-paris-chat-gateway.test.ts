import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { aiChat, aiChatStream, getActiveProviderName } = vi.hoisted(() => ({
  aiChat: vi.fn(),
  aiChatStream: vi.fn(),
  getActiveProviderName: () => 'elevate',
}));
vi.mock('@/lib/ai/ai-service', () => ({ aiChat, aiChatStream, getActiveProviderName, isAIAvailable: () => true }));
vi.mock('@/lib/config/platform-config', () => ({ PLATFORM_DEFAULTS: {} }));

import { POST, maxDuration } from '../../apps/marketing/app/api/ai-chat/route';

function storeQuestion() {
  return new NextRequest('https://store.elevateforhumanity.org/api/ai-chat', {
    method: 'POST',
    body: JSON.stringify({
      context: { surface: 'store' },
      messages: [{ role: 'user', content: 'How do I compare plans?' }],
    }),
  });
}

function streamQuestion() {
  return new NextRequest('https://www.elevateforhumanity.org/api/ai-chat', {
    method: 'POST',
    body: JSON.stringify({
      stream: true,
      context: { surface: 'public' },
      messages: [{ role: 'user', content: 'Tell me about the barber program.' }],
    }),
  });
}

function sseEvents(text: string) {
  return text
    .split('\n\n')
    .filter(Boolean)
    .map((block) => {
      const line = block.split('\n').find((entry) => entry.startsWith('data:'));
      return JSON.parse(line.slice(5).trim());
    });
}

describe('Marketing PARIS gateway', () => {
  beforeEach(() => {
    aiChat.mockReset();
    aiChatStream.mockReset();
  });

  it('returns the live provider reply', async () => {
    aiChat.mockResolvedValue({ content: 'Compare plans on the Store plans page.', provider: 'elevate' });
    const response = await POST(storeQuestion());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      reply: 'Compare plans on the Store plans page.',
      provider: 'elevate',
      mode: 'ai',
      liveAiAvailable: true,
    });
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('streams tokens as server-sent events and ends with done metadata', async () => {
    aiChatStream.mockImplementation(async function* () {
      yield 'Barber is ';
      yield 'RAPIDS 0030CB.';
    });
    const response = await POST(streamQuestion());
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');
    expect(sseEvents(await response.text())).toEqual([
      { token: 'Barber is ' },
      { token: 'RAPIDS 0030CB.' },
      { provider: 'elevate', mode: 'ai', liveAiAvailable: true, done: true },
    ]);
    expect(aiChat).not.toHaveBeenCalled();
  });

  it('streams the guided fallback when live inference fails before any token', async () => {
    aiChatStream.mockImplementation(async function* () {
      throw new Error('MODEL_OFFLINE');
    });
    const response = await POST(streamQuestion());
    expect(response.status).toBe(200);
    const events = sseEvents(await response.text());
    expect(events[events.length - 1]).toMatchObject({
      mode: 'guided',
      liveAiAvailable: false,
      done: true,
    });
    expect(events.map((event) => event.token ?? '').join('')).toContain('RAPIDS 0030CB');
    expect(aiChat).not.toHaveBeenCalled();
  });

  it('cancels an unfinished completion before the route expires', async () => {
    const deadline = new AbortController();
    const timeout = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(deadline.signal);
    try {
      aiChat.mockImplementation(({ signal }: { signal: AbortSignal }) => {
        const completion = new Promise((_, reject) => {
          signal.addEventListener('abort', () => reject(signal.reason), { once: true });
        });
        deadline.abort(new DOMException('Inference deadline exceeded', 'TimeoutError'));
        return completion;
      });

      const response = await POST(storeQuestion());
      // The warm-model budget must still leave a full minute for cleanup and fallback.
      expect(maxDuration).toBe(180);
      expect(timeout).toHaveBeenCalledTimes(1);
      expect(timeout).toHaveBeenCalledWith(120_000);
      expect(maxDuration * 1_000 - timeout.mock.calls[0][0]).toBeGreaterThanOrEqual(60_000);
      expect(aiChat).toHaveBeenCalledTimes(1);
      expect(deadline.signal.aborted).toBe(true);
      expect(await response.json()).toMatchObject({ mode: 'guided' });
    } finally {
      timeout.mockRestore();
    }
  });
});
