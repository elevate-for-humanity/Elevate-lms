import { ELLIE_ROUTE_LABEL, routeEllieMessage, type EllieMessageRoute } from '@/lib/devstudio/ellie-message-router';

export type UnifiedChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: { tool: string; args: Record<string, unknown>; result: string }[];
  provider?: string;
  model?: string;
  action?: unknown;
};

export { routeEllieMessage, ELLIE_ROUTE_LABEL, type EllieMessageRoute };

export async function fetchAiHealth(): Promise<{
  ok: boolean;
  label: string;
  providers: Record<string, boolean>;
}> {
  try {
    const res = await fetch('/api/devstudio/health');
    const data = await res.json().catch(() => ({}));
    const providers = {
      groq: Boolean(data.hasGroq),
      openai: Boolean(data.hasOpenAI),
      anthropic: Boolean(data.hasAnthropic),
      gemini: Boolean(data.hasGemini),
    };
    const ok = res.ok && (providers.groq || providers.openai || providers.anthropic || providers.gemini);
    const label = [
      providers.groq && 'Groq',
      providers.openai && 'OpenAI',
      providers.anthropic && 'Claude',
      providers.gemini && 'Gemini',
    ]
      .filter(Boolean)
      .join(' / ');
    return { ok, label: label || 'no keys', providers };
  } catch {
    return { ok: false, label: 'offline', providers: {} };
  }
}

export async function sendOpsMessage(
  userMessage: string,
  history: { role: string; content: string }[],
  provider?: string,
  model?: string,
): Promise<{ reply: string; action?: unknown }> {
  const res = await fetch('/api/admin/ai-assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: userMessage,
      sessionId: 'ellie-unified',
      history,
      provider: provider && provider !== 'auto' ? provider : undefined,
      model: model && model !== 'auto' ? model : undefined,
    }),
  });
  const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
  if (!res.ok) throw new Error(data.error ?? 'Request failed');
  return { reply: data.reply ?? '', action: data.action ?? null };
}

export async function streamPlatformChat(
  messages: { role: string; content: string }[],
  opts: {
    fileContext?: string;
    documentsContext?: string;
    provider?: string;
    model?: string;
    onToken: (token: string) => void;
    onDone: (meta: {
      toolCalls?: UnifiedChatMessage['toolCalls'];
      provider?: string;
      model?: string;
    }) => void;
  },
): Promise<void> {
  const res = await fetch('/api/devstudio/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      fileContext: opts.fileContext,
      documentsContext: opts.documentsContext,
      provider: opts.provider,
      model: opts.model,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `HTTP ${res.status}`);
  }
  const reader = res.body?.getReader();
  if (!reader) {
    const data = await res.json();
    opts.onToken(data.message ?? data.reply ?? '');
    opts.onDone({ toolCalls: data.toolCalls, provider: data.provider, model: data.model });
    return;
  }
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const chunk = JSON.parse(line.slice(6));
        if (chunk.token !== undefined) opts.onToken(chunk.token);
        if (chunk.done) {
          opts.onDone({
            toolCalls: chunk.toolCalls,
            provider: chunk.provider,
            model: chunk.model,
          });
        }
      } catch {
        /* skip */
      }
    }
  }
}

export async function streamExecuteCommand(
  command: string,
  onLine: (text: string) => void,
): Promise<void> {
  const isSmoke = /smoke.?test|health.?check|check.*platform/i.test(command);
  const res = await fetch(
    isSmoke ? '/api/devstudio/smoke-test' : '/api/devstudio/execute',
    isSmoke
      ? undefined
      : {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command }),
        },
  );
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split('\n');
    buffer = chunks.pop() ?? '';
    for (const chunk of chunks) {
      if (!chunk.startsWith('data: ')) continue;
      const raw = chunk.slice(6).trim();
      if (!raw || raw === '[DONE]') continue;
      try {
        const parsed = JSON.parse(raw) as { line?: string; text?: string };
        onLine(parsed.line ?? parsed.text ?? raw);
      } catch {
        onLine(raw);
      }
    }
  }
}
