import { describe, expect, it, vi } from 'vitest';
import { studioTextStreamResponse } from '@/lib/devstudio/studio-text-stream';

describe('Studio model streaming', () => {
  it('delivers the first model delta before generation or auditing finishes', async () => {
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const complete = vi.fn(async (content: string) => ({ provider: 'elevate', content }));
    const response = studioTextStreamResponse({
      tokens: async function* () { yield 'first'; await gate; yield ' second'; },
      complete, errorMessage: 'safe error',
    });
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    const reader = response.body!.getReader();
    const first = await reader.read();
    expect(new TextDecoder().decode(first.value)).toContain('"token":"first"');
    expect(complete).not.toHaveBeenCalled();
    release();
    let remainder = '';
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      remainder += new TextDecoder().decode(chunk.value);
    }
    expect(complete).toHaveBeenCalledWith('first second');
    expect(remainder).toContain('"done":true');
  });

  it('does not report completion for failed generation or expose internal errors', async () => {
    const complete = vi.fn(async () => ({}));
    const response = studioTextStreamResponse({
      tokens: async function* () { yield 'partial'; throw new Error('private diagnostic'); },
      complete, onError: () => { throw new Error('logger unavailable'); }, errorMessage: 'safe error',
    });
    const body = await response.text();
    expect(body).toContain('safe error');
    expect(body).not.toContain('private diagnostic');
    expect(body).not.toContain('"done":true');
    expect(complete).not.toHaveBeenCalled();
  });

  it('cancels owned inference when the response reader is cancelled', async () => {
    let signal!: AbortSignal;
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const complete = vi.fn(async () => ({}));
    const response = studioTextStreamResponse({
      tokens: async function* (requestSignal) { signal = requestSignal; yield 'first'; await gate; },
      complete, errorMessage: 'safe error',
    });
    const reader = response.body!.getReader();
    await reader.read();
    await reader.cancel();
    expect(signal.aborted).toBe(true);
    release();
    expect(complete).not.toHaveBeenCalled();
  });

  it('rejects an empty generation instead of marking it complete', async () => {
    const complete = vi.fn(async () => ({}));
    const response = studioTextStreamResponse({
      tokens: async function* () {}, complete, errorMessage: 'safe error',
    });
    expect(await response.text()).toContain('safe error');
    expect(complete).not.toHaveBeenCalled();
  });
});
