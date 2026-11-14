type StudioTextStreamOptions = {
  tokens: (signal: AbortSignal) => AsyncIterable<string>;
  signal?: AbortSignal;
  complete: (content: string) => Promise<Record<string, unknown>>;
  onError?: (error: unknown) => void;
  errorMessage: string;
};

/** Forward actual model deltas; never replay a buffered answer as streaming. */
export function studioTextStreamResponse(options: StudioTextStreamOptions): Response {
  const cancellation = new AbortController();
  const signal = options.signal
    ? AbortSignal.any([options.signal, cancellation.signal])
    : cancellation.signal;
  const encoder = new TextEncoder();
  let cancelled = false;
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (value: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(value)}\n\n`));
      let content = '';
      try {
        for await (const token of options.tokens(signal)) {
          if (cancelled) return;
          content += token;
          emit({ token });
        }
        if (!content.trim()) throw new Error('Model stream returned no answer');
        const metadata = await options.complete(content);
        if (!cancelled) emit({ ...metadata, done: true });
      } catch (error) {
        try { options.onError?.(error); } catch { /* Diagnostic hooks cannot replace the response error. */ }
        if (!cancelled) emit({ error: options.errorMessage });
      } finally {
        if (!cancelled) controller.close();
      }
    },
    cancel() {
      cancelled = true;
      cancellation.abort();
    },
  });
  return new Response(body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-store',
      'X-Accel-Buffering': 'no',
      Connection: 'keep-alive',
    },
  });
}
