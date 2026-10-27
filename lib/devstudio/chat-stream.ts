export type StudioChatEvent = {
  token?: string;
  done?: boolean;
  error?: string;
  toolCalls?: { tool: string; args: Record<string, unknown>; result: string }[];
  provider?: string;
  model?: string;
  capabilitiesUsed?: string[];
};

/** A completed HTTP response is not proof that a Studio operation succeeded. */
export async function consumeStudioChatStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: StudioChatEvent) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let completed = false;
  try {
    while (!completed) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      if (buffer.length > 1_048_576) throw new Error('Studio stream event exceeds the size limit');
      let boundary: RegExpExecArray | null;
      while ((boundary = /\r?\n\r?\n/.exec(buffer))) {
        const frame = buffer.slice(0, boundary.index);
        buffer = buffer.slice(boundary.index + boundary[0].length);
        const data = frame.split(/\r?\n/)
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).replace(/^ /, '')).join('\n');
        if (!data) continue;
        const event: StudioChatEvent = JSON.parse(data);
        if (!event || typeof event !== 'object' || Array.isArray(event)) throw new Error('Invalid Studio stream event');
        if (event.error) throw new Error(event.error);
        if (event.token !== undefined && typeof event.token !== 'string') throw new Error('Invalid Studio stream token');
        onEvent(event);
        if (event.done === true) { completed = true; break; }
      }
      if (done && !completed) throw new Error('Studio response ended before completion. Check the run before retrying.');
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
