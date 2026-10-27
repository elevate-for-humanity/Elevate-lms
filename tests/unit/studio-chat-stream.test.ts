import { describe, expect, it } from 'vitest';
import { consumeStudioChatStream } from '@/lib/devstudio/chat-stream';

function stream(text: string, bytewise = false) {
  const bytes = new TextEncoder().encode(text);
  return new ReadableStream<Uint8Array>({ start(controller) {
    if (bytewise) for (const byte of bytes) controller.enqueue(Uint8Array.of(byte));
    else controller.enqueue(bytes);
    controller.close();
  } });
}
describe('Studio completion evidence', () => {
  it('decodes split Unicode and CRLF frames before accepting completion', async () => {
    const events: unknown[] = [];
    await consumeStudioChatStream(stream('data: {"token":"café 🧪"}\r\n\r\ndata: {"done":true,"provider":"elevate"}\r\n\r\n', true), event => events.push(event));
    expect(events).toEqual([{ token: 'café 🧪' }, { done: true, provider: 'elevate' }]);
  });
  it('rejects server failure instead of reporting success', async () => {
    const events: unknown[] = [];
    await expect(consumeStudioChatStream(stream('data: {"error":"Persistence failed","done":true}\n\n'), event => events.push(event))).rejects.toThrow('Persistence failed');
    expect(events).toEqual([]);
  });
  it('rejects truncated responses without inventing a completion', async () => {
    await expect(consumeStudioChatStream(stream('data: {"token":"Partial"}\n\n'), () => {})).rejects.toThrow('before completion');
  });
  it('does not swallow callback errors', async () => {
    await expect(consumeStudioChatStream(stream('data: {"done":true}\n\n'), () => { throw new Error('UI failure'); })).rejects.toThrow('UI failure');
  });
});
