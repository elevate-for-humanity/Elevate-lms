import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { aiChat } = vi.hoisted(() => ({ aiChat: vi.fn() }));
vi.mock('@/lib/ai/ai-service', () => ({ aiChat, isAIAvailable: () => true }));
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

describe('Marketing PARIS gateway', () => {
  beforeEach(() => {
    aiChat.mockReset();
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
