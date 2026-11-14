import { afterEach, describe, expect, it, vi } from 'vitest';
import { ElevateProvider } from '@/lib/ai/providers/elevate';

const encoder = new TextEncoder();
const frame = (content: string) => `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\r\n\r\n`;

describe('owned model streaming', () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  function configure(response: Response) {
    vi.stubEnv('ELEVATE_LLM_URL', 'https://owned-provider.test');
    vi.stubEnv('ELEVATE_LLM_SECRET', 'owned-secret');
    const request = vi.fn().mockResolvedValue(response);
    vi.stubGlobal('fetch', request);
    return request;
  }

  it('yields the first model delta before the response finishes', async () => {
    let source!: ReadableStreamDefaultController<Uint8Array>;
    const body = new ReadableStream<Uint8Array>({ start(controller) { source = controller; } });
    const request = configure(new Response(body, { headers: { 'content-type': 'text/event-stream' } }));
    const stream = new ElevateProvider().chatStream({ messages: [{ role: 'user', content: 'Explain apprenticeship.' }] });
    const first = stream.next();
    source.enqueue(encoder.encode(frame('Start here.')));
    await expect(first).resolves.toEqual({ value: 'Start here.', done: false });
    source.enqueue(encoder.encode('data: [DONE]\r\n\r\n'));
    source.close();
    await expect(stream.next()).resolves.toEqual({ value: undefined, done: true });
    expect(JSON.parse(request.mock.calls[0][1].body).stream).toBe(true);
    expect(request.mock.calls[0][0]).toBe('https://owned-provider.test/v1/chat/completions');
  });

  it('preserves Unicode and events split across arbitrary byte boundaries', async () => {
    const bytes = encoder.encode(frame('Hello 🎓') + frame(' applicant') + 'data: [DONE]\n\n');
    const body = new ReadableStream<Uint8Array>({ start(controller) {
      for (let index = 0; index < bytes.length; index++) controller.enqueue(bytes.slice(index, index + 1));
      controller.close();
    } });
    configure(new Response(body, { headers: { 'content-type': 'text/event-stream' } }));
    const chunks: string[] = [];
    for await (const chunk of new ElevateProvider().chatStream({ messages: [{ role: 'user', content: 'Hello' }] })) chunks.push(chunk);
    expect(chunks).toEqual(['Hello 🎓', ' applicant']);
  });

  it('fails on an interrupted model response instead of persisting it as complete', async () => {
    configure(new Response(frame('Partial answer'), { headers: { 'content-type': 'text/event-stream' } }));
    const consume = async () => { for await (const _ of new ElevateProvider().chatStream({ messages: [{ role: 'user', content: 'Hello' }] })) {} };
    await expect(consume()).rejects.toThrow('ended before completion');
  });

  it('cancels the upstream body when a consumer stops reading', async () => {
    const cancel = vi.fn();
    configure(new Response(new ReadableStream<Uint8Array>({
      start(controller) { controller.enqueue(encoder.encode(frame('Hello'))); }, cancel,
    }), { headers: { 'content-type': 'text/event-stream' } }));
    const stream = new ElevateProvider().chatStream({ messages: [{ role: 'user', content: 'Hello' }] });
    await stream.next();
    await stream.return(undefined);
    expect(cancel).toHaveBeenCalledOnce();
  });
});
